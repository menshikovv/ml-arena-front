export const directionKey = (value) => value === "computer_vision" ? "cv" : value;
export const numberOrNull = (value) => value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
export const median = (values) => {
  const sorted = values.filter((value) => value != null && Number.isFinite(value)).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length ? sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2 : null;
};
export const isFinalCompetition = (item) => ["completed", "finished", "archived"].includes(item.status);
export const isOfficialResult = ({ competition, result }) => ["official", "official_platform", "official_partner"].includes(result.origin || competition.origin) && result.evidence_level !== "community_activity";
export const resultDate = ({ competition, result }) => result.confirmed_at || result.completed_at || competition.final_results_at || competition.deadline;
export const topPercent = ({ result }) => {
  const rank = numberOrNull(result.rank);
  const count = numberOrNull(result.participants_count);
  return rank > 0 && count >= rank ? rank / count * 100 : null;
};
export const safeArtifactUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  try {
    const url = new URL(value, globalThis.location?.origin || "http://localhost");
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
};

export async function allPages(fetchPage) {
  const items = [];
  for (let offset = 0; ; offset += 100) {
    const response = await fetchPage({ limit: 100, offset });
    const data = response?.data ?? response;
    const page = Array.isArray(data) ? data : data?.items || [];
    items.push(...page);
    const total = numberOrNull(response?.meta?.total ?? data?.total);
    if (page.length < 100 || (total != null && items.length >= total)) break;
  }
  return items;
}

export async function loadPassportEvidence(api) {
  const [catalog, duels] = await Promise.allSettled([
    allPages((params) => api.competitions.list({ status: "all", sort: "newest", ...params })),
    allPages((params) => api.duels.list({ status: "completed", sort: "-completed_at", ...params })),
  ]);
  let errors = Number(catalog.status === "rejected") + Number(duels.status === "rejected");
  const candidates = catalog.status === "fulfilled" ? catalog.value.filter((item) => isFinalCompetition(item) || ["has_valid_submit", "joined_no_submit"].includes(item.user_state)) : [];
  const competitions = [];
  // The existing API exposes own results per competition, not a passport history endpoint.
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, candidates.length) }, async () => {
    while (next < candidates.length) {
      const competition = candidates[next++];
      try {
        const result = await api.competitions.resultCard(competition.id);
        competitions.push({ competition, result });
      } catch (error) {
        if (error.status !== 404) errors += 1;
      }
    }
  }));
  competitions.sort((a, b) => (Date.parse(resultDate(b)) || 0) - (Date.parse(resultDate(a)) || 0));
  return { competitions, duels: duels.status === "fulfilled" ? duels.value : [], errors, duelsError: duels.status === "rejected" };
}

export function directionEvidence(evidence, code, ownerId, now = Date.now()) {
  const competitions = (evidence?.competitions || []).filter(({ competition }) => directionKey(competition.task_type) === directionKey(code));
  const official = competitions.filter((item) => isOfficialResult(item) && isFinalCompetition(item.competition) && item.result.leaderboard_kind === "private");
  const community = competitions.filter((item) => !isOfficialResult(item));
  const duels = (evidence?.duels || []).filter((item) => item.status === "completed" && (item.mode == null || item.mode === "rated") && directionKey(item.task_type) === directionKey(code) && [item.player1?.user_id, item.player2?.user_id].some((id) => String(id) === String(ownerId)));
  const recent = official.filter((item) => { const date = Date.parse(resultDate(item)); return Number.isFinite(date) && now - date >= 0 && now - date <= 180 * 86400000; }).slice(0, 3);
  const lastConfirmed = [...official.map(resultDate), ...duels.map((item) => item.completed_at)].filter((date) => Number.isFinite(Date.parse(date))).sort((a, b) => Date.parse(b) - Date.parse(a))[0] || null;
  const reviewed = official.filter(({ result }) => result.code_reviewed === true || result.reproduced === true || result.expert_defended === true);
  const percentages = official.map(topPercent).filter((value) => value != null);
  const age = lastConfirmed ? (now - Date.parse(lastConfirmed)) / 86400000 : Infinity;
  const times = duels.flatMap((duel) => {
    const own = String(duel.player1?.user_id) === String(ownerId) ? duel.player1 : duel.player2;
    const start = Date.parse(duel.started_at);
    const submitted = Date.parse(own?.submitted_at);
    return Number.isFinite(start) && Number.isFinite(submitted) && submitted >= start ? [(submitted - start) / 60000] : [];
  });
  const opponentRatings = duels.map((duel) => numberOrNull((String(duel.player1?.user_id) === String(ownerId) ? duel.player2 : duel.player1)?.rating)).filter((value) => value != null);
  const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const status = official.length >= 4 && reviewed.length && age >= 0 && age <= 180 ? "Высокая подтверждённость" : age >= 0 && age <= 365 && (official.length >= 2 || official.length >= 1 && duels.length >= 10) ? "Данных достаточно" : "Мало данных";
  return {
    competitions, official, community, duels, status, lastConfirmed,
    peak: percentages.length ? Math.min(...percentages) : null,
    typical: median(official.slice(0, 5).map(topPercent)),
    recent: recent.length >= 2 ? median(recent.map(topPercent)) : null,
    recentCount: recent.length,
    top10: official.filter((item) => topPercent(item) != null && topPercent(item) <= 10).length,
    wins: duels.filter((item) => !item.is_draw && String(item.winner_id) === String(ownerId)).length,
    draws: duels.filter((item) => item.is_draw).length,
    reviewed: official.some(({ result }) => [result.code_reviewed, result.reproduced, result.expert_defended].some((flag) => typeof flag === "boolean")) ? reviewed.length : null,
    averageSubmissionMinutes: average(times), averageOpponentRating: average(opponentRatings), submissionTimeCount: times.length,
  };
}

export function submissionStatistics(submissions, competition, metricDirection) {
  const ordered = [...submissions].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const valid = ordered.filter((item) => ["scored", "evaluated"].includes(item.status) && numberOrNull(item.public_score) != null);
  const baseline = numberOrNull(competition.baseline_score);
  const higher = metricDirection === "maximize";
  const knownDirection = ["maximize", "minimize"].includes(metricDirection);
  const better = (a, b) => higher ? a > b : a < b;
  const best = knownDirection ? valid.reduce((current, item) => !current || better(Number(item.public_score), Number(current.public_score)) ? item : current, null) : null;
  const beaten = baseline != null && knownDirection ? valid.find((item) => better(Number(item.public_score), baseline)) : null;
  const start = Date.parse(competition.starts_at);
  const minutes = beaten && Number.isFinite(start) && Date.parse(beaten.created_at) >= start ? Math.round((Date.parse(beaten.created_at) - start) / 60000) : null;
  const improvement = best && baseline != null ? (higher ? Number(best.public_score) - baseline : baseline - Number(best.public_score)) : null;
  return { ordered, valid, best, baseline, beaten, minutes, baselineKnown: baseline != null && knownDirection, improvement, improvementPercent: improvement != null && baseline !== 0 ? improvement / Math.abs(baseline) * 100 : null, attemptsToBaseline: beaten ? ordered.findIndex((item) => item.id === beaten.id) + 1 : null };
}
