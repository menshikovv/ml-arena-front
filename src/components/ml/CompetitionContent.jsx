import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

function nodeText(node) {
  if (node.type === "text" || node.type === "inlineCode") return node.value || "";
  return (node.children || []).map(nodeText).join("");
}

function summaryPlugin() {
  return (tree) => {
    const paragraph = tree.children.find((node) => node.type === "paragraph" && nodeText(node).trim());
    const text = nodeText(paragraph || { children: [] }).replace(/\s+/g, " ").trim();
    const limit = 260;
    const cut = text.slice(0, limit);
    const summary = text.length > limit ? `${cut.slice(0, cut.lastIndexOf(" ") > limit / 2 ? cut.lastIndexOf(" ") : limit)}…` : text;
    tree.children = [{ type: "paragraph", children: [{ type: "text", value: summary }] }];
  };
}

function outlinePlugin() {
  return (tree) => {
    const headings = [];
    for (const node of tree.children) {
      if (node.type !== "element" || !["h1", "h2", "h3"].includes(node.tagName)) continue;
      const id = `competition-section-${headings.length + 1}`;
      node.properties = { ...node.properties, id };
      headings.push({ id, title: nodeText(node) });
    }
    if (headings.length < 3) return;
    tree.children.unshift({
      type: "element", tagName: "nav", properties: { ariaLabel: "Содержание раздела" },
      children: [
        { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "Содержание" }] },
        { type: "element", tagName: "ol", properties: {}, children: headings.map(({ id, title }) => ({
          type: "element", tagName: "li", properties: {}, children: [{
            type: "element", tagName: "a", properties: { href: `#${id}` }, children: [{ type: "text", value: title }],
          }],
        })) },
      ],
    });
  };
}

const markdownComponents = {
  h1: ({ children, id }) => <h2 id={id} className="mb-4 mt-10 scroll-mt-24 border-b border-border pb-4 font-heading text-2xl font-bold leading-snug text-foreground first:mt-0">{children}</h2>,
  h2: ({ children, id }) => <h3 id={id} className="mb-4 mt-10 scroll-mt-24 border-l-2 border-primary pl-4 font-heading text-xl font-bold leading-snug text-foreground">{children}</h3>,
  h3: ({ children, id }) => <h4 id={id} className="mb-3 mt-7 scroll-mt-24 text-lg font-bold leading-snug text-foreground">{children}</h4>,
  p: ({ children }) => <p className="my-4 leading-7">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  ul: ({ children }) => <ul className="my-5 list-disc space-y-3 pl-6 marker:text-primary">{children}</ul>,
  ol: ({ children }) => <ol className="my-5 list-decimal space-y-3 pl-6 marker:font-semibold marker:text-primary">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-7 [&>p]:my-1">{children}</li>,
  blockquote: ({ children }) => <blockquote className="my-6 border-l-2 border-primary bg-primary/5 px-5 py-1 text-foreground">{children}</blockquote>,
  code: ({ children, className }) => <code className={cn("rounded bg-secondary px-1.5 py-0.5 font-mono text-[13px] text-foreground", className)}>{children}</code>,
  pre: ({ children }) => <pre className="my-6 max-w-full overflow-x-auto rounded-md border border-border bg-secondary/60 p-4 leading-6 [&>code]:bg-transparent [&>code]:p-0">{children}</pre>,
  a: ({ children, href }) => <a href={href} className="text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary">{children}</a>,
  hr: () => <hr className="my-8 border-border" />,
  img: ({ src, alt }) => <img src={src} alt={alt || ""} loading="lazy" className="my-6 max-w-full rounded-md" />,
  nav: ({ children }) => <nav aria-label="Содержание раздела" className="mb-8 border-y border-border bg-secondary/25 px-4 py-3 text-sm [&>p]:my-1 [&>p]:font-semibold [&>p]:text-foreground [&>ol]:my-3 [&>ol]:grid [&>ol]:gap-x-6 [&>ol]:gap-y-2 sm:[&>ol]:grid-cols-2 [&>ol>li]:!m-0 [&_li]:leading-6">{children}</nav>,
};

export function CompetitionContent({ children, className }) {
  return <div className={cn("min-w-0 max-w-4xl break-words text-[15px] text-muted-foreground", className)}><ReactMarkdown components={markdownComponents} rehypePlugins={[outlinePlugin]}>{children || ""}</ReactMarkdown></div>;
}

export function CompetitionSummary({ competition, className }) {
  return <div className={className}><ReactMarkdown remarkPlugins={[summaryPlugin]}>{competition.short_description?.trim() || competition.description || ""}</ReactMarkdown></div>;
}
