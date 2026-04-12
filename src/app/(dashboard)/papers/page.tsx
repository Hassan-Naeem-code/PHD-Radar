"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const papers = [
  {
    id: "p1",
    title: "Scalable Verification of Neural Networks via Abstract Interpretation",
    authors: ["X. Li", "J. Wang"],
    venue: "NeurIPS 2025",
    year: 2025,
    professorName: "Dr. Xiang Li",
    citationCount: 45,
    summary: "Novel approach to verify properties of deep neural networks using GPU-accelerated abstract interpretation. Achieves 10x speedup over existing methods while maintaining precision.",
    keyFindings: ["GPU-accelerated abstract domains", "Scalable to networks with millions of parameters", "Sound and complete verification for ReLU networks"],
    futureWork: ["Extension to transformer architectures", "Application to reinforcement learning policies", "Integration with certified training methods"],
  },
  {
    id: "p2",
    title: "Certified Robustness via Randomized Smoothing with Optimal Transport",
    authors: ["X. Li", "M. Chen", "R. Singh"],
    venue: "ICML 2024",
    year: 2024,
    professorName: "Dr. Xiang Li",
    citationCount: 82,
    summary: "Tighter robustness certificates for deep classifiers using optimal transport theory. Provides state-of-the-art certified accuracy on ImageNet.",
    keyFindings: ["Optimal transport-based certificate bounds", "State-of-the-art on ImageNet", "Applicable to any classifier architecture"],
    futureWork: ["Extending to semantic perturbations", "Combining with adversarial training"],
  },
  {
    id: "p3",
    title: "Trustworthy AI in Autonomous Systems: A Survey",
    authors: ["X. Li", "K. Patel"],
    venue: "ACM Computing Surveys",
    year: 2024,
    professorName: "Dr. Xiang Li",
    citationCount: 120,
    summary: "Comprehensive survey covering verification, robustness, interpretability, and fairness for AI in safety-critical autonomous systems.",
    keyFindings: ["Taxonomy of trustworthiness dimensions", "Gap analysis across autonomous driving, robotics, and aviation", "Open challenges in real-time verification"],
    futureWork: ["Runtime monitoring frameworks", "Human-AI collaboration in safety-critical settings"],
  },
];

export default function PapersPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paper Analysis</h1>
        <p className="text-muted-foreground">
          AI-analyzed papers from your saved professors. Great for email talking points.
        </p>
      </div>

      <div className="space-y-4">
        {papers.map((paper) => (
          <Card key={paper.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold">{paper.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {paper.authors.join(", ")} — {paper.venue} ({paper.year})
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{paper.professorName}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {paper.citationCount} citations
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpanded(expanded === paper.id ? null : paper.id)}
                >
                  {expanded === paper.id ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {expanded === paper.id && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div>
                    <h4 className="flex items-center gap-2 font-medium text-sm mb-2">
                      <Sparkles className="h-4 w-4 text-primary" /> AI Summary
                    </h4>
                    <p className="text-sm text-muted-foreground">{paper.summary}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Findings</h4>
                    <ul className="space-y-1">
                      {paper.keyFindings.map((f, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Future Work (conversation starters)</h4>
                    <ul className="space-y-1">
                      {paper.futureWork.map((f, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-yellow-500">→</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
