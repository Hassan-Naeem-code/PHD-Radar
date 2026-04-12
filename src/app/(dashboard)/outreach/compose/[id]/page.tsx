"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Copy, Mail, AlertTriangle, CheckCircle } from "lucide-react";

export default function ComposeEmailPage() {
  const [subject, setSubject] = useState(
    "Prospective PhD Student — Interest in Neural Network Verification"
  );
  const [body, setBody] = useState(
    `Dear Dr. Li,

I am writing to express my strong interest in your research on neural network verification at George Mason University. I am currently completing my MS in Computer Science at Concordia University Saint Paul, with a focus on trustworthy AI and formal methods.

I was particularly impressed by your recent NeurIPS 2025 paper on scalable verification via abstract interpretation. Your approach to using GPU-accelerated abstract domains to handle large networks is both novel and practical. I am curious whether you have explored extending this framework to handle recurrent architectures or transformer-based models.

In my 5 years of industry experience, I have worked extensively with Python, PyTorch, and LangChain, building production ML systems that required robustness guarantees. This experience has deepened my interest in the intersection of formal methods and deep learning.

I would welcome the opportunity to discuss potential PhD opportunities in your group, particularly around neural network verification for safety-critical systems.

Thank you for your time.

Best regards,
Hassan Naeem`
  );
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professorId: "1" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setSubject(data.data.subject);
          setBody(data.data.body);
        }
      }
    } catch {
      // Keep existing content on error
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compose Outreach Email</h1>
        <p className="text-muted-foreground">For Dr. Xiang Li — George Mason University</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm text-yellow-800">Add your own voice before sending</p>
          <p className="text-sm text-yellow-700 mt-1">
            AI-generated emails are a starting point. Personalize the content to sound like you,
            then copy to your email client (Gmail, Outlook) to send.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Email Draft</CardTitle>
          <Button onClick={handleGenerate} disabled={generating} variant="outline" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : "AI Generate"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{body.split(/\s+/).length} words</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{body.length} characters</span>
          </div>
        </CardContent>
      </Card>

      {/* Talking Points */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Talking Points</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">References NeurIPS 2025 paper on scalable verification</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Shows understanding of abstract interpretation technique</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span className="text-sm">Connects industry ML experience to research</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleCopy} className="flex-1" variant="outline">
          {copied ? (
            <><CheckCircle className="h-4 w-4 mr-2" /> Copied!</>
          ) : (
            <><Copy className="h-4 w-4 mr-2" /> Copy to Clipboard</>
          )}
        </Button>
        <a
          href={`mailto:xli@gmu.edu?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button className="w-full">
            <Mail className="h-4 w-4 mr-2" /> Open in Email Client
          </Button>
        </a>
        <Button variant="secondary" className="flex-1">
          Save Draft
        </Button>
      </div>
    </div>
  );
}
