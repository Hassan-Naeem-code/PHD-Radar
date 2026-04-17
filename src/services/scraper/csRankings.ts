const RANKINGS_CSV_URL =
  "https://raw.githubusercontent.com/emeryberger/CSrankings/gh-pages/csrankings.csv";

export interface CSRankingsAuthor {
  name: string;
  affiliation: string;
  homepage: string | null;
  scholarId: string | null;
  orcidId: string | null;
}

let cache: { data: CSRankingsAuthor[]; at: number } | null = null;
const TTL_MS = 24 * 60 * 60 * 1000;

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

export async function loadCSRankings(): Promise<CSRankingsAuthor[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const res = await fetch(RANKINGS_CSV_URL, {
    headers: { "User-Agent": "phdradar-bot/1.0" },
  });
  if (!res.ok) throw new Error(`CSRankings CSV fetch failed: ${res.status}`);

  const text = await res.text();
  const lines = text.split("\n").slice(1);
  const authors: CSRankingsAuthor[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);
    const [name, affiliation, homepage, scholarId, orcidId] = cols;
    if (!name || !affiliation) continue;
    const trimmedOrcid = orcidId?.trim();
    authors.push({
      name: name.trim(),
      affiliation: affiliation.trim(),
      homepage: homepage?.trim() || null,
      scholarId:
        scholarId?.trim() && scholarId.trim() !== "NOSCHOLARPAGE"
          ? scholarId.trim()
          : null,
      orcidId:
        trimmedOrcid && trimmedOrcid !== "0000-0000-0000-0000" && /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(trimmedOrcid)
          ? trimmedOrcid
          : null,
    });
  }

  cache = { data: authors, at: Date.now() };
  return authors;
}

export async function findAuthorByName(name: string): Promise<CSRankingsAuthor | null> {
  const all = await loadCSRankings();
  const needle = name.toLowerCase();
  return (
    all.find((a) => a.name.toLowerCase() === needle) ??
    all.find((a) => a.name.toLowerCase().includes(needle)) ??
    null
  );
}

export async function findAuthorsByAffiliation(
  affiliation: string
): Promise<CSRankingsAuthor[]> {
  const all = await loadCSRankings();
  const needle = affiliation.toLowerCase();
  return all.filter((a) => a.affiliation.toLowerCase().includes(needle));
}
