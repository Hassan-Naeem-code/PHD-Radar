"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Mail, Copy, Clock, CheckCircle, XCircle } from "lucide-react";

const emails = [
  {
    id: "e1",
    professorName: "Dr. Xiang Li",
    university: "GMU",
    subject: "Prospective PhD Student — Neural Network Verification Research",
    type: "COLD_OUTREACH",
    sentAt: "2026-04-08",
    responseReceived: false,
    status: "sent",
  },
  {
    id: "e2",
    professorName: "Dr. Sarah Chen",
    university: "UTA",
    subject: "Interest in Adversarial Robustness Research",
    type: "COLD_OUTREACH",
    sentAt: null,
    responseReceived: false,
    status: "draft",
  },
  {
    id: "e3",
    professorName: "Dr. Maria Rodriguez",
    university: "UMich",
    subject: "Re: PhD Opportunities in Trustworthy AI",
    type: "COLD_OUTREACH",
    sentAt: "2026-03-25",
    responseReceived: true,
    status: "responded",
  },
  {
    id: "e4",
    professorName: "Dr. James Park",
    university: "Virginia Tech",
    subject: "Following up — PhD Research Opportunity",
    type: "FOLLOW_UP",
    sentAt: "2026-04-01",
    responseReceived: false,
    status: "sent",
  },
];

const statusIcon = {
  draft: <Clock className="h-4 w-4 text-yellow-500" />,
  sent: <Mail className="h-4 w-4 text-blue-500" />,
  responded: <CheckCircle className="h-4 w-4 text-green-500" />,
};

export default function OutreachPage() {
  const drafts = emails.filter((e) => e.status === "draft");
  const sent = emails.filter((e) => e.status === "sent");
  const responded = emails.filter((e) => e.status === "responded");

  const renderEmailList = (list: typeof emails) => (
    <div className="space-y-3">
      {list.map((email) => (
        <Card key={email.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {statusIcon[email.status as keyof typeof statusIcon]}
                  <span className="font-medium text-sm">{email.professorName}</span>
                  <span className="text-xs text-muted-foreground">({email.university})</span>
                </div>
                <p className="text-sm mt-1 truncate">{email.subject}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {email.type.replace("_", " ")}
                  </Badge>
                  {email.sentAt && (
                    <span className="text-xs text-muted-foreground">
                      Sent: {email.sentAt}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" title="Copy email">
                  <Copy className="h-4 w-4" />
                </Button>
                <Link href={`/outreach/compose/${email.id}`}>
                  <Button variant="ghost" size="sm">Edit</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {list.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No emails in this category.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outreach</h1>
          <p className="text-muted-foreground">Manage your professor outreach emails.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{emails.length}</p>
            <p className="text-xs text-muted-foreground">Total Emails</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{sent.length + responded.length}</p>
            <p className="text-xs text-muted-foreground">Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{responded.length}</p>
            <p className="text-xs text-muted-foreground">Responses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({emails.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({sent.length})</TabsTrigger>
          <TabsTrigger value="responded">Responded ({responded.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{renderEmailList(emails)}</TabsContent>
        <TabsContent value="drafts" className="mt-4">{renderEmailList(drafts)}</TabsContent>
        <TabsContent value="sent" className="mt-4">{renderEmailList(sent)}</TabsContent>
        <TabsContent value="responded" className="mt-4">{renderEmailList(responded)}</TabsContent>
      </Tabs>
    </div>
  );
}
