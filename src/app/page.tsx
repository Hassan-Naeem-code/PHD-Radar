import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  DollarSign,
  Mail,
  BarChart3,
  GraduationCap,
  Radar,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Professor Discovery",
    description:
      "AI-powered search across Google Scholar, NSF grants, and university faculty pages to find professors aligned with your research.",
  },
  {
    icon: DollarSign,
    title: "Funding Intelligence",
    description:
      "Real-time tracking of active NSF, NIH, and DARPA grants to identify professors with funding for PhD students.",
  },
  {
    icon: Mail,
    title: "AI-Powered Outreach",
    description:
      "Generate personalized emails that reference specific papers and connect your experience to their research.",
  },
  {
    icon: BarChart3,
    title: "Application Tracker",
    description:
      "Kanban-style dashboard to track deadlines, documents, recommendations, and application status.",
  },
  {
    icon: GraduationCap,
    title: "Research Fit Analysis",
    description:
      "AI analyzes how your background aligns with each professor's work, with specific talking points.",
  },
  {
    icon: Radar,
    title: "Relationship CRM",
    description:
      "Track every interaction with professors — emails, meetings, follow-ups — like a sales pipeline for academia.",
  },
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "5 professor searches/month",
      "Basic professor profiles",
      "Save up to 10 professors",
      "Application tracker",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    features: [
      "Unlimited searches",
      "Full professor profiles",
      "Unlimited saved professors",
      "Outreach tracking",
      "Funding intelligence",
      "Email support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Premium",
    price: "$49",
    period: "/month",
    features: [
      "Everything in Pro",
      "AI-generated emails",
      "Paper analysis",
      "Funding alerts",
      "Research fit scoring",
      "Priority support",
    ],
    cta: "Start Premium Trial",
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Radar className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">PhDRadar</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
                Features
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
                Pricing
              </a>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 max-w-4xl mx-auto">
            Find your PhD advisor{" "}
            <span className="text-primary">before you apply</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered platform to discover professors with active funding,
            analyze research fit, and craft personalized outreach emails.
            Stop cold-emailing blindly.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                See How It Works
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free forever. No credit card required.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Everything you need for PhD applications</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From finding the right professor to tracking your applications,
              PhDRadar automates the most painful parts of the PhD application process.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
            <p className="mt-4 text-muted-foreground">
              Start free, upgrade when you&apos;re ready.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? "border-primary shadow-lg scale-105" : "border"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardContent className="pt-8 pb-6">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="block mt-8">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#1a1a2e] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to find your PhD advisor?</h2>
          <p className="mt-4 text-gray-300">
            Join thousands of students who found their research match with PhDRadar.
          </p>
          <Link href="/signup">
            <Button size="lg" className="mt-8 text-lg px-8">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Radar className="h-6 w-6 text-primary" />
              <span className="font-semibold">PhDRadar</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built by Shammas Development LLC
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
