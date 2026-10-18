import { fromMarkdown } from "mdast-util-from-markdown";

export const COMPETITION_DESCRIPTION_MAX_LENGTH = 30000;
const METRIC_HEADING = "Метрика и оценка решения";

function nodeText(node) {
  return node.value || (node.children || []).map(nodeText).join("");
}

export function splitCompetitionDescription(value = "") {
  const markdown = typeof value === "string" ? value : "";
  const nodes = fromMarkdown(markdown).children;
  const index = nodes.findIndex((node) => node.type === "heading" && node.depth <= 2 && nodeText(node).trim().toLowerCase() === METRIC_HEADING.toLowerCase());
  if (index < 0) return { description: markdown, metricDescription: "" };
  const heading = nodes[index];
  const next = nodes.slice(index + 1).find((node) => node.type === "heading" && node.depth <= heading.depth);
  const end = next?.position.start.offset ?? markdown.length;
  return {
    description: [markdown.slice(0, heading.position.start.offset).trimEnd(), markdown.slice(end).trimStart()].filter(Boolean).join("\n\n"),
    metricDescription: markdown.slice(heading.position.end.offset, end).trim(),
  };
}

function nestMetricHeadings(markdown) {
  const headings = fromMarkdown(markdown).children.filter((node) => node.type === "heading" && node.depth === 1);
  for (const heading of headings.reverse()) {
    const start = heading.position.start.offset;
    const end = heading.position.end.offset;
    const original = markdown.slice(start, end);
    const nested = /^ {0,3}#(?:[ \t]|$)/.test(original)
      ? original.replace(/^( {0,3})#/, "$1##")
      : original.replace(/(^|\r?\n)[ \t]*=+[ \t]*$/, "$1---");
    markdown = markdown.slice(0, start) + nested + markdown.slice(end);
  }
  return markdown;
}

export function composeCompetitionDescription(description, metricDescription) {
  const content = splitCompetitionDescription(description);
  const metric = nestMetricHeadings((metricDescription ?? content.metricDescription).trim());
  return [content.description.trim(), metric ? `# ${METRIC_HEADING}\n\n${metric}` : ""].filter(Boolean).join("\n\n");
}

export function getCompetitionMetricDescription(competition, catalog = []) {
  const ownDescription = splitCompetitionDescription(competition.description).metricDescription;
  if (ownDescription) return ownDescription;
  const entries = Array.isArray(catalog) ? catalog : catalog?.items;
  const metric = Array.isArray(entries) ? entries.find((item) => competition.metric && item.code === competition.metric) : null;
  return typeof metric?.description === "string" ? metric.description.trim() : "";
}
