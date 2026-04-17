"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Globe, Mail, BookOpen, DollarSign, Users, ExternalLink, Star,
  GraduationCap, Copy, Sparkles, Loader2, Heart, HeartOff, Zap,
} from "lucide-react";
import Link from "next/link";

const STATUSES = [
  "NOT_CONTACTED", "EMAIL_DRAFTED", "EMAIL_SENT", "FOLLOW_UP_SENT",
  "RESPONDED_POSITIVE", "RESPONDED_NEUTRAL", "RESPONDED_NEGATIVE",
  "MEETING_SCHEDULED", "MEETING_COMPLETED", "RELATIONSHIP_ACTIVE",
] as const;

interface Professor {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  department: string | null;
  personalWebsite: string | null;
  googleScholarUrl: string | null;
  labName: string | null;
  labWebsite: string | null;
  researchAreas: string[];
  researchSummary: string | null;
  hIndex: number | null;
  citations: number | null;
  recentPaperCount: number | null;
  hasActiveFunding: boolean;
  lookingForStudents: boolean;
  currentPhDStudents: number | null;
  graduatedPhDStudents: number | null;
  internationalStudents: boolean | null;
  fundingScore: number | null;
  responsivenessScore: number | null;
  dataQuality: string;
  university: {
    name: string;
    shortName: string | null;
    location: string | null;
    csRanking: number | null;
  };
  publications: Array<{
    id: string;
    title: string;
    authors: string[];
    venue: string | null;
    year: number;
    citationCount: number;
    summary: string | null;
    url: string | null;
  }>;
  fundingSources: Array<{
    id: string;
    title: string;
    agency: string;
    amount: number | null;
    startDate: string | null;
    endDate: string | null;
    status: string | null;
  }>;
}

interface SavedInfo {
  id: string;
  status: string;
  priority: string;
  notes: string | null;
  researchFitScore: number | null;
}

