import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  findProfessorScholarProfile,
  isGoogleScholarConfigured,
} from "./googleScholar";
import { findProfessorOpenAlexProfile } from "./openAlex";
import { searchArxivByAuthor } from "./arxiv";
import { searchCrossrefByAuthor } from "./crossref";
import { findAuthorByName, findAuthorsByAffiliation } from "./csRankings";
import {
  getGithubUser,
  getTopLanguages,
  extractGithubUsernameFromUrl,
} from "./github";
import {
  getLinkedInProfile,
  isLinkedInConfigured,
  extractLinkedInUsernameFromUrl,
} from "./linkedin";
import { getMediumPosts, extractMediumUsernameFromUrl } from "./medium";
import {
  searchDblpAuthor,
  getDblpPublicationsByPid,
  extractDblpPidFromUrl,
} from "./dblp";
import { searchOrcid, getOrcidRecord } from "./orcid";
import { scrapeFacultyPage } from "./facultyPage";
import { getAwardsByPI } from "./nsfAwards";
import { getGrantsByPI } from "./nihReporter";
import {
  indexProfessor,
  indexPublications,
  isSemanticConfigured,
} from "../search/semantic";
import { logger } from "@/lib/logger";

export interface EnrichmentReport {
  professorId: string;
  sourcesUsed: string[];
  sourcesSkipped: string[];
  updated: Record<string, unknown>;
  publicationsAdded: number;
  errors: Array<{ source: string; message: string }>;
}

export type EnrichmentSource =
  | "openAlex"
  | "arxiv"
  | "crossref"
  | "googleScholar"
  | "csRankings"
  | "github"
  | "linkedin"
  | "medium"
  | "dblp"
  | "orcid"
  | "facultyPage"
  | "nsf"
  | "nih";

export interface EnrichmentOptions {
  force?: boolean;
  sources?: EnrichmentSource[];
}

export const FREE_SOURCES: EnrichmentSource[] = [
  "openAlex", "arxiv", "crossref", "csRankings",
  "github", "medium", "dblp", "orcid", "facultyPage",
  "nsf", "nih",
];

function pick<T>(...values: Array<T | null | undefined>): T | null {
  for (const v of values) if (v !== null && v !== undefined && v !== "") return v;
  return null;
}

