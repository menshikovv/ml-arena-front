import { competitionReport, duelReport, passportReport, reportDate } from "./reportPdfModel.js";

const MARGIN = 16;
const WIDTH = 178;
const PAGE_BOTTOM = 258;
const COLORS = { ink: "#101D37", muted: "#586B86", blue: "#2859E8", green: "#087E68", line: "#DCE5F2", wash: "#F3F7FD" };
let fontsPromise;

async function loadFonts() {
  if (!fontsPromise) fontsPromise = Promise.all(["Regular", "Bold"].map(async (weight) => {
    const response = await fetch(`${import.meta.env.BASE_URL}fonts/ScienceGothic-Report-${weight}.ttf`);
    if (!response.ok) throw new Error("Не удалось загрузить шрифт PDF");
    const bytes = new Uint8Array(await response.arrayBuffer());
    const chunks = [];
    for (let index = 0; index < bytes.length; index += 8192) chunks.push(String.fromCharCode(...bytes.subarray(index, index + 8192)));
    return btoa(chunks.join(""));
  })).catch((error) => { fontsPromise = null; throw error; });
  return fontsPromise;
}

let logoPromise;
async function loadLogo() {
  if (!logoPromise) logoPromise = (async () => {
    const image = new Image();
    image.src = `${import.meta.env.BASE_URL}logo.svg`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    canvas.getContext("2d").drawImage(image, 0, 0, 256, 256);
    return canvas.toDataURL("image/png");
  })().catch((error) => { logoPromise = null; throw error; });
  return logoPromise;
}

async function printableAvatar(url) {
  if (!url) return null;
  const image = new Image();
  image.crossOrigin = "anonymous";
  let timeout;
  try {
    image.src = new URL(url, window.location.href).href;
    await Promise.race([image.decode(), new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Avatar timeout")), 2500); })]);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 192;
    const context = canvas.getContext("2d");
    const size = Math.min(image.naturalWidth, image.naturalHeight);
    context.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, 0, 0, 192, 192);
    return canvas.toDataURL("image/jpeg", 0.9);
  } catch {
    return null;
  } finally { clearTimeout(timeout); }
}

const clean = (value) => String(value ?? "").replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\u00a0/g, " ").replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

