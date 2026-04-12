const BASE_URL = "https://api.nsf.gov/services/v1/awards.json";

interface NSFAward {
  id: string;
  title: string;
  agency: string;
  awardNumber: string;
  piFirstName: string;
  piLastName: string;
  piEmail: string;
  awardeeCity: string;
  awardeeStateCode: string;
  awardeeName: string;
  fundsObligatedAmt: string;
  startDate: string;
  expDate: string;
  abstractText: string;
}

export async function searchNSFAwards(
  keyword: string,
  limit = 25
): Promise<NSFAward[]> {
  const params = new URLSearchParams({
    keyword,
    printFields: "id,title,agency,awardNumber,piFirstName,piLastName,piEmail,awardeeCity,awardeeStateCode,awardeeName,fundsObligatedAmt,startDate,expDate,abstractText",
    offset: "1",
    rpp: String(limit),
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`NSF API error: ${res.status}`);

  const data = await res.json();
  return data.response?.award || [];
}

export async function getAwardsByPI(
  piLastName: string,
  piFirstName?: string
): Promise<NSFAward[]> {
  const params = new URLSearchParams({
    piLastName,
    ...(piFirstName && { piFirstName }),
    printFields: "id,title,agency,awardNumber,piFirstName,piLastName,piEmail,awardeeName,fundsObligatedAmt,startDate,expDate",
    rpp: "50",
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  return data.response?.award || [];
}

export async function getActiveAwards(keyword: string): Promise<NSFAward[]> {
  const currentYear = new Date().getFullYear();
  const awards = await searchNSFAwards(keyword, 50);

  return awards.filter((award) => {
    if (!award.expDate) return false;
    const [month, , year] = award.expDate.split("/");
    return parseInt(year) >= currentYear;
  });
}
