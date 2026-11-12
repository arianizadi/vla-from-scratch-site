import type { Root } from "hast";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import Link from "next/link";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Figure } from "@/figures/Figure";
import { CodeBlock } from "./CodeBlock";
import { Heading3, Heading4, SectionHeading } from "./Heading";
import { Mermaid } from "./Mermaid";

/** Site pages are client-side navigations; files and other sites are plain links. */
function MarkdownLink({ href = "", children, ...rest }: React.ComponentProps<"a">) {
  const isPage = href === "/" || /^\/(learn|lab)(\/|#|$)/.test(href);
  if (isPage) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

function MarkdownTable({ children, ...rest }: React.ComponentProps<"table">) {
  return (
    <div className="table-scroll" role="group" aria-label="Table" tabIndex={0}>
      <table {...rest}>{children}</table>
    </div>
  );
}

function MarkdownImage({ alt = "", ...rest }: React.ComponentProps<"img">) {
  // Chapter images are static files under public/tutorial/img; most are SVG.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} loading="lazy" decoding="async" {...rest} />;
}

interface FigureEmbedProps {
  id?: string;
  caption?: string;
  number?: string;
  children?: React.ReactNode;
}

function FigureEmbed({ id = "", caption = "", number, children }: FigureEmbedProps) {
  return (
    <Figure id={id} caption={caption} number={number}>
      {children}
    </Figure>
  );
}

function MermaidDiagram({ chart = "" }: { chart?: string }) {
  return <Mermaid chart={chart} />;
}

/**
 * Element name -> component. Standard elements are restyled here; the two
 * custom elements come from the pipeline (remarkFigures, rehypeMermaid).
 */
const COMPONENTS = {
  a: MarkdownLink,
  pre: CodeBlock,
  table: MarkdownTable,
  img: MarkdownImage,
  h2: SectionHeading,
  h3: Heading3,
  h4: Heading4,
  "figure-embed": FigureEmbed,
  "mermaid-diagram": MermaidDiagram,
} as unknown as Components;

/** Renders a chapter's HTML tree (from renderMarkdown) as React elements, on the server. */
export function Markdown({ tree }: { tree: Root }) {
  return toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components: COMPONENTS,
    ignoreInvalidStyle: true,
  });
}
