"use client";

import { useState, useCallback } from "react";
import type { GeneratedEmail } from "@/types";

export function useOutreach() {
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateEmail = useCallback(
    async (
      professorId: string,
      userId?: string,
      emailType: string = "COLD_OUTREACH"
    ) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/outreach/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ professorId, userId, emailType }),
        });

        if (!res.ok) throw new Error("Failed to generate email");

        const data = await res.json();
        setGeneratedEmail(data.data);
        return data.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const saveEmail = useCallback(
    async (email: {
      professorId: string;
      subject: string;
      body: string;
      type: string;
    }) => {
      try {
        const res = await fetch("/api/outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(email),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    []
  );

  return { generatedEmail, loading, error, generateEmail, saveEmail };
}
