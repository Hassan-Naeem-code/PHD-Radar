"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Briefcase, Target, Sparkles, ArrowRight, ArrowLeft, X } from "lucide-react";

const RESEARCH_AREAS = [
  "Machine Learning / Deep Learning", "Computer Vision", "NLP / LLMs",
  "Robotics", "AI Safety / Trustworthy AI", "Systems / Architecture",
  "Security / Privacy", "HCI", "Data Mining", "Theory / Algorithms",
];

const STEPS = [
  { title: "Research Profile", icon: Target },
  { title: "Background", icon: GraduationCap },
  { title: "Experience & Skills", icon: Briefcase },
  { title: "Your First Search", icon: Sparkles },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    degreeType: "PhD",
    targetTerm: "Fall 2027",
    researchAreas: [] as string[],
    researchDescription: "",
    fundingPreference: "yes",
    currentDegree: "",
    currentSchool: "",
    gpa: "",
    industryYears: "",
    skills: [] as string[],
    newSkill: "",
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  const toggleArea = (area: string) => {
    setProfile((p) => ({
      ...p,
      researchAreas: p.researchAreas.includes(area)
        ? p.researchAreas.filter((a) => a !== area)
        : [...p.researchAreas, area],
    }));
  };

  const addSkill = () => {
    if (profile.newSkill.trim() && !profile.skills.includes(profile.newSkill.trim())) {
      setProfile((p) => ({
        ...p,
        skills: [...p.skills, p.newSkill.trim()],
        newSkill: "",
      }));
    }
  };

  const handleComplete = async () => {
    try {
      await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
    } catch {
      // Continue to dashboard even if save fails
    }
    router.push("/dashboard");
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Welcome to PhDRadar</h1>
        <p className="text-muted-foreground mt-1">Let&apos;s set up your profile for better professor matching.</p>
      </div>

      <Progress value={progress} className="mb-8" />

      <div className="flex justify-center gap-4 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.title} className={`flex items-center gap-2 text-sm ${i === step ? "text-primary font-medium" : i < step ? "text-green-600" : "text-muted-foreground"}`}>
            <s.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{s.title}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>What degree are you pursuing?</Label>
                  <Select value={profile.degreeType} onValueChange={(v) => setProfile((p) => ({ ...p, degreeType: v ?? "PhD" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PhD">PhD</SelectItem>
                      <SelectItem value="Masters">Masters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target start term?</Label>
                  <Select value={profile.targetTerm} onValueChange={(v) => setProfile((p) => ({ ...p, targetTerm: v ?? "Fall 2027" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fall 2027">Fall 2027</SelectItem>
                      <SelectItem value="Spring 2027">Spring 2027</SelectItem>
                      <SelectItem value="Fall 2028">Fall 2028</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Research areas (select all that apply)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {RESEARCH_AREAS.map((area) => (
                    <Badge
                      key={area}
                      variant={profile.researchAreas.includes(area) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArea(area)}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Describe your specific research interest (2-3 sentences)</Label>
                <Textarea
                  value={profile.researchDescription}
                  onChange={(e) => setProfile((p) => ({ ...p, researchDescription: e.target.value }))}
                  rows={3}
                  placeholder="I'm interested in..."
                />
              </div>
              <div>
                <Label>Do you require funding?</Label>
                <Select value={profile.fundingPreference} onValueChange={(v) => setProfile((p) => ({ ...p, fundingPreference: v ?? "yes" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes, funding required</SelectItem>
                    <SelectItem value="preferred">Preferred but not required</SelectItem>
                    <SelectItem value="no">No, willing to self-fund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Current degree</Label>
                  <Input value={profile.currentDegree} onChange={(e) => setProfile((p) => ({ ...p, currentDegree: e.target.value }))} placeholder="MS Computer Science" />
                </div>
                <div>
                  <Label>Current school</Label>
                  <Input value={profile.currentSchool} onChange={(e) => setProfile((p) => ({ ...p, currentSchool: e.target.value }))} placeholder="University name" />
                </div>
              </div>
              <div>
                <Label>GPA</Label>
                <Input type="number" step="0.01" value={profile.gpa} onChange={(e) => setProfile((p) => ({ ...p, gpa: e.target.value }))} placeholder="3.89" />
              </div>
              <div>
                <Label>Upload CV (optional but recommended)</Label>
                <Input type="file" accept=".pdf,.docx" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label>Years of industry experience</Label>
                <Input type="number" value={profile.industryYears} onChange={(e) => setProfile((p) => ({ ...p, industryYears: e.target.value }))} placeholder="5" />
              </div>
              <div>
                <Label>Key skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <button onClick={() => setProfile((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input value={profile.newSkill} onChange={(e) => setProfile((p) => ({ ...p, newSkill: e.target.value }))} placeholder="Add a skill..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} />
                  <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">You&apos;re all set!</h3>
              <p className="text-muted-foreground mt-2">
                We&apos;ll use your profile to find the best professor matches.
                Your personalized dashboard is ready.
              </p>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Research: {profile.researchAreas.join(", ") || "Not specified"}</p>
                <p>Skills: {profile.skills.join(", ") || "Not specified"}</p>
                <p>Target: {profile.degreeType} — {profile.targetTerm}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleComplete}>
            Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      <button onClick={() => router.push("/dashboard")} className="block mx-auto mt-4 text-sm text-muted-foreground hover:underline">
        Skip for now
      </button>
    </div>
  );
}
