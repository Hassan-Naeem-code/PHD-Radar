const API = "https://api.crossref.org";

export interface CrossrefWork {
  doi: string;
  title: string;
  authors: string[];
  containerTitle: string | null;
  year: number | null;
  type: string;
  abstract: string | null;
  url: string | null;
  referencedByCount: number;
}

function mailto(): string {
  return process.env.CROSSREF_MAILTO || process.env.EMAIL_FROM || "noreply@phdradar.com";
}

function headers() {
  return {
    "User-Agent": `phdradar/1.0 (mailto:${mailto()})`,
    Accept: "application/json",
  };
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

function stripAbstract(s: string | null): string | null {
  if (!s) return null;
  return s
    .replace(/<jats:[^>]+>/g, "")
    .replace(/<\/jats:[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mapWork(raw: Json): CrossrefWork {
  const titleArr = arr(raw.title);
  const containerTitleArr = arr(raw["container-title"]);
  const authorList = arr(raw.author).map((a) => {
    const o = obj(a);
    const given = str(o.given) ?? "";
    const family = str(o.family) ?? "";
    return `${given} ${family}`.trim();
  }).filter(Boolean);
  const issued = obj(raw.issued);
  const dateParts = arr(issued["date-parts"])[0];
  const year =
    Array.isArray(dateParts) && typeof dateParts[0] === "number"
      ? (dateParts[0] as number)
      : null;

  return {
    doi: str(raw.DOI) ?? "",
    title: str(titleArr[0]) ?? "(untitled)",
    authors: authorList,
    containerTitle: str(containerTitleArr[0]),
    year,
    type: str(raw.type) ?? "journal-article",
    abstract: stripAbstract(str(raw.abstract)),
    url: str(raw.URL),
    referencedByCount: num(raw["is-referenced-by-count"]) ?? 0,
  };
}

export async function searchCrossrefByAuthor(
  authorName: string,
  limit = 25
): Promise<CrossrefWork[]> {
  const params = new URLSearchParams({
    "query.author": authorName,
    rows: String(Math.min(limit, 100)),
    sort: "published",
    order: "desc",
    select: "DOI,title,author,container-title,issued,type,abstract,URL,is-referenced-by-count",
  });

  const res = await fetch(`${API}/works?${params}`, { headers: headers() });
  if (!res.ok) return [];
  const data = obj(await res.json());
  const message = obj(data.message);
  return arr(message.items).map((w) => mapWork(obj(w)));
}

export async function getCrossrefWorkByDoi(doi: string): Promise<CrossrefWork | null> {
  const res = await fetch(`${API}/works/${encodeURIComponent(doi)}`, { headers: headers() });
  if (!res.ok) return null;
  const data = obj(await res.json());
  const message = obj(data.message);
  return mapWork(message);
}
