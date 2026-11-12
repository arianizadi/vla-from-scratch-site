/**
 * The three.js side of the replay: the table, the arm drawn from forward
 * kinematics, the objects, the gripper's path and the marks, and the HTML
 * labels that follow them. This module is imported dynamically, when the
 * figure comes into view, so three.js is not part of any page's first load.
 *
 * It draws on demand: nothing renders unless the time, the size, the colours
 * or the camera change.
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import type { Trace } from "@/data/files";
import { formatMm } from "@/data/format";
import { OBJECTS } from "@/data/labels";
import type { ObjectId } from "@/data/types";
import {
  FINGER_BASE_D,
  FRAME_BOX,
  PLAN_BOX,
  FRONT_CAMERA_DIRECTION,
  MAX_OPENING,
  OBJECT_SHAPES,
  OBJECT_TOP,
  TABLE,
  TCP_D,
  mix,
  mixAngle,
  pandaPose,
  type ObjectPart,
  type Vec3,
} from "./kinematics";
import { closeReading, closeSteps, moveShownAt } from "./model";

export interface Palette {
  surface: string;
  bg: string;
  surface2: string;
  grid: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  objects: Record<ObjectId, string>;
}

export type ViewName = "front" | "plan" | "side";

const Z = new THREE.Vector3(0, 0, 1);
const Y = new THREE.Vector3(0, 1, 0);

const VIEW_DIRECTIONS: Record<ViewName, Vec3> = {
  front: FRONT_CAMERA_DIRECTION,
  // Straight down, very slightly from behind the base, so x points up the screen.
  plan: [-0.002, 0, 1],
  side: [0.05, -1, 0.22],
};

/** The arm's rest pose, shown until a rollout has loaded. */
const HOME = [0, 0, 0, -Math.PI / 2, 0, Math.PI / 2, -Math.PI / 4];

const LINK_RADIUS = 0.038;
const JOINT_RADIUS = 0.05;
const JOINT_LENGTH = 0.1;

type Placement = "above" | "below";

interface Tag {
  element: HTMLSpanElement;
  /** A line from the label to its point, shown when the label had to move out of another's way. */
  leader: HTMLSpanElement;
  /** The label's size, measured once per text: reading it every frame would force a layout per label. */
  size: { width: number; height: number } | null;
  anchor: THREE.Vector3;
  visible: boolean;
  placement: Placement;
  /** Lower is placed first and never moves for another label. */
  priority: number;
}

/** A solid with drawn edges: the look of a line drawing with a flat tint. */
function solid(geometry: THREE.BufferGeometry, fill: THREE.Material, edge: THREE.LineBasicMaterial): THREE.Group {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geometry, fill));
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 30), edge));
  return group;
}

function partGeometry(part: ObjectPart): THREE.BufferGeometry {
  if (part.kind === "box") return new THREE.BoxGeometry(...part.size);
  const geometry = new THREE.CylinderGeometry(part.radius, part.radius, part.height, part.sides);
  geometry.rotateX(Math.PI / 2);
  // A hexagonal prism with a flat face along x, as a nut is drawn.
  if (part.sides === 6) geometry.rotateZ(Math.PI / 6);
  return geometry;
}

function toVector(point: readonly number[], z?: number): THREE.Vector3 {
  return new THREE.Vector3(point[0], point[1], z ?? point[2] ?? 0);
}

