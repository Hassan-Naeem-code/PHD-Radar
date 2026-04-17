"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, Database, Activity, Search, RefreshCw,
  CheckCircle, Clock, XCircle, Shield, Loader2, Upload,
} from "lucide-react";

interface AdminStats {
  totals: { users: number; professors: number; savedProfessors: number; paidUsers: number };
  changes: { newUsers7d: number; newProfessors7d: number; searchesToday: number; searchesChangePct: number };
  quality: { HIGH: number; MEDIUM: number; LOW: number };
  plans: Record<string, number>;
  funnel: { activationRate: number; avgProfessorsSaved: number; conversionRate: number };
  health: { activeSessions: number };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  createdAt: string;
  searches: number;
  savedProfessors: number;
  applications: number;
}

interface ScrapingJob {
  id: string;
  source: string;
  status: string;
  resultCount: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

const statusIcon: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
  RUNNING: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
  FAILED: <XCircle className="h-4 w-4 text-red-500" />,
  PENDING: <Clock className="h-4 w-4 text-yellow-500" />,
};

function duration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "—";
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const s = Math.round((end - new Date(startedAt).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadAll = useCallback(async (query = "") => {
    setLoading(true);
    setErr(null);
    try {
      const [statsRes, usersRes, jobsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(`/api/admin/users?pageSize=25${query ? `&query=${encodeURIComponent(query)}` : ""}`),
        fetch("/api/scraping/status"),
      ]);
      const [statsJson, usersJson, jobsJson] = await Promise.all([
        statsRes.json(), usersRes.json(), jobsRes.json(),
      ]);
      if (!statsJson.success) setErr(statsJson.error?.message ?? "Access denied");
      if (statsJson.success) setStats(statsJson.data);
      if (usersJson.success) setUsers(usersJson.data);
      if (jobsJson.success) setJobs(jobsJson.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function triggerScrape(source: string, affiliation?: string) {
    setTriggering(true);
    try {
      const res = await fetch("/api/scraping/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, ...(affiliation ? { affiliation } : {}) }),
      });
      const json = await res.json();
      if (!json.success) alert(json.error?.message ?? "Trigger failed");
      await loadAll(userQuery);
    } finally {
      setTriggering(false);
    }
  }

  if (err) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">{err}</p>
          <p className="text-sm text-muted-foreground">Admin access required.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totals.users, icon: Users, change: `+${stats.changes.newUsers7d} this week` },
    { label: "Professors", value: stats.totals.professors, icon: Database, change: `+${stats.changes.newProfessors7d} this week` },
    { label: "Searches Today", value: stats.changes.searchesToday, icon: Search, change: `${stats.changes.searchesChangePct >= 0 ? "+" : ""}${stats.changes.searchesChangePct}% vs yesterday` },
    { label: "Active Sessions", value: stats.health.activeSessions, icon: Activity, change: "Live" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" /> Admin Panel
          </h1>
          <p className="text-muted-foreground">System overview and management.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{s.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xs text-green-600 mt-1">{s.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="scraping">Scraping Jobs</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-4">
          <form
            className="flex gap-3"
            onSubmit={(e) => { e.preventDefault(); loadAll(userQuery); }}
          >
            <Input
              placeholder="Search users..."
              className="max-w-sm"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
            />
            <Button type="submit" variant="outline">Search</Button>
          </form>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead>Searches</TableHead>
                  <TableHead>Saved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-xs">{user.email}</TableCell>
                    <TableCell>
                      <select
                        className="border rounded px-2 py-1 text-xs bg-background"
                        value={user.role}
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          const confirmed = window.confirm(
                            `Change ${user.email} to ${newRole}?`
                          );
                          if (!confirmed) return;
                          const res = await fetch(`/api/admin/users/${user.id}/role`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ role: newRole }),
                          });
                          const json = await res.json();
                          if (json.success) {
                            await loadAll(userQuery);
                          } else {
                            alert(json.error?.message ?? "Role change failed");
                          }
                        }}
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.plan === "FREE" ? "outline" : "default"}>{user.plan}</Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{user.searches}</TableCell>
                    <TableCell>{user.savedProfessors}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="scraping" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => triggerScrape("semantic_scholar")} disabled={triggering}>
              {triggering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Semantic Scholar
            </Button>
            <Button variant="outline" onClick={() => triggerScrape("nsf_awards")} disabled={triggering}>
              NSF Awards
            </Button>
            <Button variant="outline" onClick={() => triggerScrape("nih_reporter")} disabled={triggering}>
              NIH Reporter
            </Button>
            <Button variant="outline" onClick={() => triggerScrape("cs_rankings")} disabled={triggering}>
              CSRankings
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const affiliation = prompt("Affiliation (e.g. 'Massachusetts Institute of Technology')");
                if (affiliation) triggerScrape("enrich_by_affiliation", affiliation);
              }}
              disabled={triggering}
            >
              Enrich by Affiliation
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!confirm("Rebuild semantic index for all professors?")) return;
                const res = await fetch("/api/admin/reindex", { method: "POST" });
                const json = await res.json();
                if (json.success) {
                  alert(`Indexed ${json.data.indexed} professors.`);
                } else {
                  alert(json.error?.message ?? "Reindex failed");
                }
              }}
              disabled={triggering}
            >
              Rebuild Semantic Index
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Each enrichment pulls from <strong>11 free sources</strong>: OpenAlex, ArXiv,
            CrossRef, CSRankings, DBLP, ORCID, GitHub, Medium, faculty pages,
            <strong> NSF Awards, and NIH Reporter</strong> (both looked up by PI last name,
            writes Active grants into the funding table). Two optional paid sources
            (Google Scholar via SerpApi, LinkedIn via ProxyCurl) skip silently without
            keys — OpenAlex covers most of Scholar&apos;s signal for free.
          </p>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.source}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {statusIcon[job.status]}
                        <span>{job.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{job.resultCount}</TableCell>
                    <TableCell className="text-xs">
                      {job.startedAt ? new Date(job.startedAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>{duration(job.startedAt, job.completedAt)}</TableCell>
                    <TableCell className="text-xs text-destructive max-w-xs truncate">
                      {job.errorMessage ?? ""}
                    </TableCell>
                  </TableRow>
                ))}
                {jobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No scraping jobs yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Bulk Import Professors</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  CSV columns (name + university required; rest optional):
                  <br />
                  <code className="text-[10px]">
                    name, university, universityShortName, email, title, department,
                    researchAreas (;-sep), researchSummary, personalWebsite, googleScholarUrl,
                    githubUrl, linkedinUrl, labName, labWebsite, hIndex, citations,
                    hasActiveFunding, lookingForStudents, country
                  </code>
                </p>
                <CsvImport />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Data Quality</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>HIGH quality</span>
                  <Badge className="bg-green-100 text-green-700">{stats.quality.HIGH}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>MEDIUM quality</span>
                  <Badge className="bg-yellow-100 text-yellow-700">{stats.quality.MEDIUM}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>LOW quality</span>
                  <Badge className="bg-red-100 text-red-700">{stats.quality.LOW}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Plan Distribution</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats.plans).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between text-sm">
                    <span>{plan}</span>
                    <Badge variant={plan === "FREE" ? "outline" : "default"}>{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{stats.funnel.activationRate}%</p>
                <p className="text-sm text-muted-foreground">Activation Rate</p>
                <p className="text-xs text-muted-foreground">Signups who saved a professor</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{stats.funnel.avgProfessorsSaved}</p>
                <p className="text-sm text-muted-foreground">Avg Professors Saved</p>
                <p className="text-xs text-muted-foreground">Per active user</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{stats.funnel.conversionRate}%</p>
                <p className="text-sm text-muted-foreground">Free &rarr; Paid</p>
                <p className="text-xs text-muted-foreground">{stats.totals.paidUsers} paid users</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CsvImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; reason: string }>;
  } | null>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/import/professors", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        if (fileRef.current) fileRef.current.value = "";
      } else {
        alert(json.error?.message ?? "Import failed");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Input ref={fileRef} type="file" accept=".csv" />
      <Button
        className="w-full"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading
          ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          : <Upload className="h-4 w-4 mr-2" />}
        Import CSV
      </Button>
      {result && (
        <div className="text-xs border rounded-md p-2 bg-muted/30 space-y-1">
          <div>
            <strong>{result.total}</strong> rows · created {result.created} · updated{" "}
            {result.updated} · skipped {result.skipped}
          </div>
          {result.errors.length > 0 && (
            <details>
              <summary className="cursor-pointer">
                {result.errors.length} error{result.errors.length > 1 ? "s" : ""}
              </summary>
              <ul className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                {result.errors.slice(0, 20).map((e, i) => (
                  <li key={i} className="text-destructive">
                    row {e.row}: {e.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