async function runSource<T>(
  name: string,
  fn: () => Promise<T>,
  report: EnrichmentReport
): Promise<T | null> {
  try {
    const out = await fn();
    report.sourcesUsed.push(name);
    return out;
  } catch (err) {
    report.errors.push({
      source: name,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function enrichProfessor(
  professorId: string,
  options: EnrichmentOptions = {}
): Promise<EnrichmentReport> {
  const prof = await prisma.professor.findUnique({
    where: { id: professorId },
    include: { university: true, publications: true },
  });
  if (!prof) throw new Error(`Professor ${professorId} not found`);

  const report: EnrichmentReport = {
    professorId,
    sourcesUsed: [],
    sourcesSkipped: [],
    updated: {},
    publicationsAdded: 0,
    errors: [],
  };

  const enabled = new Set<EnrichmentSource>(
    options.sources ?? [
      "openAlex", "arxiv", "crossref", "googleScholar", "csRankings",
      "github", "linkedin", "medium", "dblp", "orcid", "facultyPage",
      "nsf", "nih",
    ]
  );

  const nameParts = prof.name.replace(/^Dr\.?\s+/i, "").trim().split(/\s+/);
  const piFirstName = nameParts.length > 1 ? nameParts[0] : undefined;
  const piLastName = nameParts[nameParts.length - 1];

  const merged: Prisma.ProfessorUpdateInput = {};
  const newPublications: Array<{
    title: string;
    authors: string[];
    venue: string | null;
    year: number;
    citationCount: number;
    url: string | null;
    semanticScholarId: string | null;
  }> = [];

  if (enabled.has("csRankings")) {
    const csr = await runSource("csRankings", () => findAuthorByName(prof.name), report);
    if (csr) {
      if (csr.scholarId && !prof.googleScholarId) {
        merged.googleScholarId = csr.scholarId;
        merged.googleScholarUrl = `https://scholar.google.com/citations?user=${csr.scholarId}`;
      }
      if (csr.orcidId && !prof.orcidId) merged.orcidId = csr.orcidId;
      if (csr.homepage && !prof.personalWebsite) {
        merged.personalWebsite = csr.homepage;
      }
    }
  } else {
    report.sourcesSkipped.push("csRankings");
  }

  if (enabled.has("openAlex")) {
    const result = await runSource(
      "openAlex",
      () => findProfessorOpenAlexProfile(prof.name, prof.university?.name),
      report
    );
    if (result?.author) {
      merged.citations = pick(prof.citations, result.author.citedByCount);
      merged.hIndex = pick(prof.hIndex, result.author.hIndex);
      if (!prof.orcidId && result.author.orcid) merged.orcidId = result.author.orcid;
      if (!prof.recentPaperCount && result.author.worksCount) {
        merged.recentPaperCount = result.author.worksCount;
      }
    }
    for (const w of result?.works ?? []) {
      if (!w.year || !w.title) continue;
      if (prof.publications.some((x) => x.title.toLowerCase() === w.title.toLowerCase())) continue;
      if (newPublications.some((x) => x.title.toLowerCase() === w.title.toLowerCase())) continue;
      newPublications.push({
        title: w.title,
        authors: w.authors,
        venue: w.venue,
        year: w.year,
        citationCount: w.citedByCount,
        url: w.openAccessUrl ?? (w.doi ? `https://doi.org/${w.doi}` : null),
        semanticScholarId: null,
      });
    }
  } else {
    report.sourcesSkipped.push("openAlex");
  }

  if (enabled.has("arxiv")) {
    const papers = await runSource("arxiv", () => searchArxivByAuthor(prof.name, 15), report);
    for (const p of papers ?? []) {
      if (!p.title || !p.year) continue;
      if (prof.publications.some((x) => x.title.toLowerCase() === p.title.toLowerCase())) continue;
      if (newPublications.some((x) => x.title.toLowerCase() === p.title.toLowerCase())) continue;
      newPublications.push({
        title: p.title,
        authors: p.authors,
        venue: p.categories.join(", ") || "arXiv",
        year: p.year,
        citationCount: 0,
        url: p.url,
        semanticScholarId: null,
      });
    }
  } else {
    report.sourcesSkipped.push("arxiv");
  }

  if (enabled.has("crossref")) {
    const works = await runSource("crossref", () => searchCrossrefByAuthor(prof.name, 15), report);
    for (const w of works ?? []) {
      if (!w.title || !w.year) continue;
      if (prof.publications.some((x) => x.title.toLowerCase() === w.title.toLowerCase())) continue;
      if (newPublications.some((x) => x.title.toLowerCase() === w.title.toLowerCase())) continue;
      newPublications.push({
        title: w.title,
        authors: w.authors,
        venue: w.containerTitle,
        year: w.year,
        citationCount: w.referencedByCount,
        url: w.url,
        semanticScholarId: null,
      });
    }
  } else {
    report.sourcesSkipped.push("crossref");
  }

  if (enabled.has("googleScholar")) {
    if (!isGoogleScholarConfigured()) {
      report.sourcesSkipped.push("googleScholar (SERPAPI_KEY missing — OpenAlex covers this for free)");
    } else {
      const scholar = await runSource(
        "googleScholar",
        () =>
          findProfessorScholarProfile(
            prof.name,
            prof.university?.name ?? undefined
          ),
        report
      );
      if (scholar?.author) {
        merged.googleScholarId = pick(prof.googleScholarId, scholar.author.authorId);
        merged.googleScholarUrl = pick(prof.googleScholarUrl, scholar.author.profileUrl);
        merged.email = pick(prof.email, scholar.author.email);
        merged.citations = pick(prof.citations, scholar.author.citedBy.total);
        merged.hIndex = pick(prof.hIndex, scholar.author.citedBy.hIndex);
        if (scholar.author.interests.length && prof.researchAreas.length === 0) {
          merged.researchAreas = scholar.author.interests;
        }
      }
      for (const p of scholar?.articles ?? []) {
        if (!p.title || !p.year) continue;
        if (prof.publications.some((x) => x.title.toLowerCase() === p.title.toLowerCase())) continue;
        newPublications.push({
          title: p.title,
          authors: p.authors,
          venue: p.publication,
          year: p.year,
          citationCount: p.citedBy,
          url: p.link,
          semanticScholarId: null,
        });
      }
    }
  } else {
    report.sourcesSkipped.push("googleScholar");
  }

  if (enabled.has("dblp")) {
    const pid = prof.dblpPid ?? (prof.dblpUrl ? extractDblpPidFromUrl(prof.dblpUrl) : null);
    let resolvedPid = pid;
    if (!resolvedPid) {
      const hits = await runSource("dblp", () => searchDblpAuthor(prof.name), report);
      const match = hits?.find((h) =>
        h.affiliations.some((a) =>
          a.toLowerCase().includes(prof.university.name.toLowerCase())
        )
      ) ?? hits?.[0];
      if (match?.pid) {
        resolvedPid = match.pid;
        merged.dblpPid = match.pid;
        merged.dblpUrl = match.url;
      }
    }
    if (resolvedPid) {
      const pubs = await runSource("dblp", () => getDblpPublicationsByPid(resolvedPid!), report);
      for (const p of pubs ?? []) {
        if (!p.year || !p.title) continue;
        if (prof.publications.some((x) => x.title.toLowerCase() === p.title.toLowerCase())) continue;
        if (newPublications.some((x) => x.title.toLowerCase() === p.title.toLowerCase())) continue;
        newPublications.push({
          title: p.title,
          authors: p.authors,
          venue: p.venue,
          year: p.year,
          citationCount: 0,
          url: p.url,
          semanticScholarId: null,
        });
      }
    }
  } else {
    report.sourcesSkipped.push("dblp");
  }

  if (enabled.has("orcid")) {
    let orcid = prof.orcidId;
    if (!orcid) {
      const hits = await runSource(
        "orcid",
        () => searchOrcid(prof.name, prof.university?.name),
        report
      );
      if (hits && hits.length > 0) orcid = hits[0];
    }
    if (orcid) {
      merged.orcidId = orcid;
      const record = await runSource("orcid", () => getOrcidRecord(orcid!), report);
      if (record) {
        if (record.emails.length && !prof.email) merged.email = record.emails[0];
        if (record.keywords.length && prof.researchAreas.length === 0) {
          merged.researchAreas = record.keywords;
        }
        if (record.biography && !prof.researchSummary) {
          merged.researchSummary = record.biography;
        }
        for (const w of record.works) {
          if (!w.year || !w.title) continue;
          if (prof.publications.some((x) => x.title.toLowerCase() === w.title.toLowerCase())) continue;
          if (newPublications.some((x) => x.title.toLowerCase() === w.title.toLowerCase())) continue;
          newPublications.push({
            title: w.title,
            authors: [prof.name],
            venue: w.journal,
            year: w.year,
            citationCount: 0,
            url: w.doi ? `https://doi.org/${w.doi}` : null,
            semanticScholarId: null,
          });
        }
      }
    }
  } else {
    report.sourcesSkipped.push("orcid");
  }

  if (enabled.has("github")) {
    const username =
      prof.githubUsername ??
      (prof.githubUrl ? extractGithubUsernameFromUrl(prof.githubUrl) : null);
    if (username) {
      const user = await runSource("github", () => getGithubUser(username), report);
      if (user) {
        merged.githubUsername = username;
        merged.githubUrl = user.html_url;
        if (!prof.personalWebsite && user.blog) merged.personalWebsite = user.blog;
        if (!prof.twitterHandle && user.twitter_username) merged.twitterHandle = user.twitter_username;
      }
      await runSource("github", () => getTopLanguages(username), report);
    }
  } else {
    report.sourcesSkipped.push("github");
  }

  if (enabled.has("linkedin")) {
    if (!isLinkedInConfigured()) {
      report.sourcesSkipped.push("linkedin (PROXYCURL_API_KEY missing — no free alternative; use ORCID + faculty page instead)");
    } else if (prof.linkedinUrl) {
      const profile = await runSource("linkedin", () => getLinkedInProfile(prof.linkedinUrl!), report);
      if (profile) {
        const username = extractLinkedInUsernameFromUrl(prof.linkedinUrl);
        if (username) merged.linkedinUrl = `https://www.linkedin.com/in/${username}`;
        if (profile.summary && !prof.researchSummary) merged.researchSummary = profile.summary;
      }
    } else {
      report.sourcesSkipped.push("linkedin (no linkedinUrl)");
    }
  } else {
    report.sourcesSkipped.push("linkedin");
  }

  if (enabled.has("medium")) {
    const username =
      prof.mediumUsername ??
      (prof.personalWebsite ? extractMediumUsernameFromUrl(prof.personalWebsite) : null);
    if (username) {
      const posts = await runSource("medium", () => getMediumPosts(username, 10), report);
      if (posts && posts.length) merged.mediumUsername = username.replace(/^@/, "");
    }
  } else {
    report.sourcesSkipped.push("medium");
  }

  const newGrants: Array<{
    title: string;
    agency: string;
    awardNumber: string | null;
    amount: number | null;
    startDate: Date | null;
    endDate: Date | null;
    status: string;
    sourceUrl: string | null;
  }> = [];

  if (enabled.has("nsf") && piLastName) {
    const awards = await runSource(
      "nsf",
      () => getAwardsByPI(piLastName, piFirstName),
      report
    );
    const thisYear = new Date().getFullYear();
    for (const a of awards ?? []) {
      if (!a.title) continue;
      const parseMMDDYYYY = (s?: string): Date | null => {
        if (!s) return null;
        const [m, d, y] = s.split("/");
        if (!y) return null;
        return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
      };
      const endDate = parseMMDDYYYY(a.expDate);
      const isActive = endDate ? endDate.getFullYear() >= thisYear : false;
      newGrants.push({
        title: a.title,
        agency: a.agency || "NSF",
        awardNumber: a.awardNumber ?? null,
        amount: a.fundsObligatedAmt ? parseFloat(a.fundsObligatedAmt) : null,
        startDate: parseMMDDYYYY(a.startDate),
        endDate,
        status: isActive ? "Active" : "Completed",
        sourceUrl: a.awardNumber
          ? `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${a.awardNumber}`
          : null,
      });
    }
  } else if (enabled.has("nsf")) {
    report.sourcesSkipped.push("nsf (no name)");
  } else {
    report.sourcesSkipped.push("nsf");
  }

  if (enabled.has("nih") && piLastName) {
    const grants = await runSource(
      "nih",
      () => getGrantsByPI(piLastName, piFirstName),
      report
    );
    const thisYear = new Date().getFullYear();
    for (const g of grants ?? []) {
      const title = g.project_title;
      if (!title) continue;
      const startDate = g.project_start_date ? new Date(g.project_start_date) : null;
      const endDate = g.project_end_date ? new Date(g.project_end_date) : null;
      const isActive = endDate ? endDate.getFullYear() >= thisYear : true;
      const agencyAbbr = g.agency_ic_fundings?.[0]?.abbreviation ?? "NIH";
      newGrants.push({
        title,
        agency: agencyAbbr,
        awardNumber: g.project_num ?? null,
        amount: g.award_amount ?? null,
        startDate,
        endDate,
        status: isActive ? "Active" : "Completed",
        sourceUrl: g.project_num
          ? `https://reporter.nih.gov/project-details/${g.project_num}`
          : null,
      });
    }
  } else if (enabled.has("nih")) {
    report.sourcesSkipped.push("nih (no name)");
  } else {
    report.sourcesSkipped.push("nih");
  }

  if (enabled.has("facultyPage")) {
    const pageUrl = prof.facultyPageUrl ?? prof.personalWebsite;
    if (pageUrl) {
      const extracted = await runSource("facultyPage", () => scrapeFacultyPage(pageUrl), report);
      if (extracted) {
        merged.facultyPageUrl = pageUrl;
        if (extracted.email && !prof.email) merged.email = extracted.email;
        if (extracted.phone && !prof.phone) merged.phone = extracted.phone;
        if (extracted.labName && !prof.labName) merged.labName = extracted.labName;
        if (extracted.labWebsite && !prof.labWebsite) merged.labWebsite = extracted.labWebsite;
        if (extracted.lookingForStudents) {
          merged.lookingForStudents = true;
          if (extracted.lookingForStudentsEvidence) {
            merged.lookingForStudentsSource = extracted.lookingForStudentsEvidence;
          }
        }
        if (extracted.researchAreas.length && prof.researchAreas.length === 0) {
          merged.researchAreas = extracted.researchAreas;
        }
      }
    }
  } else {
    report.sourcesSkipped.push("facultyPage");
  }

  merged.lastScrapedAt = new Date();
  merged.lastEnrichedAt = new Date();
  if (report.sourcesUsed.length >= 4) merged.dataQuality = "HIGH";
  else if (report.sourcesUsed.length >= 2) merged.dataQuality = "MEDIUM";

  await prisma.professor.update({ where: { id: professorId }, data: merged });
  report.updated = merged as Record<string, unknown>;

  if (newPublications.length) {
    await prisma.publication.createMany({
      data: newPublications.slice(0, 50).map((p) => ({
        ...p,
        professorId,
      })),
    });
    report.publicationsAdded = Math.min(newPublications.length, 50);
  }

  if (newGrants.length) {
    const existingGrants = await prisma.fundingGrant.findMany({
      where: { professorId },
      select: { awardNumber: true, title: true },
    });
    const existingKeys = new Set(
      existingGrants.map((g) => g.awardNumber ?? g.title.toLowerCase())
    );

    const toCreate = newGrants.filter((g) => {
      const key = g.awardNumber ?? g.title.toLowerCase();
      return !existingKeys.has(key);
    });

    if (toCreate.length) {
      await prisma.fundingGrant.createMany({
        data: toCreate.map((g) => ({ ...g, professorId })),
      });
    }

    const hasActive = newGrants.some((g) => g.status === "Active")
      || existingGrants.length > 0;
    if (hasActive && !prof.hasActiveFunding) {
      await prisma.professor.update({
        where: { id: professorId },
        data: { hasActiveFunding: true },
      });
    }

    (report.updated as Record<string, unknown>).grantsAdded = toCreate.length;
  }

  if (isSemanticConfigured()) {
    const enrichLog = logger.child({ module: "enrich", professorId });
    Promise.all([
      indexProfessor(professorId),
      indexPublications(professorId),
    ]).catch((err) => {
      enrichLog.error("semantic index update failed", { err });
    });
  }

  return report;
}

export async function enrichProfessorsByAffiliation(
  affiliation: string,
  limit = 10
): Promise<EnrichmentReport[]> {
  const authors = await findAuthorsByAffiliation(affiliation);
  const reports: EnrichmentReport[] = [];
  for (const a of authors.slice(0, limit)) {
    const university = await prisma.university.findFirst({
      where: { name: { contains: a.affiliation, mode: "insensitive" } },
    });
    if (!university) continue;

    const existing = await prisma.professor.findFirst({
      where: { name: a.name, universityId: university.id },
    });

    const prof = existing
      ?? (await prisma.professor.create({
        data: {
          name: a.name,
          universityId: university.id,
          personalWebsite: a.homepage,
          googleScholarId: a.scholarId,
          googleScholarUrl: a.scholarId
            ? `https://scholar.google.com/citations?user=${a.scholarId}`
            : null,
          orcidId: a.orcidId,
        },
      }));

    const report = await enrichProfessor(prof.id);
    reports.push(report);
  }
  return reports;
}
