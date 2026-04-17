"use client";

import { useState } from "react";
import { SearchBar } from "@/components/discover/SearchBar";
import { FilterPanel } from "@/components/discover/FilterPanel";
import { ProfessorCard } from "@/components/discover/ProfessorCard";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles } from "lucide-react";

interface Filters {
  fundingRequired?: boolean;
  country?: string;
  rankingMax?: number;
  lookingForStudents?: boolean;
}

// Demo data for initial render
const demoProfessors = [
  {
    id: "1",
    name: "Dr. Xiang Li",
    title: "Assistant Professor",
    department: "Computer Science",
    universityName: "George Mason University",
    researchAreas: ["Trustworthy AI", "Neural Network Verification", "Formal Methods"],
    hIndex: 28,
    hasActiveFunding: true,
    lookingForStudents: true,
    overallMatchScore: 94,
    fundingScore: 88,
  },
  {
    id: "2",
    name: "Dr. Sarah Chen",
    title: "Associate Professor",
    department: "Computer Science",
    universityName: "UT Arlington",
    researchAreas: ["Adversarial Robustness", "Deep Learning", "Computer Vision"],
    hIndex: 42,
    hasActiveFunding: false,
    lookingForStudents: true,
    overallMatchScore: 87,
    fundingScore: 45,
  },
  {
    id: "3",
    name: "Dr. Wei Zhang",
    title: "Assistant Professor",
    department: "Electrical & Computer Engineering",
    universityName: "Texas Tech University",
    researchAreas: ["AI Safety", "Reinforcement Learning", "Robotics"],
    hIndex: 19,
    hasActiveFunding: true,
    lookingForStudents: false,
    overallMatchScore: 82,
    fundingScore: 76,
  },
  {
    id: "4",
    name: "Dr. Maria Rodriguez",
    title: "Professor",
    department: "Computer Science",
    universityName: "University of Michigan",
    researchAreas: ["Machine Learning", "Trustworthy AI", "Fairness"],
    hIndex: 65,
    hasActiveFunding: true,
    lookingForStudents: true,
    overallMatchScore: 79,
    fundingScore: 92,
  },
];

export default function DiscoverPage() {
  const [professors, setProfessors] = useState(demoProfessors);
  const [filters, setFilters] = useState<Filters>({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [semanticMode, setSemanticMode] = useState(false);
  const [semanticError, setSemanticError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearched(true);
    setSemanticError(null);
    try {
      if (semanticMode) {
        const res = await fetch("/api/search/semantic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, topK: 20 }),
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = (data.results ?? []).map((r: Record<string, unknown>) => ({
            ...r,
            overallMatchScore: Math.round(((r.semanticScore as number) ?? 0) * 100),
          }));
          setProfessors(mapped);
        } else {
          const err = await res.json().catch(() => null);
          setSemanticError(err?.error?.message ?? "Semantic search unavailable");
          setProfessors([]);
        }
      } else {
        const params = new URLSearchParams({ query, ...Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
        )});
        const res = await fetch(`/api/search/professors?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data?.length) setProfessors(data.data);
          else setProfessors([]);
        }
      }
    } catch {
      // Keep demo data on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discover Professors</h1>
        <p className="text-muted-foreground">
          Search for professors by research area, funding, and more.
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex-1">
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>
        <button
          type="button"
          onClick={() => setSemanticMode(!semanticMode)}
          className="flex items-center gap-2 shrink-0"
        >
          <div
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              semanticMode ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                semanticMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </div>
          <span className="text-sm font-medium flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            AI Search
          </span>
          {semanticMode && (
            <Badge variant="secondary" className="text-xs">Vector</Badge>
          )}
        </button>
      </div>

      {!semanticMode && <FilterPanel filters={filters} onFiltersChange={setFilters} />}

      {semanticError && (
        <Card>
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            {semanticError}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-20" />
                    <div className="h-6 bg-muted rounded w-24" />
                  </div>
                  <div className="h-8 bg-muted rounded w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : professors.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {professors.map((prof) => (
            <ProfessorCard key={prof.id} {...prof} />
          ))}
        </div>
      ) : searched ? (
        <EmptyState
          icon={Search}
          title="No professors found"
          description="Try adjusting your search terms or filters."
        />
      ) : null}
    </div>
  );
}
