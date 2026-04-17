export interface MediumPost {
  title: string;
  link: string;
  pubDate: string;
  category: string[];
  excerpt: string;
}

function extractTag(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = re.exec(xml);
  return m ? m[1].trim() : null;
}

function extractAllTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1].trim());
  return out;
}

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function getMediumPosts(username: string, limit = 10): Promise<MediumPost[]> {
  const clean = username.replace(/^@/, "");
  const res = await fetch(`https://medium.com/feed/@${encodeURIComponent(clean)}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; phdradar/1.0; +https://phdradar.com)",
      Accept: "application/rss+xml,application/xml,text/xml",
    },
  });
  if (!res.ok) return [];

  const xml = await res.text();
  const items = extractAllTags(xml, "item");

  return items.slice(0, limit).map((item) => {
    const title = stripCdata(extractTag(item, "title") ?? "");
    const link = extractTag(item, "link") ?? "";
    const pubDate = extractTag(item, "pubDate") ?? "";
    const category = extractAllTags(item, "category").map(stripCdata);
    const rawDescription = stripCdata(extractTag(item, "description") ?? "");
    const excerpt = stripHtml(rawDescription).slice(0, 300);

    return { title, link, pubDate, category, excerpt };
  });
}

export function extractMediumUsernameFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("medium.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const username = parts[0]?.startsWith("@") ? parts[0] : null;
    return username;
  } catch {
    return null;
  }
}
