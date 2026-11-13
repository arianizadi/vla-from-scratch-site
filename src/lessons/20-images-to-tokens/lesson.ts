import { defineLesson } from "../define";
import { CubeAcrossPatches } from "./animations/CubeAcrossPatches";
import { PatchTokens } from "./animations/PatchTokens";
import { PositionAdd } from "./animations/PositionAdd";
import { TileSize } from "./animations/TileSize";

export default defineLesson({
  slug: "20-images-to-tokens",
  idea: "A camera picture is cut into small square tiles, and each tile becomes one token, so a model can read an image the way it reads a sentence.",
  beats: [
    {
      title: "Cut the picture into tiles",
      text: "Like a mosaic, a camera picture is a grid of tiny coloured dots, three numbers each. A **Vision Transformer**, a model that reads images in pieces, cuts it into square tiles called **patches**. One shared recipe turns each patch into a **token**: a list of numbers, like a word.",
      animation: PatchTokens,
    },
    {
      title: "Every patch gets a place tag",
      text: "Tip a jigsaw out of its box and the pieces lose their places. Patches lined up in a row do too. So the model learns a **place tag** for each spot in the grid and adds it to that spot's token. A robot needs this: left or right changes everything.",
      animation: PositionAdd,
    },
    {
      title: "Smaller patches, more tokens",
      text: "Patch size is a trade. Halve the side of a patch and the same picture makes four times as many tokens: finer detail, but more work for every step of the model. Pick a patch about the size of the smallest object the robot must find.",
      animation: TileSize,
    },
    {
      title: "Finer than one patch",
      text: "Our cube is about one patch wide and usually straddles a border. Which patch holds it only places it to a few centimetres. Yet grasps landed within millimetres. The model reads how the cube's colour splits between neighbouring patches, like reading a length between two ruler marks.",
      animation: CubeAcrossPatches,
    },
  ],
  edgeCases: [
    "Brightness must reach the model on the same scale in training and in use. Fed another scale, it sees a strange picture and raises no error.",
    "A picture of a different size does not fit the grid of place tags. Strips too thin to fill a whole patch can be dropped without warning.",
    "Nothing in a token says which camera it came from. Swap the order of two cameras and the robot acts as if they were swapped.",
    "A grasp that misses by centimetres is not always a patch-size problem. If the grasp does not follow the object when it moves, finer patches will not help.",
  ],
  tips: [
    "Before choosing a patch size, work out how many pixels wide your smallest object is in the camera picture.",
    "Halving the patch side costs four times the tokens. Pay that only when the objects are tiny.",
    "Look at one picture exactly as the model receives it, after every preparation step.",
    "To see whether the robot looks at all, move the object and check that the grasp moves with it.",
  ],
  takeaway: "A Vision Transformer reads a picture as a row of patch tokens, each tagged with where it sat, and can still locate things more finely than one patch.",
  related: ["21-pooled-vs-patch-tokens", "12-positions", "30-joining-vision-and-language"],
  lab: [{ label: "How far off a grasp can be and still hold", href: "/lab#grasp-tolerance" }],
  tryIt: ["patchify"],
});
