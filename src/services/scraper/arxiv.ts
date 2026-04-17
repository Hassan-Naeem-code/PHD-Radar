const BASE = "https://export.arxiv.org/api/query";

export interface ArxivPaper {
  arxivId: string;
  title: string;
  abstract: string;
  authors: string[];
  published: string;
  year: number;
  url: string;
  pdfUrl: string;
  categories: string[];
}

function tag(xml: string, name: string): string | null {
  const re = new RegExp(`<${name}(?:[^>]*)>([\\s\\S]*?)<\\/${name}>`, "i");
  const m = re.exec(xml);
  return m ? m[1].trim() : null;
}

function allTags(xml: string, name: string): string[] {
  const re = new RegExp(`<${name}(?:[^>]*)>([\\s\\S]*?)<\\/${name}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

function attrOf(entry: string, tagName: string, attrName: string): string[] {
  const re = new RegExp(`<${tagName}[^>]*${attrName}="([^"]*)"[^>]*\\/?>`, "g");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(entry))) out.push(m[1]);
  return out;
}

function decode(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchArxivByAuthor(
  authorName: string,
  limit = 25
): Promise<ArxivPaper[]> {
  const query = `au:"${authorName.replace(/"/g, "")}"`;
  const params = new URLSearchParams({
    search_query: query,
    max_results: String(limit),
    sortBy: "submittedDate",
    sortOrder: "descending",
  });

  const res = await fetch(`${BASE}?${params}`, {
    headers: {
      "User-Agent": "phdradar/1.0",
      Accept: "application/atom+xml",
    },
  });
  if (!res.ok) return [];
  const xml = await res.text();

  const entries = allTags(xml, "entry");
  return entries.map((entry) => {
    const idUrl = tag(entry, "id") ?? "";
    const arxivId = /arxiv\.org\/abs\/([^\s]+)/.exec(idUrl)?.[1] ?? idUrl;
    const title = decode(tag(entry, "title") ?? "");
    const abstract = decode(tag(entry, "summary") ?? "");
    const published = tag(entry, "published") ?? "";
    const year = published ? parseInt(published.slice(0, 4)) : new Date().getFullYear();
    const authors = allTags(entry, "author")
      .map((a) => tag(a, "name"))
      .filter((v): v is string => Boolean(v));
    const categories = attrOf(entry, "category", "term");
    const pdfUrl = `https://arxiv.org/pdf/${arxivId}`;
    const url = `https://arxiv.org/abs/${arxivId}`;

    return { arxivId, title, abstract, authors, published, year, url, pdfUrl, categories };
  });
}
