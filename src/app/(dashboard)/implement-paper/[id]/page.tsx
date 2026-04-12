"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen, Code, GitBranch, CheckCircle, Circle,
  ExternalLink, Sparkles, Clock, Gauge, Share2,
} from "lucide-react";
import Link from "next/link";

const paper = {
  title: "Scalable Verification of Neural Networks via Abstract Interpretation",
  authors: ["X. Li", "J. Wang"],
  venue: "NeurIPS 2025",
  professorName: "Dr. Xiang Li",
  professorId: "1",
  complexity: "Medium",
  estimatedTime: "2-3 weeks",
  hasPublicCode: true,
  hasPublicDataset: true,
};

const steps = [
  { title: "Read & Understand the Paper", done: true, description: "Read the paper, understand key contributions and methods" },
  { title: "Set Up Repository", done: true, description: "Clone starter template, set up environment" },
  { title: "Implement Core Algorithm", done: false, description: "Implement the abstract interpretation engine for ReLU networks" },
  { title: "Run on Benchmark Dataset", done: false, description: "Reproduce Table 2 results using MNIST and CIFAR-10" },
  { title: "Document Results", done: false, description: "Create comparison table, write README with findings" },
  { title: "Share with Professor", done: false, description: "Send implementation link with brief summary of results" },
];

const completedSteps = steps.filter((s) => s.done).length;
const progressPct = Math.round((completedSteps / steps.length) * 100);

export default function ImplementPaperPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Code className="h-4 w-4" /> Implement Their Paper
        </div>
        <h1 className="text-2xl font-bold">{paper.title}</h1>
        <p className="text-muted-foreground mt-1">
          {paper.authors.join(", ")} — {paper.venue}
        </p>
        <p className="text-sm text-primary mt-1">
          Professor: <Link href={`/discover/${paper.professorId}`} className="hover:underline">{paper.professorName}</Link>
        </p>
      </div>

      {/* Why this paper */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">Why this paper?</h3>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>Aligns with your interest in neural network verification</li>
                <li>Medium complexity — achievable in 2-3 weeks</li>
                <li>Public code and dataset available</li>
                <li>Recent publication — professor actively cares about this work</li>
                <li>Implementing it shows initiative and technical depth</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="gap-1"><Gauge className="h-3 w-3" /> {paper.complexity} Complexity</Badge>
        <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> {paper.estimatedTime}</Badge>
        {paper.hasPublicCode && <Badge className="bg-green-100 text-green-700 gap-1"><GitBranch className="h-3 w-3" /> Public Code</Badge>}
        {paper.hasPublicDataset && <Badge className="bg-blue-100 text-blue-700 gap-1"><BookOpen className="h-3 w-3" /> Public Dataset</Badge>}
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Implementation Progress</span>
            <span className="text-sm font-normal text-muted-foreground">{completedSteps}/{steps.length} steps</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPct} className="mb-6" />
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                {step.done ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                )}
                <div>
                  <p className={`font-medium text-sm ${step.done ? "line-through text-muted-foreground" : ""}`}>{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Implementation Steps (AI generated) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> AI-Extracted Implementation Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium">1. Core Components</h4>
            <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
              <li>&bull; Abstract domain for ReLU activation bounds (DeepPoly or CROWN)</li>
              <li>&bull; Back-substitution engine for layer-by-layer propagation</li>
              <li>&bull; GPU parallelization using PyTorch&apos;s batch operations</li>
            </ul>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium">2. Key Dependencies</h4>
            <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
              <li>&bull; PyTorch &ge; 2.0, NumPy, ONNX for model loading</li>
              <li>&bull; VNNLIB format parser for verification properties</li>
            </ul>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium">3. Evaluation Targets</h4>
            <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
              <li>&bull; Reproduce Table 2: Verified accuracy on MNIST 6x100</li>
              <li>&bull; Compare runtime with baseline (ERAN toolkit)</li>
              <li>&bull; GPU vs CPU speedup measurement</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="flex-1">
          <GitBranch className="h-4 w-4 mr-2" /> Create GitHub Repo from Template
        </Button>
        <Button variant="outline" className="flex-1">
          <Share2 className="h-4 w-4 mr-2" /> Share Results with Professor
        </Button>
      </div>
    </div>
  );
}
