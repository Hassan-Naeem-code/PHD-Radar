"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/EmptyState";
import {
  BookOpen, Code, GitBranch, CheckCircle, Circle,
  Sparkles, Clock, Gauge, Loader2, AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Step {
  title: string;
  description: string;
}

interface GuideData {
  paper: {
    id: string;
    title: string;
    authors: string[];
    venue: string | null;
    year: number;
    url: string | null;
    summary: string | null;
  };
  professor: {
    id: string;
    name: string;
    university: { name: string; shortName: string | null };
  };
  guide: {
    complexity: string;
    estimatedTime: string;
    hasPublicCode: boolean;
    hasPublicDataset: boolean;
    whyThisPaper: string[];
    coreComponents: string[];
    keyDependencies: string[];
    evaluationTargets: string[];
    steps: Step[];
  };
}

const STORAGE_KEY = "phdradar-impl-steps";

function loadChecked(paperId: string): Record<number, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return all[paperId] ?? {};
  } catch { return {}; }
}

function saveChecked(paperId: string, checked: Record<number, boolean>) {
  if (typeof window === "undefined") return;
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    all[paperId] = checked;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export default function ImplementPaperPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (id) setChecked(loadChecked(id));
  }, [id]);

  async function generateGuide() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/papers/${id}/implementation-guide`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message ?? "Failed to generate guide");
      }
    } catch {
      setError("Failed to generate guide");
    } finally {
      setLoading(false);
    }
  }

  function toggleStep(index: number) {
    const next = { ...checked, [index]: !checked[index] };
    setChecked(next);
    saveChecked(id, next);
  }

  if (!data && !loading && !error) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Code className="h-4 w-4" /> Implement Their Paper
          </div>
          <h1 className="text-2xl font-bold">Implementation Guide</h1>
          <p className="text-muted-foreground mt-1">
            Generate an AI-powered step-by-step guide to implement this paper.
          </p>
        </div>
        <EmptyState
          icon={Sparkles}
          title="Ready to generate"
          description="Click below to generate an implementation guide for this paper using AI."
          action={{ label: "Generate Implementation Guide", onClick: generateGuide }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Analyzing paper and generating guide...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <EmptyState
          icon={AlertCircle}
          title="Generation failed"
          description={error}
          action={{ label: "Try Again", onClick: generateGuide }}
        />
      </div>
    );
  }

  if (!data) return null;

  const { paper, professor, guide } = data;
  const completedSteps = guide.steps.filter((_, i) => checked[i]).length;
  const progressPct = guide.steps.length > 0
    ? Math.round((completedSteps / guide.steps.length) * 100)
    : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Code className="h-4 w-4" /> Implement Their Paper
        </div>
        <h1 className="text-2xl font-bold">{paper.title}</h1>
        <p className="text-muted-foreground mt-1">
          {paper.authors.join(", ")} — {paper.venue ?? "Unknown"} ({paper.year})
        </p>
        <p className="text-sm text-primary mt-1">
          Professor:{" "}
          <Link href={`/professors/${professor.id}`} className="hover:underline">
            {professor.name}
          </Link>
          {" "}({professor.university.shortName ?? professor.university.name})
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">Why this paper?</h3>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                {guide.whyThisPaper.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="gap-1">
          <Gauge className="h-3 w-3" /> {guide.complexity} Complexity
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> {guide.estimatedTime}
        </Badge>
        {guide.hasPublicCode && (
          <Badge className="bg-green-100 text-green-700 gap-1">
            <GitBranch className="h-3 w-3" /> Public Code
          </Badge>
        )}
        {guide.hasPublicDataset && (
          <Badge className="bg-blue-100 text-blue-700 gap-1">
            <BookOpen className="h-3 w-3" /> Public Dataset
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Implementation Progress</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completedSteps}/{guide.steps.length} steps
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPct} className="mb-6" />
          <div className="space-y-4">
            {guide.steps.map((step, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleStep(i)}
                className="flex items-start gap-3 w-full text-left"
              >
                {checked[i] ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={`font-medium text-sm ${checked[i] ? "line-through text-muted-foreground" : ""}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> AI-Extracted Implementation Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium">Core Components</h4>
            <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
              {guide.coreComponents.map((c, i) => (
                <li key={i}>&bull; {c}</li>
              ))}
            </ul>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium">Key Dependencies</h4>
            <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
              {guide.keyDependencies.map((d, i) => (
                <li key={i}>&bull; {d}</li>
              ))}
            </ul>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium">Evaluation Targets</h4>
            <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
              {guide.evaluationTargets.map((t, i) => (
                <li key={i}>&bull; {t}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        {paper.url && (
          <a href={paper.url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" className="w-full">
              <BookOpen className="h-4 w-4 mr-2" /> Read Paper
            </Button>
          </a>
        )}
        <Link href={`/outreach/compose/${professor.id}`} className="flex-1">
          <Button className="w-full">
            <Sparkles className="h-4 w-4 mr-2" /> Share Results with Professor
          </Button>
        </Link>
      </div>
    </div>
  );
}
