export interface FundingSource {
  country: string;
  agency: string;
  apiUrl?: string;
  scrapingUrl?: string;
  dataFormat: "api" | "scrape" | "manual";
}

export const FUNDING_SOURCES: FundingSource[] = [
  { country: "US", agency: "NSF", apiUrl: "https://api.nsf.gov/services/v1/awards.json", dataFormat: "api" },
  { country: "US", agency: "NIH", apiUrl: "https://api.reporter.nih.gov/v2/projects/search", dataFormat: "api" },
  { country: "CA", agency: "NSERC", scrapingUrl: "https://www.nserc-crcng.gc.ca/ase-ore/index_eng.asp", dataFormat: "scrape" },
  { country: "UK", agency: "UKRI", apiUrl: "https://gtr.ukri.org/gtr/api/", dataFormat: "api" },
  { country: "EU", agency: "ERC", scrapingUrl: "https://erc.europa.eu/projects-figures/project-database", dataFormat: "scrape" },
  { country: "DE", agency: "DAAD", scrapingUrl: "https://www.daad.de/en/study-and-research-in-germany/scholarships/", dataFormat: "scrape" },
  { country: "AU", agency: "ARC", apiUrl: "https://dataportal.arc.gov.au/NCGP/API/", dataFormat: "api" },
  { country: "NL", agency: "NWO", scrapingUrl: "https://www.nwo.nl/en/researchprogrammes", dataFormat: "scrape" },
  { country: "CH", agency: "SNF", scrapingUrl: "https://data.snf.ch", dataFormat: "api" },
  { country: "SG", agency: "NRF", scrapingUrl: "https://www.nrf.gov.sg", dataFormat: "scrape" },
  { country: "HK", agency: "RGC", scrapingUrl: "https://www.ugc.edu.hk/eng/rgc/", dataFormat: "scrape" },
];

export function getFundingSourcesForCountry(country: string): FundingSource[] {
  return FUNDING_SOURCES.filter((s) => s.country === country);
}

export function getApiBasedSources(): FundingSource[] {
  return FUNDING_SOURCES.filter((s) => s.dataFormat === "api");
}