export default function ProfessorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  const [prof, setProf] = useState<Professor | null>(null);
  const [saved, setSaved] = useState<SavedInfo | null>(null);
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichMsg, setEnrichMsg] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`/api/professors/${id}`),
        fetch(`/api/saved-professors/${id}`),
      ]);
      const [pJson, sJson] = await Promise.all([pRes.json(), sRes.json()]);
      if (pJson.success) setProf(pJson.data);
      if (sJson.success && sJson.data) {
        setSaved(sJson.data);
        setNotes(sJson.data.notes ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function toggleSave() {
    if (saved) {
      setSaved(null);
      await fetch(`/api/saved-professors/${id}`, { method: "DELETE" });
    } else {
      const res = await fetch("/api/saved-professors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professorId: id, priority: "MEDIUM" }),
      });
      const json = await res.json();
      if (json.success) setSaved(json.data);
    }
  }

  async function updateStatus(status: string) {
    setSaved((s) => s ? { ...s, status } : s);
    await fetch(`/api/saved-professors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function updatePriority(priority: string) {
    setSaved((s) => s ? { ...s, priority } : s);
    await fetch(`/api/saved-professors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
  }

  async function saveNotes() {
    await fetch(`/api/saved-professors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setNotesDirty(false);
    setSaved((s) => s ? { ...s, notes } : s);
  }

  async function analyzeFit() {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/professors/${id}/analyze`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        await loadAll();
      } else {
        alert(json.error?.message ?? "Analysis failed");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function enrich() {
    setEnriching(true);
    setEnrichMsg(null);
    try {
      const res = await fetch(`/api/professors/${id}/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setEnrichMsg(
          `Enriched: ${d.sourcesUsed.length} sources, +${d.publicationsAdded} papers` +
            (d.updated?.grantsAdded ? `, +${d.updated.grantsAdded} grants` : "")
        );
        await loadAll();
      } else {
        setEnrichMsg(json.error?.message ?? "Enrichment failed");
      }
    } finally {
      setEnriching(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!prof) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Professor not found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{prof.name}</h1>
          <p className="text-muted-foreground">
            {[prof.title, prof.department].filter(Boolean).join(", ")}
          </p>
          <p className="text-muted-foreground">
            {prof.university.name}
            {prof.university.shortName ? ` (${prof.university.shortName})` : ""}
            {prof.university.location ? ` — ${prof.university.location}` : ""}
          </p>
          {prof.labName && <p className="text-sm text-primary mt-1">{prof.labName}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/outreach/compose/${id}`}>
            <Button>
              <Mail className="h-4 w-4 mr-2" /> Generate Email
            </Button>
          </Link>
          <Button variant={saved ? "secondary" : "outline"} onClick={toggleSave}>
            {saved
              ? <><HeartOff className="h-4 w-4 mr-2" /> Unsave</>
              : <><Heart className="h-4 w-4 mr-2" /> Save</>}
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={enrich} disabled={enriching}>
              {enriching
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Zap className="h-4 w-4 mr-2" />}
              Enrich
            </Button>
          )}
        </div>
      </div>
      {enrichMsg && (
        <div className="text-sm text-muted-foreground border border-border rounded-md p-2 bg-muted/30">
          {enrichMsg}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-600">{prof.fundingScore ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Funding Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">{prof.hIndex ?? "—"}</p>
            <p className="text-xs text-muted-foreground">h-Index</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">
              {prof.citations !== null ? prof.citations.toLocaleString() : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Citations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">{prof.responsivenessScore ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Responsiveness</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {prof.hasActiveFunding && <Badge className="bg-green-100 text-green-700">Active Funding</Badge>}
        {prof.lookingForStudents && <Badge className="bg-blue-100 text-blue-700">Seeking Students</Badge>}
        {prof.internationalStudents && <Badge className="bg-purple-100 text-purple-700">Funds International Students</Badge>}
        {prof.university.csRanking && <Badge variant="outline">CS Ranking: #{prof.university.csRanking}</Badge>}
        <Badge variant="outline">Data Quality: {prof.dataQuality}</Badge>
      </div>

      {saved && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Select value={saved.status} onValueChange={(v) => v && updateStatus(v as string)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Priority</p>
                <Select value={saved.priority} onValueChange={(v) => v && updatePriority(v as string)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="TOP">Top</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Research Fit</p>
                <div className="flex items-center gap-2 h-10">
                  {saved.researchFitScore !== null ? (
                    <>
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-xl font-bold">{Math.round(saved.researchFitScore)}</span>
                      <span className="text-muted-foreground text-sm">/100</span>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={analyzeFit} disabled={analyzing}>
                      {analyzing && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                      <Sparkles className="h-3 w-3 mr-1" /> Analyze
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
                placeholder="Your notes about this professor..."
              />
              {notesDirty && (
                <Button size="sm" className="mt-2" onClick={saveNotes}>Save Notes</Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {prof.researchSummary && (
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
      )}

      <Card>
        <CardHeader><CardTitle>Contact & Links</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {prof.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{prof.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => navigator.clipboard.writeText(prof.email!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
            {prof.personalWebsite && (
              <a
                href={prof.personalWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Globe className="h-4 w-4" /> Personal Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {prof.labWebsite && (
              <a
                href={prof.labWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Users className="h-4 w-4" /> Lab Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {prof.googleScholarUrl && (
              <a
                href={prof.googleScholarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <GraduationCap className="h-4 w-4" /> Google Scholar <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {(prof.currentPhDStudents !== null || prof.graduatedPhDStudents !== null) && (
            <div className="mt-4 text-sm text-muted-foreground">
              Current PhD Students: {prof.currentPhDStudents ?? "—"} | Graduated: {prof.graduatedPhDStudents ?? "—"}
            </div>
          )}
        </CardContent>
      </Card>

      {prof.publications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Recent Publications ({prof.recentPaperCount ?? prof.publications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prof.publications.map((pub) => (
              <div key={pub.id}>
                <h4 className="font-medium text-sm">
                  {pub.url ? (
                    <a href={pub.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {pub.title} <ExternalLink className="inline h-3 w-3" />
                    </a>
                  ) : pub.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {pub.authors.join(", ")}
                  {pub.venue ? ` — ${pub.venue}` : ""} ({pub.year})
                </p>
                {pub.summary && (
                  <p className="text-sm text-muted-foreground mt-1">{pub.summary}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Citations: {pub.citationCount}</p>
                <Separator className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {prof.fundingSources.length > 0 && (
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
                      {grant.agency}
                      {grant.startDate && grant.endDate
                        ? ` — ${grant.startDate.slice(0, 4)} to ${grant.endDate.slice(0, 4)}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    {grant.amount && (
                      <p className="font-semibold text-sm">
                        ${(grant.amount / 1000).toFixed(0)}K
                      </p>
                    )}
                    {grant.status && (
                      <Badge className="bg-green-100 text-green-700 text-xs">{grant.status}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
