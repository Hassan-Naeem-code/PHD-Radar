"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users, Mail, MessageSquare, ClipboardList, Calendar,
  ArrowRight, TrendingUp, Loader2,
} from "lucide-react";

interface DashboardStats {
  stats: {
    savedProfessors: { value: number; change: number };
    emailsSent: { value: number; change: number };
    responses: { value: number; rate: number };
    applications: { value: number; submitted: number };
  };
  upcomingDeadlines: Array<{
    id: string;
    university: string;
    program: string;
    deadline: string | null;
    daysLeft: number | null;
  }>;
  recentActivity: Array<{
    id: string;
    professor: string;
    action: string;
    status: string;
    createdAt: string;
  }>;
  topMatches: Array<{
    id: string;
    name: string;
    university: string;
    funded: boolean;
    score: number;
  }>;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        const json = await res.json();
        if (json.success) setData(json.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Unable to load dashboard.</p>;
  }

  const statCards = [
    {
      name: "Saved Professors",
      value: data.stats.savedProfessors.value,
      icon: Users,
      change: data.stats.savedProfessors.change > 0
        ? `+${data.stats.savedProfessors.change} this week`
        : "No change",
    },
    {
      name: "Emails Sent",
      value: data.stats.emailsSent.value,
      icon: Mail,
      change: data.stats.emailsSent.change > 0
        ? `+${data.stats.emailsSent.change} this week`
        : "No change",
    },
    {
      name: "Responses",
      value: data.stats.responses.value,
      icon: MessageSquare,
      change: `${data.stats.responses.rate}% rate`,
    },
    {
      name: "Applications",
      value: data.stats.applications.value,
      icon: ClipboardList,
      change: `${data.stats.applications.submitted} submitted`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here&apos;s your PhD application overview.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
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
            {data.upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
            ) : (
              <div className="space-y-4">
                {data.upcomingDeadlines.map((d) => (
                  <div key={d.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{d.university}</p>
                      <p className="text-xs text-muted-foreground">{d.program}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {d.deadline ? new Date(d.deadline).toLocaleDateString() : "Rolling"}
                      </p>
                      {d.daysLeft !== null && (
                        <Badge
                          variant={d.daysLeft <= 7 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {d.daysLeft} days
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <div className="space-y-4">
                {data.recentActivity.map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{a.professor}</p>
                      <p className="text-xs text-muted-foreground">{a.action}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(a.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
            {data.topMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Save professors from Discover to see matches.
              </p>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                {data.topMatches.map((prof, i) => (
                  <Link
                    key={prof.id}
                    href={`/professors/${prof.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
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
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