export class ReplayScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1.6, 0.02, 30);
  private readonly controls: OrbitControls;
  private readonly overlay: HTMLDivElement;
  private width = 1;
  private height = 1;
  private disposed = false;
  private view: ViewName = "front";
  /** The reader has turned the view since a named view was chosen. */
  private turned = false;
  private palette: Palette | null = null;

  // Materials whose colours follow the theme.
  private readonly tableFill = new THREE.MeshBasicMaterial();
  private readonly gridLine = new THREE.LineBasicMaterial();
  private readonly tableEdge = new THREE.LineBasicMaterial();
  private readonly linkFill = new THREE.MeshLambertMaterial();
  private readonly jointFill = new THREE.MeshLambertMaterial();
  private readonly handFill = new THREE.MeshLambertMaterial();
  private readonly armEdge = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 });
  private readonly inkFill = new THREE.MeshBasicMaterial();
  private readonly objectEdge = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 });
  private readonly ghostEdge = new THREE.LineDashedMaterial({ dashSize: 0.006, gapSize: 0.004 });
  private readonly moveLine = new THREE.LineDashedMaterial({ dashSize: 0.008, gapSize: 0.006 });
  private readonly shadowLine = new THREE.LineBasicMaterial();
  private readonly dropLine = new THREE.LineDashedMaterial({ dashSize: 0.01, gapSize: 0.008 });
  private readonly dimensionLine: LineMaterial;
  private readonly objectFills = new Map<ObjectId, THREE.MeshLambertMaterial>();
  private readonly pathDone: LineMaterial;
  private readonly pathAhead: LineMaterial;

  // The arm.
  private readonly links: THREE.Group[] = [];
  private readonly joints: THREE.Group[] = [];
  private readonly hand = new THREE.Group();
  private readonly fingers: THREE.Group[] = [];

  // What belongs to the rollout shown.
  private readonly rollout = new THREE.Group();
  private trace: Trace | null = null;
  private objects = new Map<ObjectId, THREE.Group>();
  private ghost: THREE.Group | null = null;
  private move: THREE.Line | null = null;
  /** The first step at which the moved object stands at its new place. */
  private moveAt: number | null = null;
  private done: Line2 | null = null;
  private head: Line2 | null = null;
  private ahead: Line2 | null = null;
  private shadow: THREE.Line | null = null;
  private readonly drop: THREE.Line;
  private readonly foot: THREE.Mesh;
  private closeMarks: { step: number; ring: THREE.Mesh; dot: THREE.Mesh }[] = [];
  private dimensions: { toObject: Line2; toOld: Line2 } | null = null;
  private tags: Tag[] = [];
  private objectTags = new Map<ObjectId, Tag>();
  private ghostTag: Tag | null = null;
  private closeTag: Tag | null = null;
  private toObjectTag: Tag | null = null;
  private toOldTag: Tag | null = null;
  private time = 0;
  /** The reader pressed on the view; the first change of the camera after it is a turn. */
  private pressing = false;
  private readonly ringGeometry = new THREE.RingGeometry(0.009, 0.0125, 32);
  private readonly dotGeometry = new THREE.SphereGeometry(0.0065, 16, 12);

  constructor(
    host: HTMLElement,
    overlay: HTMLDivElement,
    private readonly onUserTurn: () => void,
  ) {
    this.overlay = overlay;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.domElement.className = "ar-canvas";
    // The canvas is described by its container; it holds no text of its own.
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(this.renderer.domElement);

    this.camera.up.copy(Z);

    this.pathDone = new LineMaterial({ linewidth: 2.5, worldUnits: false });
    this.pathAhead = new LineMaterial({ linewidth: 1.5, worldUnits: false, dashed: true, dashSize: 0.012, gapSize: 0.008 });
    this.dimensionLine = new LineMaterial({ linewidth: 1.5, worldUnits: false });

    this.buildTable();
    this.buildArm();

    this.drop = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), this.dropLine);
    this.foot = new THREE.Mesh(new THREE.RingGeometry(0.004, 0.0065, 24), this.inkFill);
    this.scene.add(this.drop, this.foot, this.rollout);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(0.4, -0.6, 1.6);
    this.scene.add(sun);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = false;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
    this.controls.rotateSpeed = 0.7;
    // One finger turns the view sideways; a vertical swipe still scrolls the page.
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.ROTATE };
    this.renderer.domElement.style.touchAction = "pan-y";
    this.controls.addEventListener("start", this.handleStart);
    this.controls.addEventListener("end", this.handleEnd);
    this.controls.addEventListener("change", this.handleChange);

    // Labels measured before the web font arrived are measured again.
    document.fonts?.ready.then(() => {
      if (this.disposed) return;
      for (const tag of this.tags) tag.size = null;
      this.render();
    });
  }

  // A press alone (to focus the view, say) does not turn it: the view is turned at the first change that follows.
  private handleStart = () => {
    this.pressing = true;
  };

  private handleEnd = () => {
    this.pressing = false;
  };

  private handleChange = () => {
    if (this.pressing && !this.turned) {
      this.turned = true;
      this.onUserTurn();
    }
    this.render();
  };

  // ---------------------------------------------------------------- building

  private buildTable() {
    const [x0, x1] = TABLE.x;
    const [y0, y1] = TABLE.y;
    const top = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), this.tableFill);
    top.position.set((x0 + x1) / 2, (y0 + y1) / 2, -0.0005);
    this.scene.add(top);

    // A 10 cm grid over the table: the scale of the drawing.
    const points: THREE.Vector3[] = [];
    for (let x = Math.ceil(x0 * 10) / 10; x <= x1 + 1e-9; x += 0.1) {
      points.push(new THREE.Vector3(x, y0, 0), new THREE.Vector3(x, y1, 0));
    }
    for (let y = Math.ceil(y0 * 10) / 10; y <= y1 + 1e-9; y += 0.1) {
      points.push(new THREE.Vector3(x0, y, 0), new THREE.Vector3(x1, y, 0));
    }
    this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), this.gridLine));

    const outline = [
      new THREE.Vector3(x0, y0, 0),
      new THREE.Vector3(x1, y0, 0),
      new THREE.Vector3(x1, y1, 0),
      new THREE.Vector3(x0, y1, 0),
      new THREE.Vector3(x0, y0, 0),
    ];
    this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(outline), this.tableEdge));
  }

  private buildArm() {
    const base = solid(new THREE.CylinderGeometry(0.075, 0.085, 0.05, 32).rotateX(Math.PI / 2), this.jointFill, this.armEdge);
    base.position.set(0, 0, 0.025);
    this.scene.add(base);

    const pose = pandaPose(HOME);
    const linkGeometry = new THREE.CylinderGeometry(LINK_RADIUS, LINK_RADIUS, 1, 20, 1, true);
    for (let index = 0; index < pose.chain.length - 1; index += 1) {
      const link = solid(linkGeometry, this.linkFill, this.armEdge);
      this.links.push(link);
      this.scene.add(link);
    }
    const jointGeometry = new THREE.CylinderGeometry(JOINT_RADIUS, JOINT_RADIUS, JOINT_LENGTH, 24);
    for (let index = 0; index < pose.joints.length; index += 1) {
      const joint = solid(jointGeometry, this.jointFill, this.armEdge);
      this.joints.push(joint);
      this.scene.add(joint);
    }

    // The hand, in its own frame: z along the fingers, y the axis they close along.
    this.hand.matrixAutoUpdate = false;
    const palm = solid(new THREE.BoxGeometry(0.05, 0.2, FINGER_BASE_D - 0.004), this.handFill, this.armEdge);
    palm.position.set(0, 0, FINGER_BASE_D / 2);
    this.hand.add(palm);
    const fingerLength = TCP_D - FINGER_BASE_D + 0.008;
    for (const side of [-1, 1]) {
      const finger = solid(new THREE.BoxGeometry(0.02, 0.012, fingerLength), this.handFill, this.armEdge);
      finger.userData.side = side;
      finger.position.set(0, side * (MAX_OPENING / 2 + 0.006), FINGER_BASE_D + fingerLength / 2);
      this.fingers.push(finger);
      this.hand.add(finger);
    }
    this.scene.add(this.hand);
    this.poseArm(HOME, 1);
  }

  private tag(text: string, className: string, priority: number, placement: Placement = "above"): Tag {
    const element = document.createElement("span");
    element.className = `ar-tag ${className}`;
    element.textContent = text;
    const leader = document.createElement("span");
    leader.className = "ar-leader";
    // Leaders go under every label, so a leader that passes behind another label is covered by it.
    this.overlay.prepend(leader);
    this.overlay.appendChild(element);
    const tag: Tag = { element, leader, size: null, anchor: new THREE.Vector3(), visible: false, placement, priority };
    this.tags.push(tag);
    return tag;
  }

  private setTagText(tag: Tag, text: string) {
    if (tag.element.textContent === text) return;
    tag.element.textContent = text;
    tag.size = null;
  }

  private clearRollout() {
    for (const child of [...this.rollout.children]) {
      this.rollout.remove(child);
      child.traverse((node) => {
        const geometry = (node as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
        // The marks of the closes share two geometries, kept for the next rollout.
        if (geometry && geometry !== this.ringGeometry && geometry !== this.dotGeometry) geometry.dispose();
      });
    }
    for (const tag of this.tags) {
      tag.element.remove();
      tag.leader.remove();
    }
    this.tags = [];
    this.objectTags.clear();
    this.objects.clear();
    this.ghost = null;
    this.move = null;
    this.moveAt = null;
    this.done = null;
    this.head = null;
    this.ahead = null;
    this.shadow = null;
    this.closeMarks = [];
    this.dimensions = null;
    this.ghostTag = null;
    this.closeTag = null;
    this.toObjectTag = null;
    this.toOldTag = null;
  }

  private objectSolid(id: ObjectId, fill: THREE.Material | null, edge: THREE.LineBasicMaterial | THREE.LineDashedMaterial) {
    const group = new THREE.Group();
    for (const part of OBJECT_SHAPES[id]) {
      const geometry = partGeometry(part);
      if (fill) {
        const mesh = new THREE.Mesh(geometry, fill);
        mesh.position.set(...part.offset);
        group.add(mesh);
      }
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 30), edge);
      lines.computeLineDistances();
      lines.position.set(...part.offset);
      group.add(lines);
    }
    return group;
  }

  /** Shows another rollout, or nothing. */
  setTrace(trace: Trace | null) {
    this.clearRollout();
    this.trace = trace;
    if (!trace) {
      this.render();
      return;
    }

    for (const id of trace.objects) {
      if (!trace.poses[id]) continue;
      let fill = this.objectFills.get(id);
      if (!fill) {
        fill = new THREE.MeshLambertMaterial();
        this.objectFills.set(id, fill);
      }
      const group = this.objectSolid(id, fill, this.objectEdge);
      this.objects.set(id, group);
      this.rollout.add(group);
      const named = id === trace.target;
      const tag = this.tag(named ? `${OBJECTS[id].short}, named` : OBJECTS[id].short, named ? "ar-tag-named" : "", named ? 3 : 4);
      this.objectTags.set(id, tag);
    }

    this.moveAt = moveShownAt(trace);
    if (trace.moved && this.moveAt !== null) {
      // The last pose at the old place, and the first at the new one.
      const start = trace.poses[trace.target]?.[Math.max(0, this.moveAt - 1)];
      this.ghost = this.objectSolid(trace.target, null, this.ghostEdge);
      this.ghost.position.set(trace.moved.from[0], trace.moved.from[1], start?.[2] ?? 0);
      this.ghost.rotation.z = start?.[3] ?? 0;
      this.rollout.add(this.ghost);
      const to = trace.poses[trace.target]?.[this.moveAt];
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          toVector(trace.moved.from, 0.001),
          toVector(to ? [to[0], to[1]] : trace.moved.to, 0.001),
        ]),
        this.moveLine,
      );
      line.computeLineDistances();
      this.move = line;
      this.rollout.add(line);
      this.ghostTag = this.tag("where it was", "ar-tag-quiet", 5, "below");
      this.ghostTag.anchor.set(trace.moved.from[0], trace.moved.from[1], 0);
    }

    // The gripper's path: what it has done so far, solid; what is still to come, dashed and faint.
    const flat = trace.tcp.flatMap((point) => [point[0], point[1], point[2]]);
    const path = new LineGeometry();
    path.setPositions(flat);
    this.ahead = new Line2(path, this.pathAhead);
    this.ahead.computeLineDistances();
    this.done = new Line2(path.clone(), this.pathDone);
    this.done.renderOrder = 2;
    this.head = new Line2(new LineGeometry(), this.pathDone);
    this.head.renderOrder = 2;
    this.rollout.add(this.ahead, this.done, this.head);

    this.shadow = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(trace.tcp.map((point) => new THREE.Vector3(point[0], point[1], 0.0008))),
      this.shadowLine,
    );
    this.rollout.add(this.shadow);

    this.closeMarks = closeSteps(trace).map((step) => {
      const point = trace.tcp[step];
      const ring = new THREE.Mesh(this.ringGeometry, this.inkFill);
      ring.position.set(point[0], point[1], 0.0012);
      const dot = new THREE.Mesh(this.dotGeometry, this.inkFill);
      dot.position.set(point[0], point[1], point[2]);
      this.rollout.add(ring, dot);
      return { step, ring, dot };
    });
    if (this.closeMarks.length) {
      this.dimensions = {
        toObject: new Line2(new LineGeometry(), this.dimensionLine),
        toOld: new Line2(new LineGeometry(), this.dimensionLine),
      };
      this.rollout.add(this.dimensions.toObject, this.dimensions.toOld);
      this.closeTag = this.tag("", "ar-tag-close", 0);
      this.toObjectTag = this.tag("", "ar-tag-dimension", 1, "below");
      this.toOldTag = this.tag("", "ar-tag-dimension", 2, "below");
    }

    this.applyObjectColours();
    this.setTime(this.time);
  }

  // ---------------------------------------------------------------- moving

  private poseArm(q: readonly number[], opening: number) {
    const pose = pandaPose(q);
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();
    this.links.forEach((link, index) => {
      const a = pose.chain[index];
      const b = pose.chain[index + 1];
      if (!a || !b) return;
      from.set(...a);
      to.set(...b);
      const direction = to.clone().sub(from);
      const length = direction.length();
      link.position.copy(from).add(to).multiplyScalar(0.5);
      link.quaternion.setFromUnitVectors(Y, direction.normalize());
      link.scale.set(1, length, 1);
    });
    this.joints.forEach((joint, index) => {
      const entry = pose.joints[index];
      joint.position.set(...entry.at);
      joint.quaternion.setFromUnitVectors(Y, new THREE.Vector3(...entry.axis).normalize());
    });
    const m = pose.hand;
    this.hand.matrix.set(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11], 0, 0, 0, 1);
    this.hand.matrixWorldNeedsUpdate = true;
    for (const finger of this.fingers) {
      const side = finger.userData.side as number;
      finger.position.y = side * ((MAX_OPENING * Math.min(1, Math.max(0, opening))) / 2 + 0.006);
    }
  }

  /** Shows the rollout at a time in control steps; between two steps, the pose in between. */
  setTime(time: number) {
    this.time = time;
    const trace = this.trace;
    if (!trace || trace.steps === 0) {
      this.render();
      return;
    }
    const last = trace.steps - 1;
    const t = Math.min(last, Math.max(0, time));
    const step = Math.floor(t);
    const next = Math.min(last, step + 1);
    const f = t - step;

    this.poseArm(mix(trace.q[step], trace.q[next], f), (trace.grip[step] ?? 1) + ((trace.grip[next] ?? 1) - (trace.grip[step] ?? 1)) * f);

    for (const [id, group] of this.objects) {
      const poses = trace.poses[id];
      if (!poses) continue;
      const a = poses[step];
      // A move is a jump: never slide an object between its old and new place.
      const b = id === trace.target && this.moveAt !== null && next === this.moveAt ? a : poses[next];
      const p = mix(a, b, f);
      group.position.set(p[0], p[1], p[2]);
      group.rotation.z = mixAngle(a[3], b[3], f);
      const tag = this.objectTags.get(id);
      if (tag) {
        tag.anchor.set(p[0], p[1], p[2] + OBJECT_TOP[id] + 0.012);
        tag.visible = true;
      }
    }

    const tcp = mix(trace.tcp[step], trace.tcp[next], f);
    const moved = this.moveAt !== null && step >= this.moveAt;
    if (this.ghost) this.ghost.visible = moved;
    if (this.move) this.move.visible = moved;
    if (this.ghostTag) this.ghostTag.visible = moved;

    if (this.done) {
      this.done.geometry.instanceCount = step;
      this.done.visible = step > 0;
    }
    if (this.head) {
      const a = trace.tcp[step];
      this.head.geometry.setPositions([a[0], a[1], a[2], tcp[0], tcp[1], tcp[2]]);
      this.head.visible = f > 0;
    }
    if (this.shadow) this.shadow.geometry.setDrawRange(0, step + 1);

    const drop = this.drop.geometry.attributes.position as THREE.BufferAttribute;
    drop.setXYZ(0, tcp[0], tcp[1], tcp[2]);
    drop.setXYZ(1, tcp[0], tcp[1], 0.001);
    drop.needsUpdate = true;
    this.drop.computeLineDistances();
    this.foot.position.set(tcp[0], tcp[1], 0.0012);

    let latest: number | null = null;
    for (const mark of this.closeMarks) {
      const reached = step >= mark.step;
      mark.ring.visible = reached;
      mark.dot.visible = reached;
      if (reached) latest = mark.step;
    }
    this.placeDimensions(trace, latest, moved);
    this.render();
  }

  /**
   * The distances at the latest close reached: to the object where it stood at
   * the close, and, when it had been moved before the close, to where it was.
   * `moved` says whether the object has been moved by the step shown.
   */
  private placeDimensions(trace: Trace, step: number | null, moved: boolean) {
    const dimensions = this.dimensions;
    if (!dimensions || !this.closeTag || !this.toObjectTag || !this.toOldTag) return;
    const show = step !== null;
    dimensions.toObject.visible = show;
    dimensions.toOld.visible = false;
    this.closeTag.visible = show;
    this.toObjectTag.visible = show;
    this.toOldTag.visible = false;
    if (step === null) return;

    const tcp = trace.tcp[step];
    const reading = closeReading(trace, step);
    this.setTagText(this.closeTag, `closed, step ${step}`);
    this.closeTag.anchor.set(tcp[0], tcp[1], tcp[2] + 0.02);

    const set = (line: Line2, a: readonly number[], b: readonly number[]) => {
      line.geometry.setPositions([a[0], a[1], 0.0015, b[0], b[1], 0.0015]);
    };
    const object = OBJECTS[trace.target].short.toLowerCase();
    const target = trace.poses[trace.target]?.[step];
    // Closed before the object was moved (or as it was taken away), and shown after: the place it closed at is now the old place.
    const atOldPlace = moved && this.moveAt !== null && step < this.moveAt;
    if (target && reading.toObjectMm !== null) {
      set(dimensions.toObject, tcp, target);
      this.setTagText(this.toObjectTag, `${formatMm(reading.toObjectMm)} to ${atOldPlace ? "where it was" : `the ${object}`}`);
      this.toObjectTag.anchor.set((tcp[0] + target[0]) / 2, (tcp[1] + target[1]) / 2, 0);
      // The distance names the old place; its own label would only repeat it.
      if (atOldPlace && this.ghostTag) this.ghostTag.visible = false;
    } else {
      dimensions.toObject.visible = false;
      this.toObjectTag.visible = false;
    }
    if (trace.moved && reading.toOldPlaceMm !== null && trace.moved.kind === "reach") {
      // Moved during the reach, it is worth saying how far the close was from the old place.
      const from = trace.moved.from;
      set(dimensions.toOld, tcp, from);
      dimensions.toOld.visible = true;
      this.toOldTag.visible = true;
      this.setTagText(this.toOldTag, `${formatMm(reading.toOldPlaceMm)} to where it was`);
      this.toOldTag.anchor.set((tcp[0] + from[0]) / 2, (tcp[1] + from[1]) / 2, 0);
      if (this.ghostTag) this.ghostTag.visible = false;
    }
  }

  // ---------------------------------------------------------------- camera

  /** Puts the camera at one of the named views, framing the arm's reach. */
  setView(name: ViewName) {
    this.view = name;
    this.turned = false;
    const direction = new THREE.Vector3(...VIEW_DIRECTIONS[name]).normalize();
    const box = name === "plan" ? PLAN_BOX : FRAME_BOX;
    const min = new THREE.Vector3(...box.min);
    const max = new THREE.Vector3(...box.max);
    const target = min.clone().add(max).multiplyScalar(0.5);
    const corners: THREE.Vector3[] = [];
    for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) corners.push(new THREE.Vector3(x, y, z));

    // The nearest distance at which every corner of the box is inside the picture, with a margin.
    let near = 0.3;
    let far = 12;
    for (let iteration = 0; iteration < 24; iteration += 1) {
      const distance = (near + far) / 2;
      this.camera.position.copy(target).addScaledVector(direction, distance);
      this.camera.lookAt(target);
      this.camera.updateMatrixWorld();
      const fits = corners.every((corner) => {
        const p = corner.clone().project(this.camera);
        return Math.abs(p.x) <= 0.96 && Math.abs(p.y) <= 0.92 && p.z < 1;
      });
      if (fits) far = distance;
      else near = distance;
    }
    this.camera.position.copy(target).addScaledVector(direction, far);
    this.controls.target.copy(target);
    this.controls.update();
    this.render();
  }

  /** Turns the view about the vertical axis and up or down, in radians. For the keyboard. */
  turn(around: number, upDown: number) {
    const target = this.controls.target;
    const offset = this.camera.position.clone().sub(target);
    offset.applyAxisAngle(Z, around);
    if (upDown !== 0) {
      const radius = offset.length();
      const polar = Math.acos(Math.min(1, Math.max(-1, offset.z / radius)));
      const wanted = Math.min(this.controls.maxPolarAngle, Math.max(0.01, polar - upDown));
      const side = new THREE.Vector3().crossVectors(offset, Z);
      if (side.lengthSq() < 1e-10) side.set(0, 1, 0);
      offset.applyAxisAngle(side.normalize(), polar - wanted);
    }
    this.camera.position.copy(target).add(offset);
    this.turned = true;
    this.controls.update();
    this.render();
  }

  setSize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.pathDone.resolution.set(width, height);
    this.pathAhead.resolution.set(width, height);
    this.dimensionLine.resolution.set(width, height);
    for (const tag of this.tags) tag.size = null;
    // A named view is framed again for the new shape; a view the reader turned is kept.
    if (this.turned) this.render();
    else this.setView(this.view);
  }

  // ---------------------------------------------------------------- colours

  setPalette(palette: Palette) {
    const set = (material: { color: THREE.Color }, value: string) => {
      if (value) material.color.set(value);
    };
    this.renderer.setClearColor(palette.surface || "#ffffff", 1);
    set(this.tableFill, palette.bg);
    set(this.gridLine, palette.border);
    set(this.tableEdge, palette.borderStrong);
    set(this.linkFill, palette.surface2);
    set(this.jointFill, palette.border);
    set(this.handFill, palette.borderStrong);
    set(this.armEdge, palette.borderStrong);
    set(this.inkFill, palette.text);
    set(this.objectEdge, palette.text);
    set(this.ghostEdge, palette.textMuted);
    set(this.moveLine, palette.textMuted);
    set(this.shadowLine, palette.borderStrong);
    set(this.dropLine, palette.textFaint);
    set(this.dimensionLine, palette.textMuted);
    set(this.pathDone, palette.text);
    set(this.pathAhead, palette.textFaint);
    this.palette = palette;
    this.applyObjectColours();
    this.render();
  }

  private applyObjectColours() {
    if (!this.palette) return;
    for (const [id, material] of this.objectFills) {
      const value = this.palette.objects[id];
      if (value) material.color.set(value);
    }
  }

  // ---------------------------------------------------------------- drawing

  render() {
    if (this.disposed) return;
    this.seeThroughArm();
    this.renderer.render(this.scene, this.camera);
    this.placeTags();
  }

  /**
   * Seen from above, the arm stands between the camera and the table, where
   * the path and the marks are. The links are then left out and the hand is
   * drawn faint, so the table shows through.
   */
  private seeThroughArm() {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const polar = Math.acos(Math.min(1, Math.max(-1, offset.z / (offset.length() || 1))));
    const fromAbove = polar < 0.6;
    // The chain has the same number of links in every pose, so every link is drawn unless seen from above.
    for (const part of [...this.links, ...this.joints]) part.visible = !fromAbove;
    for (const material of [this.handFill, this.armEdge]) {
      const opacity = fromAbove ? (material === this.armEdge ? 0.45 : 0.25) : material === this.armEdge ? 0.9 : 1;
      if (material.opacity === opacity) continue;
      material.transparent = fromAbove || material === this.armEdge;
      material.opacity = opacity;
      material.depthWrite = !fromAbove;
      material.needsUpdate = true;
    }
  }

  /**
   * Puts each label over its point. Labels are placed in order of importance
   * (the close and its distances, then the objects, then the old place); one
   * that would cover a label already placed moves out of its way, with a
   * leader to its point, and is left out when there is no room. Sizes are
   * measured once per text, not every frame.
   */
  private placeTags() {
    const point = new THREE.Vector3();
    const placed: { left: number; top: number; right: number; bottom: number }[] = [];
    const order = [...this.tags].sort((a, b) => a.priority - b.priority);
    const hide = (tag: Tag) => {
      tag.element.style.visibility = "hidden";
      tag.leader.style.visibility = "hidden";
    };
    for (const tag of order) {
      if (!tag.visible) {
        hide(tag);
        continue;
      }
      point.copy(tag.anchor).project(this.camera);
      if (point.z > 1 || Math.abs(point.x) > 1.05 || Math.abs(point.y) > 1.05) {
        hide(tag);
        continue;
      }
      tag.size ??= { width: tag.element.offsetWidth, height: tag.element.offsetHeight };
      const { width, height } = tag.size;
      const anchorX = ((point.x + 1) / 2) * this.width;
      const anchorY = ((1 - point.y) / 2) * this.height;
      const x = anchorX - width / 2;
      let y = anchorY + (tag.placement === "above" ? -height - 4 : 6);
      const overlaps = (top: number) =>
        placed.some((box) => x < box.right + 2 && x + width > box.left - 2 && top < box.bottom + 1 && top + height > box.top - 1);
      let tries = 0;
      while (overlaps(y) && tries < 6) {
        y += tag.placement === "above" ? -(height + 2) : height + 2;
        tries += 1;
      }
      if (overlaps(y)) {
        hide(tag);
        continue;
      }
      placed.push({ left: x, top: y, right: x + width, bottom: y + height });
      tag.element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      tag.element.style.visibility = "visible";

      // Moved out of another label's way, the label keeps a leader down (or up) to its point.
      if (tries > 0) {
        const above = tag.placement === "above";
        const top = above ? y + height : anchorY;
        const length = above ? anchorY - top : y - anchorY;
        tag.leader.className = `ar-leader ${above ? "ar-leader-down" : "ar-leader-up"}`;
        tag.leader.style.height = `${Math.max(0, length).toFixed(1)}px`;
        tag.leader.style.transform = `translate(${anchorX.toFixed(1)}px, ${top.toFixed(1)}px)`;
        tag.leader.style.visibility = "visible";
      } else {
        tag.leader.style.visibility = "hidden";
      }
    }
  }

  dispose() {
    this.disposed = true;
    this.controls.removeEventListener("start", this.handleStart);
    this.controls.removeEventListener("end", this.handleEnd);
    this.controls.removeEventListener("change", this.handleChange);
    this.controls.dispose();
    this.clearRollout();
    this.scene.traverse((node) => {
      const mesh = node as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
      else material?.dispose();
    });
    // What the rollout used is out of the scene by now: its materials and shared geometries are disposed by name.
    for (const material of this.objectFills.values()) material.dispose();
    this.objectFills.clear();
    for (const material of [
      this.tableFill,
      this.gridLine,
      this.tableEdge,
      this.linkFill,
      this.jointFill,
      this.handFill,
      this.armEdge,
      this.inkFill,
      this.objectEdge,
      this.ghostEdge,
      this.moveLine,
      this.shadowLine,
      this.dropLine,
      this.dimensionLine,
      this.pathDone,
      this.pathAhead,
    ]) {
      material.dispose();
    }
    this.ringGeometry.dispose();
    this.dotGeometry.dispose();
    this.renderer.dispose();
    // Releases the WebGL context now, not when the browser collects it: a page that remounts the figure does not run out of contexts.
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
