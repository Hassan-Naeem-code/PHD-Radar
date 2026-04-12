const BASE_URL = "https://api.reporter.nih.gov/v2/projects/search";

interface NIHProject {
  project_num: string;
  project_title: string;
  pi_names: { first_name: string; last_name: string }[];
  organization: { org_name: string; org_city: string; org_state: string };
  award_amount: number;
  project_start_date: string;
  project_end_date: string;
  abstract_text: string;
  agency_ic_fundings: { abbreviation: string }[];
}

export async function searchNIHGrants(
  keywords: string,
  limit = 25
): Promise<NIHProject[]> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      criteria: {
        advanced_text_search: {
          operator: "and",
          search_field: "projecttitle,terms",
          search_text: keywords,
        },
        is_active: true,
      },
      offset: 0,
      limit,
      sort_field: "project_start_date",
      sort_order: "desc",
    }),
  });

  if (!res.ok) throw new Error(`NIH API error: ${res.status}`);

  const data = await res.json();
  return data.results || [];
}

export async function getGrantsByPI(
  lastName: string,
  firstName?: string
): Promise<NIHProject[]> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      criteria: {
        pi_names: [
          {
            last_name: lastName,
            ...(firstName && { first_name: firstName }),
          },
        ],
        is_active: true,
      },
      offset: 0,
      limit: 50,
    }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.results || [];
}
