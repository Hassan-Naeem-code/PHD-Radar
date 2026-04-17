const API = "https://pub.orcid.org/v3.0";

export interface OrcidRecord {
  orcid: string;
  givenName: string | null;
  familyName: string | null;
  biography: string | null;
  emails: string[];
  keywords: string[];
  employments: Array<{
    organization: string | null;
    department: string | null;
    role: string | null;
    startYear: number | null;
    endYear: number | null;
  }>;
  works: Array<{
    title: string;
    journal: string | null;
    year: number | null;
    type: string | null;
    doi: string | null;
  }>;
}

function headers() {
  return { Accept: "application/json", "User-Agent": "phdradar-bot/1.0" };
}

export async function searchOrcid(name: string, affiliation?: string): Promise<string[]> {
  const parts = name.trim().split(/\s+/);
  const given = parts[0];
  const family = parts.slice(1).join(" ");
  const clauses: string[] = [];
  if (given) clauses.push(`given-names:${given}`);
  if (family) clauses.push(`family-name:${family}`);
  if (affiliation) clauses.push(`affiliation-org-name:"${affiliation}"`);

  const params = new URLSearchParams({
    q: clauses.join(" AND "),
    rows: "5",
  });

  const res = await fetch(`${API}/search?${params}`, { headers: headers() });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    result?: Array<{ "orcid-identifier"?: { path?: string } }>;
  };
  return (data.result ?? [])
    .map((r) => r["orcid-identifier"]?.path)
    .filter((s): s is string => Boolean(s));
}

type Json = { [key: string]: unknown } | unknown[] | string | number | boolean | null;

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function intFromValue(v: unknown): number | null {
  const s = typeof v === "string" ? v : null;
  if (!s) return null;
  const n = parseInt(s);
  return Number.isFinite(n) ? n : null;
}

export async function getOrcidRecord(orcid: string): Promise<OrcidRecord | null> {
  const res = await fetch(`${API}/${orcid}/record`, { headers: headers() });
  if (!res.ok) return null;
  const data = (await res.json()) as Json;
  const root = obj(data);

  const person = obj(root.person);
  const nameObj = obj(person.name);
  const givenName = str(obj(nameObj["given-names"]).value);
  const familyName = str(obj(nameObj["family-name"]).value);
  const biography = str(obj(person.biography).content);
  const emails = arr(obj(person.emails).email)
    .map((e) => str(obj(e).email))
    .filter((v): v is string => Boolean(v));
  const keywords = arr(obj(person.keywords).keyword)
    .map((k) => str(obj(k).content))
    .filter((v): v is string => Boolean(v));

  const activities = obj(root["activities-summary"]);
  const employmentGroups = arr(obj(activities.employments)["affiliation-group"]);
  const employments = employmentGroups.flatMap((g) => {
    const summaries = arr(obj(g).summaries);
    return summaries.map((s) => {
      const summary = obj(obj(s)["employment-summary"]);
      const organization = obj(summary.organization);
      const startDate = obj(summary["start-date"]);
      const endDate = obj(summary["end-date"]);
      return {
        organization: str(organization.name),
        department: str(summary["department-name"]),
        role: str(summary["role-title"]),
        startYear: intFromValue(obj(startDate.year).value),
        endYear: intFromValue(obj(endDate.year).value),
      };
    });
  });

  const workGroups = arr(obj(activities.works).group);
  const works = workGroups.map((g) => {
    const summary = obj(arr(obj(g)["work-summary"])[0]);
    const titleObj = obj(obj(summary.title).title);
    const title = str(titleObj.value) ?? "(untitled)";
    const journal = str(obj(summary["journal-title"]).value);
    const publicationDate = obj(summary["publication-date"]);
    const year = intFromValue(obj(publicationDate.year).value);
    const type = str(summary.type);
    const externalIds = arr(obj(summary["external-ids"])["external-id"]);
    const doi = externalIds
      .map((e) => obj(e))
      .find((e) => str(e["external-id-type"]) === "doi");
    const doiValue = doi ? str(doi["external-id-value"]) : null;
    return { title, journal, year, type, doi: doiValue };
  });

  return {
    orcid,
    givenName,
    familyName,
    biography,
    emails,
    keywords,
    employments,
    works,
  };
}
