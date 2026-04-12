const BASE_URL = "https://api.semanticscholar.org/graph/v1";

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number;
  citationCount: number;
  authors: { name: string }[];
  venue: string | null;
  url: string;
  externalIds?: { DOI?: string };
}

interface SemanticScholarAuthor {
  authorId: string;
  name: string;
  affiliations: string[];
  paperCount: number;
  citationCount: number;
  hIndex: number;
  papers: SemanticScholarPaper[];
}

export async function searchPapers(
  query: string,
  limit = 10
): Promise<SemanticScholarPaper[]> {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    fields: "title,abstract,year,citationCount,authors,venue,url,externalIds",
  });

  const res = await fetch(`${BASE_URL}/paper/search?${params}`, {
    headers: {
      ...(process.env.SEMANTIC_SCHOLAR_API_KEY && {
        "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY,
      }),
    },
  });

  if (!res.ok) throw new Error(`Semantic Scholar API error: ${res.status}`);

  const data = await res.json();
  return data.data || [];
}

export async function getAuthorByName(
  name: string
): Promise<SemanticScholarAuthor | null> {
  const params = new URLSearchParams({
    query: name,
    limit: "1",
    fields: "name,affiliations,paperCount,citationCount,hIndex,papers.title,papers.year,papers.citationCount,papers.abstract,papers.venue,papers.url,papers.authors",
  });

  const res = await fetch(`${BASE_URL}/author/search?${params}`, {
    headers: {
      ...(process.env.SEMANTIC_SCHOLAR_API_KEY && {
        "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY,
      }),
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.data?.[0] || null;
}

export async function getPapersByAuthorId(
  authorId: string,
  limit = 20
): Promise<SemanticScholarPaper[]> {
  const params = new URLSearchParams({
    fields: "title,abstract,year,citationCount,authors,venue,url",
    limit: String(limit),
  });

  const res = await fetch(
    `${BASE_URL}/author/${authorId}/papers?${params}`,
    {
      headers: {
        ...(process.env.SEMANTIC_SCHOLAR_API_KEY && {
          "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY,
        }),
      },
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.data || [];
}
