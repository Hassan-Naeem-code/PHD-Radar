"use client";

import { useState, useCallback } from "react";
import type { ProfessorResult, SearchFilters } from "@/types";

export function useSearch() {
  const [results, setResults] = useState<ProfessorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const search = useCallback(
    async (query: string, filters: SearchFilters = {}, page = 1) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ query, page: String(page) });

        if (filters.fundingRequired !== undefined)
          params.set("fundingRequired", String(filters.fundingRequired));
        if (filters.country) params.set("country", filters.country);
        if (filters.rankingMax)
          params.set("rankingMax", String(filters.rankingMax));
        if (filters.lookingForStudents !== undefined)
          params.set("lookingForStudents", String(filters.lookingForStudents));

        const res = await fetch(`/api/search/professors?${params}`);

        if (!res.ok) throw new Error("Search failed");

        const data = await res.json();
        setResults(data.data || []);
        setTotal(data.pagination?.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { results, loading, error, total, search };
}
