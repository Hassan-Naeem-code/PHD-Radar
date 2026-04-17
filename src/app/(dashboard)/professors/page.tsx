"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import {
  Search, Mail, Star, ExternalLink, Filter, Loader2, Trash2, Users,
} from "lucide-react";

const OUTREACH_STATUS_LABELS: Record<string, string> = {
  NOT_CONTACTED: "Not Contacted",
  EMAIL_DRAFTED: "Email Drafted",
  EMAIL_SENT: "Email Sent",
  FOLLOW_UP_SENT: "Follow-up Sent",
  RESPONDED_POSITIVE: "Positive Response",
  RESPONDED_NEUTRAL: "Neutral Response",
  RESPONDED_NEGATIVE: "Negative Response",
  MEETING_SCHEDULED: "Meeting Scheduled",
  MEETING_COMPLETED: "Meeting Completed",
  RELATIONSHIP_ACTIVE: "Active Relationship",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  TOP: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  NOT_CONTACTED: "bg-gray-100 text-gray-700",
  EMAIL_DRAFTED: "bg-yellow-100 text-yellow-700",
  EMAIL_SENT: "bg-blue-100 text-blue-700",
  FOLLOW_UP_SENT: "bg-indigo-100 text-indigo-700",
  RESPONDED_POSITIVE: "bg-green-100 text-green-700",
  RESPONDED_NEUTRAL: "bg-gray-100 text-gray-700",
  RESPONDED_NEGATIVE: "bg-red-100 text-red-700",
  MEETING_SCHEDULED: "bg-purple-100 text-purple-700",
  MEETING_COMPLETED: "bg-emerald-100 text-emerald-700",
  RELATIONSHIP_ACTIVE: "bg-green-100 text-green-800",
};

interface SavedProfessor {
  id: string;
  professorId: string;
  status: string;
  priority: string;
  notes: string | null;
  researchFitScore: number | null;
  professor: {
    id: string;
    name: string;
    department: string | null;
    university: { name: string; shortName: string | null };
  };
}

export default function ProfessorsPage() {
  const [items, setItems] = useState<SavedProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  async function load() {
    try {
      const res = await fetch("/api/saved-professors");
      const json = await res.json();
      if (json.success) setItems(json.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function unsave(professorId: string) {
    if (!confirm("Remove from saved list?")) return;
    setItems((prev) => prev.filter((i) => i.professorId !== professorId));
    await fetch(`/api/saved-professors/${professorId}`, { method: "DELETE" });
  }

  const filtered = useMemo(() => items.filter((p) => {
    if (searchQuery && !p.professor.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (priorityFilter !== "all" && p.priority !== priorityFilter) return false;
    return true;
  }), [items, searchQuery, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Saved Professors</h1>
          <p className="text-muted-foreground">
            Track and manage your professor outreach pipeline.
          </p>
        </div>
        <Link href="/discover">
          <Button>
            <Search className="h-4 w-4 mr-2" /> Find More
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search professors..."
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter((v as string) ?? "all")}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(OUTREACH_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter((v as string) ?? "all")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="TOP">Top</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {["NOT_CONTACTED", "EMAIL_SENT", "RESPONDED_POSITIVE", "MEETING_SCHEDULED", "RELATIONSHIP_ACTIVE"].map((status) => {
            const count = items.filter((p) => p.status === status).length;
            return (
              <Card
                key={status}
                className="cursor-pointer hover:shadow-sm"
                onClick={() => setStatusFilter(status)}
              >
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{OUTREACH_STATUS_LABELS[status]}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No saved professors"
          description="You haven't saved any professors yet."
          action={{ label: "Discover Professors", href: "/discover" }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/professors/${s.professor.id}`}
                        className="font-semibold hover:underline truncate"
                      >
                        {s.professor.name}
                      </Link>
                      <Badge className={PRIORITY_COLORS[s.priority]}>{s.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {s.professor.university.shortName ?? s.professor.university.name}
                      {s.professor.department && ` — ${s.professor.department}`}
                    </p>
                    {s.notes && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">{s.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {s.researchFitScore !== null && (
                        <div className="flex items-center gap-1 justify-end">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold">{Math.round(s.researchFitScore)}</span>
                        </div>
                      )}
                      <Badge className={`text-xs ${STATUS_COLORS[s.status]}`}>
                        {OUTREACH_STATUS_LABELS[s.status]}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/outreach/compose/${s.professor.id}`}>
                        <Button variant="ghost" size="icon">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/professors/${s.professor.id}`}>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unsave(s.professor.id)}
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <EmptyState
              icon={Filter}
              title="No matches"
              description="No professors match your filters."
            />
          )}
        </div>
      )}
    </div>
  );
}
