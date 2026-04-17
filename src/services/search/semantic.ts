import { prisma } from "@/lib/prisma";
import { embedText, embedBatch, isEmbeddingsConfigured } from "@/lib/embeddings";
import {
  upsertVectors,
  queryVectors,
  deleteVectors,
  isPineconeConfigured,
  type PineconeVector,
} from "@/lib/pinecone";

const PROF_NS = "professors";
const PUB_NS = "publications";

function truncateArray<T>(items: T[], n: number): T[] {
  return items.length <= n ? items : items.slice(0, n);
}

export function isSemanticConfigured(): boolean {
  return isEmbeddingsConfigured() && isPineconeConfigured();
}

export async function indexProfessor(professorId: string): Promise<void> {
  if (!isSemanticConfigured()) return;
  const prof = await prisma.professor.findUnique({
    where: { id: professorId },
    include: { university: { select: { name: true } } },
  });
  if (!prof) return;
  const text = [
    prof.name,
    prof.department,
    prof.university?.name,
    prof.researchAreas.join(", "),
    prof.researchSummary,
  ]
    .filter(Boolean)
    .join(" | ");
  if (!text.trim()) return;
  const vec = await embedText(text);
  const vector: PineconeVector = {
    id: prof.id,
    values: vec,
    metadata: {
      name: prof.name,
      universityName: prof.university?.name ?? "",
      researchAreas: truncateArray(prof.researchAreas, 20),
      hasActiveFunding: prof.hasActiveFunding,
      lookingForStudents: prof.lookingForStudents,
    },
  };
  await upsertVectors(PROF_NS, [vector]);
}

export async function indexPublications(professorId: string): Promise<number> {
  if (!isSemanticConfigured()) return 0;
  const pubs = await prisma.publication.findMany({
    where: { professorId },
    take: 50,
    orderBy: { year: "desc" },
  });
  if (pubs.length === 0) return 0;

  const texts = pubs.map((p) =>
    [p.title, p.abstract, p.venue, p.summary].filter(Boolean).join(" | ")
  );
  const vectors = await embedBatch(texts);

  const toUpsert: PineconeVector[] = pubs.map((p, i) => ({
    id: p.id,
    values: vectors[i],
    metadata: {
      professorId,
      title: p.title,
      venue: p.venue ?? "",
      year: p.year,
    },
  }));

  await upsertVectors(PUB_NS, toUpsert);
  return toUpsert.length;
}

export async function removeProfessorFromIndex(professorId: string): Promise<void> {
  if (!isSemanticConfigured()) return;
  await deleteVectors(PROF_NS, [professorId]);
}

export interface SemanticProfessorHit {
  id: string;
  score: number;
  name: string;
  universityName: string;
  researchAreas: string[];
  hasActiveFunding: boolean;
}

export async function semanticSearchProfessors(
  query: string,
  topK = 20
): Promise<SemanticProfessorHit[]> {
  if (!isSemanticConfigured()) return [];
  const vec = await embedText(query);
  const matches = await queryVectors(PROF_NS, vec, topK);
  return matches
    .filter((m) => m.metadata)
    .map((m) => {
      const md = m.metadata as Record<string, unknown>;
      const areas = Array.isArray(md.researchAreas)
        ? (md.researchAreas as unknown[]).filter(
            (v): v is string => typeof v === "string"
          )
        : [];
      return {
        id: m.id,
        score: m.score,
        name: typeof md.name === "string" ? md.name : "",
        universityName: typeof md.universityName === "string" ? md.universityName : "",
        researchAreas: areas,
        hasActiveFunding: md.hasActiveFunding === true,
      };
    });
}

export interface SemanticPublicationHit {
  id: string;
  score: number;
  professorId: string;
  title: string;
  venue: string;
  year: number | null;
}

export async function semanticSearchPublications(
  query: string,
  topK = 20
): Promise<SemanticPublicationHit[]> {
  if (!isSemanticConfigured()) return [];
  const vec = await embedText(query);
  const matches = await queryVectors(PUB_NS, vec, topK);
  return matches
    .filter((m) => m.metadata)
    .map((m) => {
      const md = m.metadata as Record<string, unknown>;
      return {
        id: m.id,
        score: m.score,
        professorId:
          typeof md.professorId === "string" ? md.professorId : "",
        title: typeof md.title === "string" ? md.title : "",
        venue: typeof md.venue === "string" ? md.venue : "",
        year: typeof md.year === "number" ? md.year : null,
      };
    });
}

export async function reindexAllProfessors(): Promise<{ indexed: number }> {
  if (!isSemanticConfigured()) return { indexed: 0 };
  const profs = await prisma.professor.findMany({
    select: {
      id: true,
      name: true,
      department: true,
      researchAreas: true,
      researchSummary: true,
      hasActiveFunding: true,
      lookingForStudents: true,
      university: { select: { name: true } },
    },
  });

  if (profs.length === 0) return { indexed: 0 };

  const batchSize = 20;
  let indexed = 0;
  for (let i = 0; i < profs.length; i += batchSize) {
    const batch = profs.slice(i, i + batchSize);
    const texts = batch.map((p) =>
      [
        p.name,
        p.department,
        p.university?.name,
        p.researchAreas.join(", "),
        p.researchSummary,
      ]
        .filter(Boolean)
        .join(" | ")
    );
    const vectors = await embedBatch(texts);
    const toUpsert: PineconeVector[] = batch.map((p, j) => ({
      id: p.id,
      values: vectors[j],
      metadata: {
        name: p.name,
        universityName: p.university?.name ?? "",
        researchAreas: truncateArray(p.researchAreas, 20),
        hasActiveFunding: p.hasActiveFunding,
        lookingForStudents: p.lookingForStudents,
      },
    }));
    await upsertVectors(PROF_NS, toUpsert);
    indexed += toUpsert.length;
  }

  return { indexed };
}
