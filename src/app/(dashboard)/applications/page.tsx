"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Calendar, CheckCircle, Circle, Loader2, Trash2,
} from "lucide-react";

const STATUS_COLUMNS = [
  { key: "RESEARCHING", label: "Researching", color: "bg-gray-100" },
  { key: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-100" },
  { key: "SUBMITTED", label: "Submitted", color: "bg-blue-100" },
  { key: "UNDER_REVIEW", label: "Under Review", color: "bg-purple-100" },
  { key: "DECIDED", label: "Decision", color: "bg-green-100" },
] as const;

const DECIDED_STATUSES = [
  "ADMITTED_FUNDED", "ADMITTED_UNFUNDED", "WAITLISTED",
  "REJECTED", "ACCEPTED_OFFER", "WITHDRAWN",
] as const;

const ALL_STATUSES = [
  "RESEARCHING", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW",
  "ADMITTED_FUNDED", "ADMITTED_UNFUNDED", "WAITLISTED",
  "REJECTED", "WITHDRAWN", "ACCEPTED_OFFER",
] as const;

interface Application {
  id: string;
  universityName: string;
  program: string;
  term: string;
  status: string;
  deadline: string | null;
  sopUploaded: boolean;
  cvUploaded: boolean;
  transcriptsUploaded: boolean;
  recsRequested: number;
  recsReceived: number;
  toeflSent: boolean;
}

function getCompletionPercent(app: Application) {
  const items = [
    app.sopUploaded, app.cvUploaded, app.transcriptsUploaded,
    app.toeflSent, app.recsReceived >= 3,
  ];
  return Math.round((items.filter(Boolean).length / items.length) * 100);
}

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ universityName: "", program: "", term: "Fall 2027", deadline: "" });

  async function load() {
    try {
      const res = await fetch("/api/applications");
      const json = await res.json();
      if (json.success) setApps(json.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createApp() {
    if (!form.universityName || !form.program) return;
    setCreating(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityName: form.universityName,
          program: form.program,
          term: form.term,
          deadline: form.deadline || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setApps((prev) => [...prev, json.data]);
        setForm({ universityName: "", program: "", term: "Fall 2027", deadline: "" });
        setDialogOpen(false);
      } else {
        alert(json.error?.message ?? "Failed to create");
      }
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function deleteApp(id: string) {
    if (!confirm("Delete this application?")) return;
    setApps((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Application Tracker</h1>
          <p className="text-muted-foreground">Track your PhD applications and deadlines.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" /> Add Application
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>University</Label>
                <Input
                  placeholder="e.g., Stanford University"
                  value={form.universityName}
                  onChange={(e) => setForm({ ...form, universityName: e.target.value })}
                />
              </div>
              <div>
                <Label>Program</Label>
                <Input
                  placeholder="e.g., PhD Computer Science"
                  value={form.program}
                  onChange={(e) => setForm({ ...form, program: e.target.value })}
                />
              </div>
              <div>
                <Label>Target Term</Label>
                <Input
                  placeholder="e.g., Fall 2027"
                  value={form.term}
                  onChange={(e) => setForm({ ...form, term: e.target.value })}
                />
              </div>
              <div>
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={createApp} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : apps.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <p className="text-muted-foreground">No applications yet.</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add your first application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
          {STATUS_COLUMNS.map((col) => {
            const colApps = apps.filter((a) =>
              col.key === "DECIDED"
                ? (DECIDED_STATUSES as readonly string[]).includes(a.status)
                : a.status === col.key
            );
            return (
              <div key={col.key}>
                <div className={`${col.color} rounded-t-lg p-3 text-center`}>
                  <h3 className="font-medium text-sm">{col.label}</h3>
                  <Badge variant="secondary" className="mt-1">{colApps.length}</Badge>
                </div>
                <div className="space-y-3 mt-3">
                  {colApps.map((app) => {
                    const days = daysUntil(app.deadline);
                    const completion = getCompletionPercent(app);
                    return (
                      <Card key={app.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-4 pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm truncate">{app.universityName}</h4>
                              <p className="text-xs text-muted-foreground truncate">{app.program}</p>
                              <p className="text-xs text-muted-foreground">{app.term}</p>
                            </div>
                            <button
                              onClick={() => deleteApp(app.id)}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {app.deadline && (
                            <div className="flex items-center gap-1 mt-2 text-xs">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(app.deadline).toLocaleDateString()}</span>
                              {days !== null && (
                                <Badge
                                  variant={days <= 7 ? "destructive" : "secondary"}
                                  className="text-xs ml-1"
                                >
                                  {days > 0 ? `${days}d` : "Past"}
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>Checklist</span>
                              <span>{completion}%</span>
                            </div>
                            <Progress value={completion} className="h-1.5" />
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            <CheckItem done={app.sopUploaded} label="SOP" />
                            <CheckItem done={app.cvUploaded} label="CV" />
                            <CheckItem done={app.transcriptsUploaded} label="Trans" />
                            <CheckItem done={app.toeflSent} label="TOEFL" />
                            <CheckItem done={app.recsReceived >= 3} label={`Recs ${app.recsReceived}/3`} />
                          </div>

                          <div className="mt-3">
                            <Select
                              value={app.status}
                              onValueChange={(v) => v && updateStatus(app.id, v as string)}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs">
                                    {s.replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${done ? "text-green-600" : "text-muted-foreground"}`}>
      {done ? <CheckCircle className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
      {label}
    </span>
  );
}
