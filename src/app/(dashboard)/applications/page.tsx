"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, CheckCircle, Circle, FileText } from "lucide-react";

const STATUS_COLUMNS = [
  { key: "RESEARCHING", label: "Researching", color: "bg-gray-100" },
  { key: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-100" },
  { key: "SUBMITTED", label: "Submitted", color: "bg-blue-100" },
  { key: "UNDER_REVIEW", label: "Under Review", color: "bg-purple-100" },
  { key: "DECIDED", label: "Decision", color: "bg-green-100" },
];

const applications = [
  {
    id: "a1", universityName: "George Mason University", program: "PhD Computer Science",
    term: "Fall 2027", status: "IN_PROGRESS", deadline: "2027-03-15",
    sopUploaded: true, cvUploaded: true, transcriptsUploaded: false,
    recsRequested: 3, recsReceived: 1, toeflSent: true,
  },
  {
    id: "a2", universityName: "UT Arlington", program: "PhD Computer Science",
    term: "Fall 2027", status: "RESEARCHING", deadline: null,
    sopUploaded: false, cvUploaded: true, transcriptsUploaded: false,
    recsRequested: 0, recsReceived: 0, toeflSent: false,
  },
  {
    id: "a3", universityName: "Texas Tech University", program: "PhD Computer Science",
    term: "Fall 2027", status: "IN_PROGRESS", deadline: "2027-04-01",
    sopUploaded: true, cvUploaded: true, transcriptsUploaded: true,
    recsRequested: 3, recsReceived: 3, toeflSent: true,
  },
  {
    id: "a4", universityName: "University of Michigan", program: "PhD Computer Science",
    term: "Fall 2027", status: "SUBMITTED", deadline: "2026-12-15",
    sopUploaded: true, cvUploaded: true, transcriptsUploaded: true,
    recsRequested: 3, recsReceived: 3, toeflSent: true,
  },
  {
    id: "a5", universityName: "Virginia Tech", program: "PhD Computer Science",
    term: "Fall 2027", status: "UNDER_REVIEW", deadline: "2027-01-15",
    sopUploaded: true, cvUploaded: true, transcriptsUploaded: true,
    recsRequested: 3, recsReceived: 3, toeflSent: true,
  },
];

function getCompletionPercent(app: typeof applications[0]) {
  const items = [app.sopUploaded, app.cvUploaded, app.transcriptsUploaded, app.toeflSent, app.recsReceived >= 3];
  return Math.round((items.filter(Boolean).length / items.length) * 100);
}

function daysUntil(date: string | null) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function ApplicationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Application Tracker</h1>
          <p className="text-muted-foreground">Track your PhD applications and deadlines.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Application</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>University</Label>
                <Input placeholder="e.g., Stanford University" />
              </div>
              <div>
                <Label>Program</Label>
                <Input placeholder="e.g., PhD Computer Science" />
              </div>
              <div>
                <Label>Target Term</Label>
                <Input placeholder="e.g., Fall 2027" />
              </div>
              <div>
                <Label>Deadline</Label>
                <Input type="date" />
              </div>
              <Button className="w-full" onClick={() => setDialogOpen(false)}>
                Add Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
        {STATUS_COLUMNS.map((col) => {
          const colApps = applications.filter((a) =>
            col.key === "DECIDED"
              ? ["ADMITTED_FUNDED", "ADMITTED_UNFUNDED", "WAITLISTED", "REJECTED", "ACCEPTED_OFFER"].includes(a.status)
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
                    <Card key={app.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-4 pb-3">
                        <h4 className="font-medium text-sm">{app.universityName}</h4>
                        <p className="text-xs text-muted-foreground">{app.program}</p>
                        <p className="text-xs text-muted-foreground">{app.term}</p>

                        {app.deadline && (
                          <div className="flex items-center gap-1 mt-2 text-xs">
                            <Calendar className="h-3 w-3" />
                            <span>{app.deadline}</span>
                            {days !== null && (
                              <Badge variant={days <= 7 ? "destructive" : "secondary"} className="text-xs ml-1">
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
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
