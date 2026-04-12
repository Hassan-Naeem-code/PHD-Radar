"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Mail, Star, Calendar, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProfessorTrackingPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dr. Xiang Li</h1>
          <p className="text-muted-foreground">George Mason University — Computer Science</p>
        </div>
        <Link href="/outreach/compose/1">
          <Button><Mail className="h-4 w-4 mr-2" /> Compose Email</Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Status</p>
            <Select defaultValue="EMAIL_SENT">
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_CONTACTED">Not Contacted</SelectItem>
                <SelectItem value="EMAIL_DRAFTED">Email Drafted</SelectItem>
                <SelectItem value="EMAIL_SENT">Email Sent</SelectItem>
                <SelectItem value="FOLLOW_UP_SENT">Follow-up Sent</SelectItem>
                <SelectItem value="RESPONDED_POSITIVE">Positive Response</SelectItem>
                <SelectItem value="RESPONDED_NEUTRAL">Neutral Response</SelectItem>
                <SelectItem value="RESPONDED_NEGATIVE">Negative Response</SelectItem>
                <SelectItem value="MEETING_SCHEDULED">Meeting Scheduled</SelectItem>
                <SelectItem value="MEETING_COMPLETED">Meeting Completed</SelectItem>
                <SelectItem value="RELATIONSHIP_ACTIVE">Active Relationship</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Priority</p>
            <Select defaultValue="TOP">
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="TOP">Top</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">Research Fit</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">94</span>
              <span className="text-muted-foreground">/100</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add your notes about this professor..."
            defaultValue="Great fit - working on exactly my area. Lab website mentions looking for students in neural network verification."
            rows={4}
          />
          <Button size="sm" className="mt-3">Save Notes</Button>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Outreach Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div className="w-px flex-1 bg-border mt-2" />
              </div>
              <div className="pb-4">
                <p className="font-medium text-sm">Cold outreach email sent</p>
                <p className="text-xs text-muted-foreground">Apr 8, 2026</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Referenced NeurIPS 2025 paper on neural network verification
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="w-px flex-1 bg-border mt-2" />
              </div>
              <div className="pb-4">
                <p className="font-medium text-sm">Follow-up reminder</p>
                <p className="text-xs text-muted-foreground">Apr 22, 2026 (in 10 days)</p>
                <p className="text-sm text-muted-foreground mt-1">
                  14-day follow-up window
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Saved to list</p>
                <p className="text-xs text-muted-foreground">Apr 5, 2026</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/discover/1" className="flex-1">
          <Button variant="outline" className="w-full">View Full Profile <ArrowRight className="h-4 w-4 ml-2" /></Button>
        </Link>
        <Link href="/outreach/compose/1" className="flex-1">
          <Button className="w-full"><Mail className="h-4 w-4 mr-2" /> Generate Email</Button>
        </Link>
      </div>
    </div>
  );
}
