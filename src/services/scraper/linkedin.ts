const API = "https://nubela.co/proxycurl/api/v2";

export interface LinkedInProfile {
  full_name: string | null;
  headline: string | null;
  summary: string | null;
  occupation: string | null;
  country: string | null;
  city: string | null;
  profile_pic_url: string | null;
  experiences: Array<{
    title: string | null;
    company: string | null;
    starts_at: { year: number | null } | null;
    ends_at: { year: number | null } | null;
    description: string | null;
  }>;
  education: Array<{
    school: string | null;
    degree_name: string | null;
    field_of_study: string | null;
    starts_at: { year: number | null } | null;
    ends_at: { year: number | null } | null;
  }>;
  public_identifier: string | null;
}

export function isLinkedInConfigured(): boolean {
  return Boolean(process.env.PROXYCURL_API_KEY);
}

export async function getLinkedInProfile(url: string): Promise<LinkedInProfile | null> {
  if (!isLinkedInConfigured()) return null;

  const params = new URLSearchParams({
    url,
    fallback_to_cache: "on-error",
    use_cache: "if-present",
    skills: "include",
  });

  const res = await fetch(`${API}/linkedin?${params}`, {
    headers: {
      Authorization: `Bearer ${process.env.PROXYCURL_API_KEY}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) return null;
  return (await res.json()) as LinkedInProfile;
}

export function extractLinkedInUsernameFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("linkedin.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const inIdx = parts.indexOf("in");
    return inIdx >= 0 ? parts[inIdx + 1] ?? null : null;
  } catch {
    return null;
  }
}
