export interface DblpAuthor {
  name: string;
  pid: string;
  url: string;
  affiliations: string[];
}

export interface DblpPublication {
  title: string;
  authors: string[];
  venue: string | null;
  year: number | null;
  type: string | null;
  url: string | null;
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

export async function searchDblpAuthor(name: string): Promise<DblpAuthor[]> {
  const params = new URLSearchParams({
    q: name,
    format: "json",
    h: "10",
  });
  const res = await fetch(`https://dblp.org/search/author/api?${params}`);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    result?: {
      hits?: {
        hit?: Array<{
          info?: {
            author: string;
            url: string;
            notes?: { note?: { "@type"?: string; text?: string } | Array<{ "@type"?: string; text?: string }> };
          };
        }>;
      };
    };
  };

  const hits = data.result?.hits?.hit ?? [];
  return hits
    .filter((h) => h.info)
    .map((h) => {
      const info = h.info!;
      const pidMatch = /pid\/([^/]+\/[^/]+)$/.exec(info.url);
      const notes = info.notes?.note;
      const affiliations: string[] = [];
      if (Array.isArray(notes)) {
        for (const n of notes) {
          if (n["@type"] === "affiliation" && n.text) affiliations.push(n.text);
        }
      } else if (notes && notes["@type"] === "affiliation" && notes.text) {
        affiliations.push(notes.text);
      }
      return {
        name: info.author,
        pid: pidMatch?.[1] ?? "",
        url: info.url,
        affiliations,
      };
    });
}

export async function getDblpPublicationsByPid(pid: string): Promise<DblpPublication[]> {
  const res = await fetch(`https://dblp.org/pid/${pid}.xml`);
  if (!res.ok) return [];
  const xml = await res.text();

  const publEntries = allTags(xml, "r")
    .flatMap((r) => allTags(r, "article").concat(allTags(r, "inproceedings"), allTags(r, "book"), allTags(r, "incollection")));

  const direct = [
    ...allTags(xml, "article"),
    ...allTags(xml, "inproceedings"),
    ...allTags(xml, "book"),
    ...allTags(xml, "incollection"),
  ];

  const entries = [...new Set([...publEntries, ...direct])];

  return entries.map((entry) => {
    const title = tag(entry, "title")?.replace(/\.\s*$/, "") ?? "(untitled)";
    const authors = allTags(entry, "author").map((a) => a.replace(/<[^>]+>/g, "").trim());
    const venue = tag(entry, "journal") ?? tag(entry, "booktitle");
    const yearRaw = tag(entry, "year");
    const year = yearRaw ? parseInt(yearRaw) : null;
    const eeUrl = tag(entry, "ee");
    return { title, authors, venue, year, type: null, url: eeUrl };
  });
}

export function extractDblpPidFromUrl(url: string): string | null {
  const m = /dblp\.org\/pid\/([^/]+\/[^/.]+)/.exec(url);
  return m?.[1] ?? null;
}
