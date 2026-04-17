const BASE_URL = "https://serpapi.com/search.json";

export interface ScholarAuthor {
  authorId: string | null;
  name: string;
  affiliations: string | null;
  email: string | null;
  interests: string[];
  citedBy: { total: number | null; five_year: number | null; hIndex: number | null; i10Index: number | null };
  thumbnail: string | null;
  profileUrl: string | null;
}

export interface ScholarPaper {
  title: string;
  link: string | null;
  authors: string[];
  publication: string | null;
  year: number | null;
  citedBy: number;
}

export function isGoogleScholarConfigured(): boolean {
  return Boolean(process.env.SERPAPI_KEY);
}

function key() {
  const k = process.env.SERPAPI_KEY;
  if (!k) throw new Error("SERPAPI_KEY not configured");
  return k;
}

export async function searchScholarAuthors(name: string): Promise<ScholarAuthor[]> {
  if (!isGoogleScholarConfigured()) return [];
  const params = new URLSearchParams({
    engine: "google_scholar_profiles",
    mauthors: name,
    api_key: key(),
  });
  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    profiles?: Array<{
      author_id: string;
      name: string;
      affiliations?: string;
      email?: string;
      interests?: Array<{ title: string }>;
      cited_by?: number;
      thumbnail?: string;
      link?: string;
    }>;
  };

  return (data.profiles ?? []).map((p) => ({
    authorId: p.author_id ?? null,
    name: p.name,
    affiliations: p.affiliations ?? null,
    email: p.email ?? null,
    interests: (p.interests ?? []).map((i) => i.title),
    citedBy: { total: p.cited_by ?? null, five_year: null, hIndex: null, i10Index: null },
    thumbnail: p.thumbnail ?? null,
    profileUrl: p.link ?? null,
  }));
}

export async function getScholarAuthor(authorId: string): Promise<{
  author: ScholarAuthor | null;
  articles: ScholarPaper[];
}> {
  if (!isGoogleScholarConfigured()) return { author: null, articles: [] };
  const params = new URLSearchParams({
    engine: "google_scholar_author",
    author_id: authorId,
    api_key: key(),
  });
  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) return { author: null, articles: [] };
  const data = (await res.json()) as {
    author?: {
      name: string;
      affiliations?: string;
      email?: string;
      interests?: Array<{ title: string }>;
      thumbnail?: string;
    };
    cited_by?: { table?: Array<Record<string, { all?: number; since_2020?: number; since_2019?: number }>> };
    articles?: Array<{
      title: string;
      link?: string;
      authors?: string;
      publication?: string;
      year?: string;
      cited_by?: { value?: number };
    }>;
  };

  const citations = data.cited_by?.table ?? [];
  const read = (field: string): number | null => {
    const row = citations.find((r) => field in r);
    if (!row) return null;
    const entry = row[field];
    return entry?.all ?? null;
  };

  const author: ScholarAuthor | null = data.author
    ? {
        authorId,
        name: data.author.name,
        affiliations: data.author.affiliations ?? null,
        email: data.author.email ?? null,
        interests: (data.author.interests ?? []).map((i) => i.title),
        citedBy: {
          total: read("citations"),
          five_year: null,
          hIndex: read("h_index"),
          i10Index: read("i10_index"),
        },
        thumbnail: data.author.thumbnail ?? null,
        profileUrl: `https://scholar.google.com/citations?user=${authorId}`,
      }
    : null;

  const articles: ScholarPaper[] = (data.articles ?? []).map((a) => ({
    title: a.title,
    link: a.link ?? null,
    authors: a.authors ? a.authors.split(",").map((s) => s.trim()) : [],
    publication: a.publication ?? null,
    year: a.year ? parseInt(a.year) : null,
    citedBy: a.cited_by?.value ?? 0,
  }));

  return { author, articles };
}

export async function findProfessorScholarProfile(
  name: string,
  affiliationHint?: string
): Promise<{ author: ScholarAuthor | null; articles: ScholarPaper[] }> {
  const profiles = await searchScholarAuthors(name);
  if (profiles.length === 0) return { author: null, articles: [] };

  const hint = affiliationHint?.toLowerCase();
  const match: ScholarAuthor =
    (hint
      ? profiles.find((p) => p.affiliations?.toLowerCase().includes(hint))
      : undefined) ?? profiles[0];

  if (!match.authorId) return { author: match, articles: [] };
  return getScholarAuthor(match.authorId);
}
