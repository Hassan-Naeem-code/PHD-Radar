"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Mail, Copy, Clock, CheckCircle, Loader2, Trash2, Send,
} from "lucide-react";

interface OutreachEmail {
  id: string;
  subject: string;
  body: string;
  type: string;
  sentAt: string | null;
  responseReceived: boolean;
  professorId: string;
  professor: {
    name: string;
    university: { shortName: string | null };
  };
}

function categorize(e: OutreachEmail): "draft" | "sent" | "responded" {
  if (e.responseReceived) return "responded";
  if (e.sentAt) return "sent";
  return "draft";
}

const statusIcon = {
  draft: <Clock className="h-4 w-4 text-yellow-500" />,
  sent: <Mail className="h-4 w-4 text-blue-500" />,
  responded: <CheckCircle className="h-4 w-4 text-green-500" />,
};

export default function OutreachPage() {
  const [emails, setEmails] = useState<OutreachEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/outreach");
      const json = await res.json();
      if (json.success) setEmails(json.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function sendEmail(id: string) {
    if (!confirm("Send this email to the professor? This cannot be undone.")) return;
    setSendingId(id);
    try {
      const res = await fetch(`/api/outreach/${id}/send`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        await load();
      } else {
        alert(json.error?.message ?? "Send failed");
      }
    } finally {
      setSendingId(null);
    }
  }

  async function deleteEmail(id: string) {
    if (!confirm("Delete this email?")) return;
    setEmails((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/outreach/${id}`, { method: "DELETE" });
  }

  async function copyEmail(email: OutreachEmail) {
    await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
  }

  async function markResponded(id: string) {
    setEmails((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, responseReceived: true } : e
      )
    );
    await fetch(`/api/outreach/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responseReceived: true, responseDate: new Date().toISOString() }),
    });
  }

  const drafts = emails.filter((e) => categorize(e) === "draft");
  const sent = emails.filter((e) => categorize(e) === "sent");
  const responded = emails.filter((e) => categorize(e) === "responded");

  const renderEmailList = (list: OutreachEmail[]) => (
    <div className="space-y-3">
      {list.map((email) => {
        const status = categorize(email);
        return (
          <Card key={email.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {statusIcon[status]}
                    <span className="font-medium text-sm">{email.professor.name}</span>
                    {email.professor.university.shortName && (
                      <span className="text-xs text-muted-foreground">
                        ({email.professor.university.shortName})
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1 truncate">{email.subject}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {email.type.replace(/_/g, " ")}
                    </Badge>
                    {email.sentAt && (
                      <span className="text-xs text-muted-foreground">
                        Sent: {new Date(email.sentAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" title="Copy email" onClick={() => copyEmail(email)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  {status === "draft" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Send"
                      onClick={() => sendEmail(email.id)}
                      disabled={sendingId === email.id}
                    >
                      {sendingId === email.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Send className="h-4 w-4" />}
                    </Button>
                  )}
                  {status === "sent" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Mark responded"
                      onClick={() => markResponded(email.id)}
                    >
                      Mark replied
                    </Button>
                  )}
                  <Link href={`/outreach/compose/${email.professorId}`}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    onClick={() => deleteEmail(email.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {list.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No emails in this category.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outreach</h1>
          <p className="text-muted-foreground">Manage your professor outreach emails.</p>
        </div>
      </div>

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
