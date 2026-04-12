"use client";

import { useState, useCallback } from "react";
import type { ProfessorDetail, ResearchFitAnalysis } from "@/types";

export function useProfessor(id: string) {
  const [professor, setProfessor] = useState<ProfessorDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfessor = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/professors/${id}`);
      if (!res.ok) throw new Error("Failed to fetch professor");

      const data = await res.json();
      setProfessor(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const analyzeFit = useCallback(
    async (userId: string): Promise<ResearchFitAnalysis | null> => {
      try {
        const res = await fetch(`/api/professors/${id}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.data;
      } catch {
        return null;
      }
    },
    [id]
  );

  const saveProfessor = useCallback(
    async (userId: string, notes?: string, priority?: string) => {
      try {
        const res = await fetch("/api/professors/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ professorId: id, userId, notes, priority }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [id]
  );

  return { professor, loading, error, fetchProfessor, analyzeFit, saveProfessor };
}
