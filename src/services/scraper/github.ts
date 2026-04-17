const API = "https://api.github.com";

export interface GithubUser {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  email: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  avatar_url: string;
  html_url: string;
}

export interface GithubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
}

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "phdradar-bot/1.0",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

export async function getGithubUser(username: string): Promise<GithubUser | null> {
  const res = await fetch(`${API}/users/${encodeURIComponent(username)}`, { headers: headers() });
  if (!res.ok) return null;
  return (await res.json()) as GithubUser;
}

export async function getGithubRepos(
  username: string,
  limit = 10
): Promise<GithubRepo[]> {
  const res = await fetch(
    `${API}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=${limit}`,
    { headers: headers() }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as GithubRepo[];
  return data
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, limit);
}

export async function getTopLanguages(username: string): Promise<Record<string, number>> {
  const repos = await getGithubRepos(username, 30);
  const counts: Record<string, number> = {};
  for (const r of repos) {
    if (r.language) counts[r.language] = (counts[r.language] ?? 0) + 1;
  }
  return counts;
}

export function extractGithubUsernameFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("github.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[0] ?? null;
  } catch {
    return null;
  }
}
