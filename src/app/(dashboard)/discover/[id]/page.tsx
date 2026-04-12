"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Mail,
  BookOpen,
  DollarSign,
  Users,
  ExternalLink,
  Star,
  GraduationCap,
  Copy,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// Demo data
const professorData = {
  id: "1",
  name: "Dr. Xiang Li",
  email: "xli@gmu.edu",
  title: "Assistant Professor",
  department: "Computer Science",
  university: { name: "George Mason University", shortName: "GMU", location: "Fairfax, VA", csRanking: 67 },
  personalWebsite: "https://cs.gmu.edu/~xli",
  googleScholarUrl: "https://scholar.google.com",
  labName: "ROARS Lab",
  labWebsite: "https://roarslab.com",
  researchAreas: ["Trustworthy AI", "Neural Network Verification", "Formal Methods", "AI Safety"],
  researchSummary: "Dr. Li's research focuses on developing formal verification techniques for neural networks, with applications in safety-critical systems. Her recent work combines abstract interpretation with constraint solving to provide provable guarantees about neural network behavior.",
  hIndex: 28,
  citations: 3200,
  recentPaperCount: 12,
  hasActiveFunding: true,
  lookingForStudents: true,
  currentPhDStudents: 4,
  graduatedPhDStudents: 2,
  internationalStudents: true,
  fundingScore: 88,
  responsivenessScore: 75,
  dataQuality: "HIGH",
  publications: [
    { id: "p1", title: "Scalable Verification of Neural Networks via Abstract Interpretation", authors: ["X. Li", "J. Wang"], venue: "NeurIPS 2025", year: 2025, citationCount: 45, summary: "Novel approach to verify properties of deep neural networks using GPU-accelerated abstract interpretation.", url: null },
    { id: "p2", title: "Certified Robustness via Randomized Smoothing with Optimal Transport", authors: ["X. Li", "M. Chen", "R. Singh"], venue: "ICML 2024", year: 2024, citationCount: 82, summary: "Tighter robustness certificates using optimal transport theory.", url: null },
    { id: "p3", title: "Trustworthy AI in Autonomous Systems: A Survey", authors: ["X. Li", "K. Patel"], venue: "ACM Computing Surveys", year: 2024, citationCount: 120, summary: "Comprehensive survey of trustworthy AI techniques for safety-critical autonomous systems.", url: null },
  ],
  fundingSources: [
    { id: "g1", title: "CAREER: Scalable Neural Network Verification", agency: "NSF", amount: 550000, startDate: "2024-01-01", endDate: "2028-12-31", status: "Active" },
    { id: "g2", title: "Trustworthy AI for Autonomous Systems", agency: "DARPA", amount: 1200000, startDate: "2023-06-01", endDate: "2026-05-31", status: "Active" },
  ],
};

export default function ProfessorDetailPage() {
  const params = useParams();
  const prof = professorData; // In production, fetch by params.id

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{prof.name}</h1>
          <p className="text-muted-foreground">
            {prof.title}, {prof.department}
          </p>
          <p className="text-muted-foreground">
            {prof.university.name} ({prof.university.shortName}) — {prof.university.location}
          </p>
          {prof.labName && (
            <p className="text-sm text-primary mt-1">{prof.labName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/outreach/compose/${params.id}`}>
            <Button>
              <Mail className="h-4 w-4 mr-2" /> Generate Email
            </Button>
          </Link>
          <Button variant="outline">
            <Star className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-600">{prof.fundingScore}</p>
            <p className="text-xs text-muted-foreground">Funding Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">{prof.hIndex}</p>
            <p className="text-xs text-muted-foreground">h-Index</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">{prof.citations?.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Citations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">{prof.responsivenessScore}</p>
            <p className="text-xs text-muted-foreground">Responsiveness</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {prof.hasActiveFunding && <Badge className="bg-green-100 text-green-700">Active Funding</Badge>}
        {prof.lookingForStudents && <Badge className="bg-blue-100 text-blue-700">Seeking Students</Badge>}
        {prof.internationalStudents && <Badge className="bg-purple-100 text-purple-700">Funds International Students</Badge>}
        <Badge variant="outline">CS Ranking: #{prof.university.csRanking}</Badge>
        <Badge variant="outline">Data Quality: {prof.dataQuality}</Badge>
      </div>

      {/* Research */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Research Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{prof.researchSummary}</p>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {prof.researchAreas.map((area) => (
              <Badge key={area} variant="secondary">{area}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader><CardTitle>Contact & Links</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {prof.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{prof.email}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(prof.email!)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
            {prof.personalWebsite && (
              <a href={prof.personalWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Globe className="h-4 w-4" /> Personal Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {prof.labWebsite && (
              <a href={prof.labWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Users className="h-4 w-4" /> Lab Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {prof.googleScholarUrl && (
              <a href={prof.googleScholarUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <GraduationCap className="h-4 w-4" /> Google Scholar <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Current PhD Students: {prof.currentPhDStudents} | Graduated: {prof.graduatedPhDStudents}</p>
          </div>
        </CardContent>
      </Card>

      {/* Publications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Recent Publications ({prof.recentPaperCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prof.publications.map((pub) => (
            <div key={pub.id}>
              <h4 className="font-medium text-sm">{pub.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {pub.authors.join(", ")} — {pub.venue} ({pub.year})
              </p>
              {pub.summary && (
                <p className="text-sm text-muted-foreground mt-1">{pub.summary}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Citations: {pub.citationCount}
              </p>
              <Separator className="mt-3" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Funding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Active Grants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prof.fundingSources.map((grant) => (
            <div key={grant.id} className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm">{grant.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {grant.agency} — {grant.startDate?.slice(0, 4)} to {grant.endDate?.slice(0, 4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">${(grant.amount! / 1000).toFixed(0)}K</p>
                  <Badge className="bg-green-100 text-green-700 text-xs">{grant.status}</Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