export async function createReportPdf(report) {
  const [{ jsPDF }, fonts, avatar, logo] = await Promise.all([import("jspdf"), loadFonts(), printableAvatar(report.avatarUrl), loadLogo()]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true, putOnlyUsedFonts: true });
  const BOTTOM = PAGE_BOTTOM;
  ["normal", "bold"].forEach((style, index) => {
    pdf.addFileToVFS(`Report-${style}.ttf`, fonts[index]);
    pdf.addFont(`Report-${style}.ttf`, "ScienceGothic", style);
  });
  pdf.setProperties({ title: clean(`${report.type} / ${report.title}`), subject: report.type, author: "ML-Арена", creator: "ML-Арена" });
  let y = 0;
  let sectionTitle = "";
  let sectionNumber = 0;
  const font = (size = 10, bold = false, color = COLORS.ink) => { pdf.setFont("ScienceGothic", bold ? "bold" : "normal"); pdf.setFontSize(size); pdf.setTextColor(color); };
  const lines = (value, width, size = 10, bold = false) => { font(size, bold); return pdf.splitTextToSize(clean(value), width); };
  const text = (value, x, top, size = 10, bold = false, color = COLORS.ink) => { font(size, bold, color); pdf.text(clean(value), x, top + size * 0.3528 * 0.82); };
  const rule = (top, x = MARGIN, width = WIDTH) => { pdf.setDrawColor(COLORS.line); pdf.setLineWidth(0.25); pdf.line(x, top, x + width, top); };
  const paintLines = (values, x, top, size, bold = false, color = COLORS.ink, leading = size * 0.46) => values.forEach((line, index) => text(line, x, top + index * leading, size, bold, color));
  const heading = (title, continued = false) => {
    text(String(sectionNumber).padStart(2, "0"), MARGIN, y + 0.5, 8.5, true, COLORS.blue);
    const titleLines = lines(`${title}${continued ? " / продолжение" : ""}`, WIDTH - 11, 11.5, true);
    paintLines(titleLines, MARGIN + 10, y, 11.5, true, COLORS.ink, 5.3);
    y += titleLines.length * 5.3 + 3;
  };
  const newPage = () => {
    if (y) pdf.addPage();
    y = 35;
  };
  const pageHeader = () => {
    pdf.addImage(logo, "PNG", MARGIN - 1, 11, 12, 12);
    text("ML-Арена", MARGIN + 13, 12.8, 15, true);
    text("Практика. Результаты. Подтверждение.", MARGIN + 13, 20.3, 6.8, false, COLORS.muted);
    font(9, true, COLORS.blue);
    pdf.text(report.type, MARGIN + WIDTH, 17.5, { align: "right" });
    if (report.context) {
      const context = lines(report.context, WIDTH / 2, 7);
      font(7, false, COLORS.muted);
      pdf.text(clean(context.length > 1 ? `${context[0]}...` : context[0]), MARGIN + WIDTH, 23.8, { align: "right" });
    }
    rule(28);
  };
  const ensure = (height, repeat = false) => {
    if (y + height <= BOTTOM) return;
    newPage();
    if (repeat && sectionTitle) heading(sectionTitle, true);
  };
  const paragraph = (value, size = 10, color = COLORS.muted, width = WIDTH) => {
    const wrapped = lines(value, width, size);
    const leading = size * 0.48;
    for (const line of wrapped) {
      ensure(leading, Boolean(sectionTitle));
      text(line, MARGIN, y, size, false, color);
      y += leading;
    }
  };
  newPage();
  const eyebrow = lines(report.eyebrow, WIDTH, 8.5, true);
  paintLines(eyebrow, MARGIN, y, 8.5, true, COLORS.blue, 4);
  y += eyebrow.length * 4 + 3;
  const titleWidth = report.kind === "passport" ? WIDTH - 34 : WIDTH;
  const titleLines = lines(report.title, titleWidth, 23, true);
  const heroTop = y;
  if (report.kind === "passport") {
    if (avatar) pdf.addImage(avatar, "JPEG", MARGIN + WIDTH - 26, heroTop, 26, 26);
    else {
      pdf.setFillColor(COLORS.wash); pdf.roundedRect(MARGIN + WIDTH - 26, heroTop, 26, 26, 2, 2, "F");
      const initials = report.title.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
      font(13, true, COLORS.blue); pdf.text(clean(initials), MARGIN + WIDTH - 13, heroTop + 16, { align: "center" });
    }
  }
  titleLines.forEach((line) => { ensure(11); text(line, MARGIN, y, 23, true); y += 10.7; });
  y += 2;
  paragraph(report.subtitle, 9.5, COLORS.muted, titleWidth);
  y = Math.max(y + 8, heroTop + (report.kind === "passport" ? 34 : 0));

  const statWidth = WIDTH / report.stats.length;
  const statLayouts = report.stats.map((item) => {
    font(17, true);
    const valueSize = pdf.getTextWidth(clean(item.value)) > statWidth - 10 ? 12 : 17;
    return {
      ...item, valueSize, labelLines: lines(item.label, statWidth - 10, 8),
      valueLines: lines(item.value, statWidth - 10, valueSize, true),
      detailLines: item.detail ? lines(item.detail, statWidth - 10, 7.5) : [],
    };
  });
  const labelHeight = Math.max(...statLayouts.map((item) => item.labelLines.length * 3.7));
  const valueHeight = Math.max(...statLayouts.map((item) => item.valueLines.length * item.valueSize * 0.48));
  const statHeight = labelHeight + valueHeight + Math.max(...statLayouts.map((item) => item.detailLines.length * 3.5)) + 11;
  ensure(statHeight);
  pdf.setFillColor(COLORS.wash); pdf.roundedRect(MARGIN, y, WIDTH, statHeight, 2, 2, "F");
  statLayouts.forEach((item, index) => {
    const x = MARGIN + index * statWidth + 5;
    paintLines(item.labelLines, x, y + 5, 8, false, COLORS.muted, 3.7);
    const valueY = y + 6 + labelHeight;
    paintLines(item.valueLines, x, valueY, item.valueSize, true, COLORS[item.tone] || COLORS.blue, item.valueSize * 0.48);
    paintLines(item.detailLines, x, valueY + valueHeight + 1, 7.5, false, COLORS.muted, 3.5);
    if (index) { pdf.setDrawColor(COLORS.line); pdf.line(x - 5, y + 5, x - 5, y + statHeight - 5); }
  });
  y += statHeight + 8;

  for (const section of report.sections.filter((item) => item.items.length)) {
    sectionTitle = section.title;
    sectionNumber += 1;
    if (section.kind === "competitions") {
      const first = section.items[0];
      const firstHeight = (first.badge ? lines(first.badge, WIDTH - 12, 7.5, true).length * 4 : 0)
        + lines(first.label, WIDTH - 12, 11, true).length * 5.4
        + (first.detail ? lines(first.detail, WIDTH - 12, 8).length * 4 : 0)
        + (first.facts || []).reduce((sum, fact) => sum + lines(`${fact.label}: ${fact.value}`, WIDTH - 12, 8.5).length * 4.2, 0) + 25;
      ensure(Math.min(firstHeight, 90));
    } else ensure(28);
    heading(section.title);
    if (section.kind === "text") {
      for (const item of section.items) { paragraph(item.label, 9); y += 3; }
    } else if (section.kind === "competitions") {
      for (const item of section.items) {
        const blocks = [
          ...(item.badge ? lines(item.badge, WIDTH - 12, 7.5, true).map((line) => ({ line, size: 7.5, bold: true, color: COLORS.blue, height: 4 })) : []),
          ...lines(item.label, WIDTH - 12, 11, true).map((line) => ({ line, size: 11, bold: true, color: COLORS.ink, height: 5.4 })),
          ...(item.detail ? lines(item.detail, WIDTH - 12, 8).map((line) => ({ line, size: 8, color: COLORS.muted, height: 4 })) : []),
          ...(item.facts || []).flatMap((fact) => lines(`${fact.label}: ${fact.value}`, WIDTH - 12, 8.5).map((line) => ({ line, size: 8.5, color: COLORS.ink, height: 4.2 }))),
        ];
        const desired = blocks.reduce((sum, block) => sum + block.height, 0) + 12;
        ensure(Math.min(desired, 70), true);
        while (blocks.length) {
          const available = BOTTOM - y - 13;
          const piece = [];
          let height = 0;
          while (blocks.length && height + blocks[0].height <= available) { const block = blocks.shift(); piece.push(block); height += block.height; }
          if (!piece.length) { newPage(); heading(sectionTitle, true); continue; }
          const link = !blocks.length && item.url;
          pdf.setFillColor(COLORS.wash); pdf.roundedRect(MARGIN, y, WIDTH, height + (link ? 13 : 9), 1.5, 1.5, "F");
          pdf.setFillColor(COLORS.blue); pdf.rect(MARGIN, y + 4, 0.7, height + 1, "F");
          let top = y + 4;
          for (const block of piece) { text(block.line, MARGIN + 5, top, block.size, block.bold, block.color); top += block.height; }
          if (link) { text("Открыть соревнование", MARGIN + 5, top + 2, 8, true, COLORS.blue); pdf.link(MARGIN + 5, top + 2, WIDTH - 10, 4, { url: item.url }); }
          y += height + (link ? 17 : 13);
          if (blocks.length) { newPage(); heading(sectionTitle, true); }
        }
      }
    } else if (section.kind === "facts" || section.kind === "directions") {
      const colWidth = (WIDTH - 8) / 2;
      for (let index = 0; index < section.items.length; index += 2) {
        const cells = section.items.slice(index, index + 2).map((item) => ({
          label: lines(item.label, section.kind === "directions" ? colWidth - 28 : colWidth - 8, section.kind === "directions" ? 10 : 8.5, section.kind === "directions"),
          value: lines(item.value, colWidth - 8, 11, true),
          detail: item.detail ? lines(item.detail, colWidth - 8, 8) : [],
          direction: section.kind === "directions", rawValue: item.value,
        }));
        const blocks = cells.map((cell) => [
          ...cell.label.map((line) => ({ line, size: cell.direction ? 10 : 8.5, bold: cell.direction, color: cell.direction ? COLORS.ink : COLORS.muted, height: 4.3 })),
          ...(!cell.direction ? cell.value.map((line) => ({ line, size: 11, bold: true, color: COLORS.ink, height: 5.1 })) : []),
          ...cell.detail.map((line) => ({ line, size: 8, bold: false, color: COLORS.muted, height: 3.7 })),
        ]);
        const extra = section.kind === "directions" ? 1 : 0;
        const desired = Math.max(...blocks.map((block) => block.reduce((sum, line) => sum + line.height, 0))) + 8 + extra;
        ensure(Math.min(desired, 70), true);
        let firstFragment = true;
        while (blocks.some((block) => block.length)) {
          const available = BOTTOM - y - 8 - extra;
          const pieces = blocks.map((block) => {
            const piece = [];
            let height = 0;
            while (block.length && height + block[0].height <= available) { const line = block.shift(); piece.push(line); height += line.height; }
            return { piece, height };
          });
          const rowHeight = Math.max(...pieces.map((item) => item.height)) + 8 + extra;
          if (pieces.every((item) => !item.piece.length)) { ensure(BOTTOM, true); continue; }
          pieces.forEach(({ piece }, col) => {
            const x = MARGIN + col * (colWidth + 8);
            let top = y + 3;
            piece.forEach((line) => { text(line.line, x, top, line.size, line.bold, line.color); top += line.height; });
            if (cells[col].direction && firstFragment) {
              font(cells[col].rawValue === "Нет данных" ? 9 : 14, true, COLORS.blue);
              pdf.text(clean(cells[col].rawValue), x + colWidth, y + 7, { align: "right" });
              const score = Number(cells[col].rawValue);
              pdf.setFillColor(COLORS.line); pdf.roundedRect(x, y + rowHeight - 6, colWidth, 1.5, .5, .5, "F");
              if (Number.isFinite(score) && score > 0) { pdf.setFillColor(col === 0 ? COLORS.blue : COLORS.green); pdf.roundedRect(x, y + rowHeight - 6, colWidth * Math.min(score, 100) / 100, 1.5, .5, .5, "F"); }
            }
            rule(y + rowHeight - 1, x, colWidth);
          });
          y += rowHeight;
          firstFragment = false;
          if (blocks.some((block) => block.length)) { newPage(); heading(sectionTitle, true); }
        }
      }
    } else {
      for (const item of section.items) {
        const label = lines(item.label, WIDTH, 10.5, true);
        const detail = item.detail ? lines(item.detail, WIDTH, 9) : [];
        ensure(Math.min(label.length * 5 + detail.length * 4.3 + 6, 45), true);
        for (const line of label) { ensure(5, true); text(line, MARGIN, y, 10.5, true); y += 5; }
        for (const line of detail) { ensure(4.3, true); text(line, MARGIN, y, 9, false, COLORS.muted); y += 4.3; }
        y += 3;
        rule(y); y += 4;
      }
    }
    y += 5;
  }
  sectionTitle = "";
  const noteLines = lines(report.note, WIDTH, 7);

  const count = pdf.getNumberOfPages();
  for (let index = 1; index <= count; index += 1) {
    pdf.setPage(index); pageHeader(); rule(277);
    rule(260); paintLines(noteLines, MARGIN, 263, 7, false, COLORS.muted, 3.3);
    text(`Сформировано ${reportDate(new Date())}`, MARGIN, 281, 7.5, false, COLORS.muted);
    font(7.5, false, COLORS.muted); pdf.text(`${index} / ${count}`, MARGIN + WIDTH, 283.3, { align: "right" });
    if (report.url) {
      const label = "Открыть актуальные данные на ML-Арене";
      text(label, MARGIN, 287, 8, false, COLORS.blue);
      pdf.link(MARGIN, 287, pdf.getTextWidth(label), 4, { url: report.url });
    }
  }
  return pdf;
}

async function download(report) {
  const pdf = await createReportPdf(report);
  pdf.save(report.filename);
}

export const downloadPassportPdf = (data) => download(passportReport(data));
export const downloadCompetitionPdf = (data) => download(competitionReport(data));
export const downloadDuelPdf = (data) => download(duelReport(data));
