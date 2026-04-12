"use client";

import { useState } from "react";
import { SearchBar } from "@/components/discover/SearchBar";
import { FilterPanel } from "@/components/discover/FilterPanel";
import { ProfessorCard } from "@/components/discover/ProfessorCard";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

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

  const handleSearch = async (query: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ query, ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
      )});
      const res = await fetch(`/api/search/professors?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data?.length) setProfessors(data.data);
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

      <SearchBar onSearch={handleSearch} loading={loading} />
      <FilterPanel filters={filters} onFiltersChange={setFilters} />

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
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No professors found</h3>
            <p className="text-muted-foreground mt-1">
              Try adjusting your search terms or filters.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
