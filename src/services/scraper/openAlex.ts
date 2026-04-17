const API = "https://api.openalex.org";

export interface OpenAlexAuthor {
  id: string;
  orcid: string | null;
  displayName: string;
  worksCount: number;
  citedByCount: number;
  hIndex: number | null;
  i10Index: number | null;
  affiliations: Array<{ institution: string; country: string | null }>;
  lastKnownInstitution: string | null;
}

export interface OpenAlexWork {
  id: string;
  title: string;
  year: number | null;
  doi: string | null;
  venue: string | null;
  authors: string[];
  citedByCount: number;
  openAccessUrl: string | null;
  abstract: string | null;
  topics: string[];
}

function mailto(): string {
  return process.env.OPENALEX_MAILTO || process.env.EMAIL_FROM || "noreply@phdradar.com";
}

function headers() {
  return { "User-Agent": `phdradar/1.0 (mailto:${mailto()})` };
}

function decodeAbstractInvertedIndex(
  index: Record<string, number[]> | null | undefined
): string | null {
  if (!index) return null;
  const entries: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const p of positions) entries.push([p, word]);
  }
  entries.sort((a, b) => a[0] - b[0]);
  const text = entries.map(([, w]) => w).join(" ");
  return text.slice(0, 2000);
}

type Json = Record<string, unknown>;

function obj(v: unknown): Json {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {};
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}
function num(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

function mapAuthor(raw: Json): OpenAlexAuthor {
  const summaryStats = obj(raw.summary_stats);
  const lastInst = obj(raw.last_known_institution);
  const affiliations = arr(raw.affiliations).map((a) => {
    const inst = obj(obj(a).institution);
    return {
      institution: str(inst.display_name) ?? "",
      country: str(inst.country_code),
    };
  });

  return {
    id: str(raw.id) ?? "",
    orcid: str(raw.orcid)?.replace("https://orcid.org/", "") ?? null,
    displayName: str(raw.display_name) ?? "",
    worksCount: num(raw.works_count) ?? 0,
    citedByCount: num(raw.cited_by_count) ?? 0,
    hIndex: num(summaryStats.h_index),
    i10Index: num(summaryStats.i10_index),
    affiliations,
    lastKnownInstitution: str(lastInst.display_name),
  };
}

function mapWork(raw: Json): OpenAlexWork {
  const authorships = arr(raw.authorships);
  const authors = authorships
    .map((a) => str(obj(obj(a).author).display_name))
    .filter((v): v is string => Boolean(v));

  const primaryLocation = obj(raw.primary_location);
  const source = obj(primaryLocation.source);
  const venue = str(source.display_name);
  const openAccess = obj(raw.open_access);
  const concepts = arr(raw.concepts)
    .map((c) => str(obj(c).display_name))
    .filter((v): v is string => Boolean(v))
    .slice(0, 6);

  return {
    id: str(raw.id) ?? "",
    title: str(raw.title) ?? "(untitled)",
    year: num(raw.publication_year),
    doi: str(raw.doi)?.replace("https://doi.org/", "") ?? null,
    venue,
    authors,
    citedByCount: num(raw.cited_by_count) ?? 0,
    openAccessUrl: str(openAccess.oa_url),
    abstract: decodeAbstractInvertedIndex(
      raw.abstract_inverted_index as Record<string, number[]> | null | undefined
    ),
    topics: concepts,
  };
}

export async function searchOpenAlexAuthors(
  name: string,
  affiliationHint?: string
): Promise<OpenAlexAuthor[]> {
  const params = new URLSearchParams({ search: name, per_page: "10" });
  const res = await fetch(`${API}/authors?${params}`, { headers: headers() });
  if (!res.ok) return [];
  const data = obj(await res.json());
  const results = arr(data.results).map((r) => mapAuthor(obj(r)));

  if (!affiliationHint) return results;
  const hint = affiliationHint.toLowerCase();
  const ranked = [...results].sort((a, b) => {
    const aMatch = a.affiliations.some((x) => x.institution.toLowerCase().includes(hint)) ||
      (a.lastKnownInstitution?.toLowerCase().includes(hint) ?? false);
    const bMatch = b.affiliations.some((x) => x.institution.toLowerCase().includes(hint)) ||
      (b.lastKnownInstitution?.toLowerCase().includes(hint) ?? false);
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return b.citedByCount - a.citedByCount;
  });
  return ranked;
}

export async function getOpenAlexAuthorById(openAlexId: string): Promise<OpenAlexAuthor | null> {
  const clean = openAlexId.replace(`${API}/`, "");
  const res = await fetch(`${API}/${clean}`, { headers: headers() });
  if (!res.ok) return null;
  return mapAuthor(obj(await res.json()));
}

export async function getAuthorWorks(
  openAlexId: string,
  limit = 25
): Promise<OpenAlexWork[]> {
  const clean = openAlexId.replace(`${API}/`, "").replace("authors/", "");
  const params = new URLSearchParams({
    filter: `author.id:${clean}`,
    per_page: String(Math.min(limit, 200)),
    sort: "cited_by_count:desc",
  });
  const res = await fetch(`${API}/works?${params}`, { headers: headers() });
  if (!res.ok) return [];
  const data = obj(await res.json());
  return arr(data.results).map((r) => mapWork(obj(r)));
}

export async function findProfessorOpenAlexProfile(
  name: string,
  affiliation?: string
): Promise<{ author: OpenAlexAuthor | null; works: OpenAlexWork[] }> {
  const authors = await searchOpenAlexAuthors(name, affiliation);
  if (authors.length === 0) return { author: null, works: [] };
  const top = authors[0];
  const works = top.id ? await getAuthorWorks(top.id, 25) : [];
  return { author: top, works };
}
