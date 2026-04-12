"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Circle, ExternalLink } from "lucide-react";

export default function ApplicationDetailPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">George Mason University</h1>
        <p className="text-muted-foreground">PhD Computer Science — Fall 2027</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <Label>Status</Label>
            <Select defaultValue="IN_PROGRESS">
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RESEARCHING">Researching</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="ADMITTED_FUNDED">Admitted (Funded)</SelectItem>
                <SelectItem value="ADMITTED_UNFUNDED">Admitted (Unfunded)</SelectItem>
                <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                <SelectItem value="ACCEPTED_OFFER">Accepted Offer</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <Label>Deadline</Label>
            <Input type="date" defaultValue="2027-03-15" className="mt-1" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Document Checklist</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ChecklistItem label="Statement of Purpose" done={true} />
          <ChecklistItem label="CV / Resume" done={true} />
          <ChecklistItem label="Transcripts" done={false} />
          <ChecklistItem label="TOEFL Score Sent" done={true} />
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Recommendation Letters</span>
            <Badge variant="secondary">1 of 3 received</Badge>
          </div>
          <div className="ml-4 space-y-1">
            <ChecklistItem label="Prof. Smith (Concordia)" done={true} />
            <ChecklistItem label="Prof. Johnson (Industry)" done={false} />
            <ChecklistItem label="Prof. Williams (Research)" done={false} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Application Portal</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label>Portal URL</Label>
              <div className="flex gap-2 mt-1">
                <Input defaultValue="https://apply.gmu.edu" readOnly />
                <a href="https://apply.gmu.edu" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            defaultValue="Need to request official transcripts from Concordia. Dr. Li said to mention her name in SOP."
          />
          <Button size="sm" className="mt-3">Save</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={`text-sm ${done ? "" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}
