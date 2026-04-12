"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  Mail,
  MessageSquare,
  ClipboardList,
  Calendar,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

const stats = [
  { name: "Saved Professors", value: "12", icon: Users, change: "+3 this week" },
  { name: "Emails Sent", value: "8", icon: Mail, change: "+2 this week" },
  { name: "Responses", value: "2", icon: MessageSquare, change: "25% rate" },
  { name: "Applications", value: "5", icon: ClipboardList, change: "2 submitted" },
];

const deadlines = [
  { university: "George Mason University", program: "PhD CS", deadline: "Mar 15, 2027", daysLeft: 3, urgent: true },
  { university: "UT Arlington", program: "PhD CS", deadline: "Rolling", daysLeft: null, urgent: false },
  { university: "Texas Tech", program: "PhD CS", deadline: "Apr 1, 2027", daysLeft: 20, urgent: false },
];

const recentActivity = [
  { professor: "Dr. Nguyen", action: "Email sent", time: "2 days ago", status: "EMAIL_SENT" },
  { professor: "Dr. Huang", action: "Draft ready", time: "3 days ago", status: "EMAIL_DRAFTED" },
  { professor: "Dr. Zhu", action: "Follow-up due", time: "Overdue", status: "FOLLOW_UP_SENT" },
];

const topMatches = [
  { name: "Dr. Xiang Li", score: 94, funded: true, university: "GMU" },
  { name: "Dr. Sarah Chen", score: 87, funded: false, university: "UTA" },
  { name: "Dr. Wei Zhang", score: 82, funded: true, university: "TTU" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here&apos;s your PhD application overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.name}</p>
              <p className="text-xs text-green-600 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              <Calendar className="h-5 w-5 inline mr-2" />
              Upcoming Deadlines
            </CardTitle>
            <Link href="/applications">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deadlines.map((d) => (
                <div key={d.university} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{d.university}</p>
                    <p className="text-xs text-muted-foreground">{d.program}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{d.deadline}</p>
                    {d.daysLeft !== null && (
                      <Badge variant={d.urgent ? "destructive" : "secondary"} className="text-xs">
                        {d.daysLeft} days
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Outreach */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              <Mail className="h-5 w-5 inline mr-2" />
              Recent Outreach
            </CardTitle>
            <Link href="/outreach">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((a) => (
                <div key={a.professor} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{a.professor}</p>
                    <p className="text-xs text-muted-foreground">{a.action}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Matched Professors */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              <TrendingUp className="h-5 w-5 inline mr-2" />
              Top Matched Professors
            </CardTitle>
            <Link href="/discover">
              <Button variant="ghost" size="sm">
                Discover more <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              {topMatches.map((prof, i) => (
                <div key={prof.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{prof.name}</p>
                    <p className="text-xs text-muted-foreground">{prof.university}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{prof.score}</p>
                    <Badge variant={prof.funded ? "default" : "secondary"} className="text-xs">
                      {prof.funded ? "Funded" : "Maybe"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
