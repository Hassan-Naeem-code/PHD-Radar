"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, Database, Activity, BarChart3, Search,
  RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle,
  Upload, Shield,
} from "lucide-react";

const stats = [
  { label: "Total Users", value: "1,247", icon: Users, change: "+52 this week" },
  { label: "Professors", value: "8,432", icon: Database, change: "+312 scraped" },
  { label: "Searches Today", value: "384", icon: Search, change: "+12% vs avg" },
  { label: "API Health", value: "99.8%", icon: Activity, change: "All systems go" },
];

const recentUsers = [
  { id: "u1", name: "Hassan Naeem", email: "hassan@example.com", role: "STUDENT", signedUp: "2026-04-10", searches: 12 },
  { id: "u2", name: "Aisha Khan", email: "aisha@example.com", role: "STUDENT", signedUp: "2026-04-11", searches: 5 },
  { id: "u3", name: "Dev Admin", email: "admin@phdradar.com", role: "ADMIN", signedUp: "2026-01-01", searches: 0 },
];

const scrapingJobs = [
  { id: "j1", source: "semantic_scholar", status: "COMPLETED", resultCount: 145, startedAt: "2026-04-12 02:00", duration: "12m" },
  { id: "j2", source: "nsf_awards", status: "COMPLETED", resultCount: 38, startedAt: "2026-04-01 03:00", duration: "5m" },
  { id: "j3", source: "faculty_pages", status: "FAILED", resultCount: 0, startedAt: "2026-04-11 04:00", duration: "1m", error: "Timeout on 3 domains" },
  { id: "j4", source: "csrankings", status: "RUNNING", resultCount: 0, startedAt: "2026-04-12 06:00", duration: "—" },
];

const statusIcon = {
  COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
  RUNNING: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
  FAILED: <XCircle className="h-4 w-4 text-red-500" />,
  PENDING: <Clock className="h-4 w-4 text-yellow-500" />,
};

export default function AdminPage() {
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
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{s.value}</p>
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
          <div className="flex gap-3">
            <Input placeholder="Search users..." className="max-w-sm" />
            <Button variant="outline">Export CSV</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead>Searches</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge></TableCell>
                    <TableCell>{user.signedUp}</TableCell>
                    <TableCell>{user.searches}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="scraping" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <Button><RefreshCw className="h-4 w-4 mr-2" /> Trigger Scrape</Button>
            <Button variant="outline">View Logs</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scrapingJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.source}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {statusIcon[job.status as keyof typeof statusIcon]}
                        <span>{job.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{job.resultCount}</TableCell>
                    <TableCell>{job.startedAt}</TableCell>
                    <TableCell>{job.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="mt-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Bulk Import</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Upload a CSV file to bulk import professor data.</p>
                <Input type="file" accept=".csv" />
                <Button className="mt-3 w-full"><Upload className="h-4 w-4 mr-2" /> Import CSV</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Data Quality</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>HIGH quality</span><Badge className="bg-green-100 text-green-700">2,145</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>MEDIUM quality</span><Badge className="bg-yellow-100 text-yellow-700">4,287</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>LOW quality</span><Badge className="bg-red-100 text-red-700">2,000</Badge>
                </div>
                <Button variant="outline" className="w-full mt-2">Run Data Enrichment</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">67%</p>
                <p className="text-sm text-muted-foreground">Activation Rate</p>
                <p className="text-xs text-green-600">Signups who saved a professor</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">4.2</p>
                <p className="text-sm text-muted-foreground">Avg Professors Saved</p>
                <p className="text-xs text-muted-foreground">Per active user</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">12%</p>
                <p className="text-sm text-muted-foreground">Free &rarr; Pro Conversion</p>
                <p className="text-xs text-green-600">+2% vs last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
