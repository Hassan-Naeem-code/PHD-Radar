"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, ChevronDown, ChevronUp, Loader2, ExternalLink, Search,
} from "lucide-react";

interface Paper {
  id: string;
  title: string;
  authors: string[];
  venue: string | null;
  year: number;
  citationCount: number;
  summary: string | null;
  keyFindings: string[];
  futureWork: string[];
  url: string | null;
  professor: {
    id: string;
    name: string;
    university: { shortName: string | null; name: string };
  };
}

export default function PapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/papers");
      const json = await res.json();
      if (json.success) setPapers(json.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function summarize(id: string) {
    setSummarizingId(id);
    try {
      const res = await fetch(`/api/papers/${id}/summarize`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setPapers((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  summary: json.data.summary,
                  keyFindings: json.data.keyFindings,
                  futureWork: json.data.futureWork,
                }
              : p
          )
        );
        setExpanded(id);
      } else {
        alert(json.error?.message ?? "Summarize failed");
      }
    } finally {
      setSummarizingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paper Analysis</h1>
        <p className="text-muted-foreground">
          Papers from your saved professors. Click AI Summarize to generate talking points.
        </p>
      </div>

      {papers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <p className="text-muted-foreground">
              No papers yet — save some professors to see their publications here.
            </p>
            <Link href="/discover">
              <Button><Search className="h-4 w-4 mr-2" /> Discover Professors</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {papers.map((paper) => (
            <Card key={paper.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">
                      {paper.url ? (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {paper.title}
                          <ExternalLink className="inline h-3 w-3 ml-1" />
                        </a>
                      ) : paper.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {paper.authors.join(", ")}
                      {paper.venue ? ` — ${paper.venue}` : ""} ({paper.year})
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Link
                        href={`/professors/${paper.professor.id}`}
                        className="hover:underline"
                      >
                        <Badge variant="secondary">
                          {paper.professor.name}
                          {paper.professor.university.shortName
                            ? ` (${paper.professor.university.shortName})`
                            : ""}
                        </Badge>
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {paper.citationCount} citations
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!paper.summary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => summarize(paper.id)}
                        disabled={summarizingId === paper.id}
                      >
                        {summarizingId === paper.id
                          ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          : <Sparkles className="h-4 w-4 mr-1" />}
                        AI Summarize
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpanded(expanded === paper.id ? null : paper.id)}
                      disabled={!paper.summary}
                    >
                      {expanded === paper.id
                        ? <ChevronUp className="h-5 w-5" />
                        : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                {expanded === paper.id && paper.summary && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    <div>
                      <h4 className="flex items-center gap-2 font-medium text-sm mb-2">
                        <Sparkles className="h-4 w-4 text-primary" /> AI Summary
                      </h4>
                      <p className="text-sm text-muted-foreground">{paper.summary}</p>
                    </div>
                    {paper.keyFindings.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Key Findings</h4>
                        <ul className="space-y-1">
                          {paper.keyFindings.map((f, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {paper.futureWork.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Future Work (conversation starters)</h4>
                        <ul className="space-y-1">
                          {paper.futureWork.map((f, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-yellow-500">→</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
