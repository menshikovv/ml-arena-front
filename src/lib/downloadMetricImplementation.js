import { API_URL } from "@/api/client";
import { api } from "@/api/mlArenaApi";

export async function downloadMetricImplementation(metric, version = metric?.current_version) {
  if (!version?.id) throw new Error("У метрики нет версии для скачивания.");

  let blob;
  if (version.implementation_type === "builtin") {
    blob = await api.catalogs.builtinMetricSource(metric.id, version.id);
  } else {
    const source = await api.admin.metricVersionSource(version.id);
    const sourceUrl = source?.url || source?.download_url || source?.signed_url;
    const sourceText = source?.source_code ?? source?.source ?? source?.content;
    if (sourceUrl) {
      const url = new URL(sourceUrl, API_URL || window.location.origin);
      let response;
      try {
        response = await fetch(url, { credentials: "omit" });
      } catch {
        throw new Error("Не удалось получить исходник из хранилища. Проверьте доступ к файлу и CORS.");
      }
      if (!response.ok) throw new Error(`Не удалось скачать исходник (HTTP ${response.status}).`);
      blob = await response.blob();
    } else if (typeof sourceText === "string") {
      blob = new Blob([sourceText], { type: "text/x-python;charset=utf-8" });
    } else {
      throw new Error("Сервер не предоставил исходный код этой версии метрики.");
    }
  }

  const code = String(metric?.code || "metric").replace(/[^a-z0-9_-]/gi, "_");
  const versionNumber = Number(version.version);
  const filename = `${code}${Number.isInteger(versionNumber) && versionNumber > 0 ? `-v${versionNumber}` : ""}.py`;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}
