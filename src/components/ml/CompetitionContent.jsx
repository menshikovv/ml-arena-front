import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

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

function outlinePlugin(options = {}) {
  return (tree) => {
    const headings = [];
    for (const node of tree.children) {
      if (node.type !== "element" || !["h1", "h2", "h3"].includes(node.tagName)) continue;
      const id = `competition-section-${headings.length + 1}`;
      node.properties = { ...node.properties, id };
      headings.push({ id, title: nodeText(node) });
    }
    if (!headings.length || (!options.brief && headings.length < 3)) return;
    const outline = {
      type: "element", tagName: "nav", properties: { ariaLabel: "Содержание раздела" },
      children: [
        { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "Содержание" }] },
        { type: "element", tagName: "ol", properties: {}, children: headings.map(({ id, title }) => ({
          type: "element", tagName: "li", properties: {}, children: [{
            type: "element", tagName: "a", properties: { href: `#${id}` }, children: [{ type: "text", value: title }],
          }],
        })) },
      ],
    };
    if (!options.brief) { tree.children.unshift(outline); return; }
    const introduction = [];
    const sections = [];
    let section = null;
    let introductionId;
    for (const node of tree.children) {
      const isHeading = node.type === "element" && ["h1", "h2", "h3"].includes(node.tagName);
      if (isHeading && node.tagName === "h1" && !introductionId && !section && !sections.length) {
        introductionId = node.properties.id;
        continue;
      }
      if (isHeading) {
        section = { type: "element", tagName: "details", properties: { id: node.properties.id }, children: [
          { type: "element", tagName: "summary", properties: {}, children: [{ type: "text", value: nodeText(node) }] },
        ] };
        sections.push(section);
      } else if (section) section.children.push(node);
      else introduction.push(node);
    }
    tree.children = [
      { type: "element", tagName: "div", properties: { className: ["competition-brief-top"] }, children: [
        { type: "element", tagName: "div", properties: { className: ["competition-brief-intro"], ...(introductionId ? { id: introductionId } : {}) }, children: introduction },
        outline,
      ] },
      { type: "element", tagName: "div", properties: { className: ["competition-brief-sections"] }, children: sections },
    ];
  };
}

function CodeBlock({ children, node }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(nodeText(node)); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  };
  return <div className="competition-code-block"><pre>{children}</pre><button type="button" onClick={copy} title={copyError ? "Не удалось скопировать" : copied ? "Скопировано" : "Скопировать код"} aria-label={copyError ? "Не удалось скопировать код" : copied ? "Код скопирован" : "Скопировать код"}>{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>;
}

function codeSamplePlugin() {
  return (tree) => {
    const code = tree.children.find((node) => node.type === "code" && ["bash", "sh", "shell", "console", "powershell"].includes(node.lang));
    tree.children = code ? [code] : [];
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
  pre: CodeBlock,
  a: ({ children, href }) => <a href={href} onClick={() => { if (href?.startsWith("#competition-section-")) { const target = document.getElementById(href.slice(1)); if (target?.tagName === "DETAILS") target.open = true; } }} className="text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary">{children}</a>,
  hr: () => <hr className="my-8 border-border" />,
  img: ({ src, alt }) => <img src={src} alt={alt || ""} loading="lazy" className="my-6 max-w-full rounded-md" />,
  table: ({ children }) => <div role="region" aria-label="Таблица соревнования" tabIndex={0} className="my-6 max-w-full overflow-x-auto rounded-md border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><table className="w-full min-w-[720px] border-collapse text-sm leading-6">{children}</table></div>,
  thead: ({ children }) => <thead className="bg-primary/10 text-foreground">{children}</thead>,
  tbody: ({ children }) => <tbody className="[&>tr:nth-child(even)]:bg-secondary/35 [&>tr:last-child>td]:border-b-0">{children}</tbody>,
  th: ({ children, style }) => <th scope="col" style={style} className="whitespace-nowrap border-b border-r border-border px-4 py-3 text-left font-semibold last:border-r-0">{children}</th>,
  td: ({ children, style }) => <td style={style} className="border-b border-r border-border px-4 py-3 align-top first:whitespace-nowrap last:min-w-[260px] last:border-r-0">{children}</td>,
  nav: ({ children }) => <nav aria-label="Содержание раздела" className="mb-8 border-y border-border bg-secondary/25 px-4 py-3 text-sm [&>p]:my-1 [&>p]:font-semibold [&>p]:text-foreground [&>ol]:my-3 [&>ol]:grid [&>ol]:gap-x-6 [&>ol]:gap-y-2 sm:[&>ol]:grid-cols-2 [&>ol>li]:!m-0 [&_li]:leading-6">{children}</nav>,
};

export function CompetitionContent({ children, className, brief = false }) {
  const root = useRef(null);
  useEffect(() => {
    if (!brief) return;
    const revealSection = () => {
      const id = window.location.hash.slice(1);
      if (!id.startsWith("competition-section-")) return;
      const target = document.getElementById(id);
      if (target?.tagName === "DETAILS" && root.current?.contains(target)) {
        target.open = true;
        target.scrollIntoView({ block: "start" });
      }
    };
    revealSection();
    window.addEventListener("hashchange", revealSection);
    return () => window.removeEventListener("hashchange", revealSection);
  }, [brief, children]);
  return <div ref={root} className={cn("competition-document min-w-0 max-w-4xl break-words text-[15px] text-muted-foreground", brief && "competition-document--brief", className)}><ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]} rehypePlugins={[[outlinePlugin, { brief }]]}>{children || ""}</ReactMarkdown></div>;
}

export function CompetitionCodeSample({ children }) {
  return <ReactMarkdown components={markdownComponents} remarkPlugins={[codeSamplePlugin]}>{children || ""}</ReactMarkdown>;
}

export function CompetitionSummary({ competition, className }) {
  return <div className={className}><ReactMarkdown remarkPlugins={[remarkGfm, summaryPlugin]}>{competition.short_description?.trim() || competition.description || ""}</ReactMarkdown></div>;
}
