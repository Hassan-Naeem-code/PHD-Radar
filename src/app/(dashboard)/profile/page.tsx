"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, GraduationCap, Briefcase, Target, X, Loader2, CheckCircle } from "lucide-react";

const RESEARCH_AREAS = [
  "Machine Learning / Deep Learning", "Computer Vision", "NLP / LLMs",
  "Robotics", "AI Safety / Trustworthy AI", "Systems / Architecture",
  "Security / Privacy", "HCI", "Data Mining", "Theory / Algorithms",
];

interface ProfileData {
  name: string;
  email: string;
  linkedinUrl: string;
  githubUrl: string;
  currentDegree: string;
  currentSchool: string;
  gpa: string;
  graduationDate: string;
  industryYears: string;
  skills: string[];
  researchInterests: string[];
  targetTerm: string;
  targetCountry: string;
  fundingRequired: boolean;
  willingToSelfFund: boolean;
  cvUrl: string | null;
}

const EMPTY: ProfileData = {
  name: "", email: "", linkedinUrl: "", githubUrl: "",
  currentDegree: "", currentSchool: "", gpa: "", graduationDate: "",
  industryYears: "", skills: [], researchInterests: [],
  targetTerm: "Fall 2027", targetCountry: "US",
  fundingRequired: true, willingToSelfFund: false, cvUrl: null,
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        const json = await res.json();
        if (!cancelled && json.success && json.data) {
          const d = json.data;
          setProfile({
            name: d.name ?? "",
            email: d.email ?? "",
            linkedinUrl: d.linkedinUrl ?? "",
            githubUrl: d.githubUrl ?? "",
            currentDegree: d.currentDegree ?? "",
            currentSchool: d.currentSchool ?? "",
            gpa: d.gpa?.toString() ?? "",
            graduationDate: d.graduationDate?.slice(0, 10) ?? "",
            industryYears: d.industryYears?.toString() ?? "",
            skills: d.skills ?? [],
            researchInterests: d.researchInterests ?? [],
            targetTerm: d.targetTerm ?? "Fall 2027",
            targetCountry: d.targetCountry ?? "US",
            fundingRequired: d.fundingRequired ?? true,
            willingToSelfFund: d.willingToSelfFund ?? false,
            cvUrl: d.cvUrl ?? null,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const update = useCallback(<K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setProfile((p) => ({ ...p, [key]: value }));
  }, []);

  function addSkill() {
    const s = newSkill.trim();
    if (s && !profile.skills.includes(s)) {
      update("skills", [...profile.skills, s]);
      setNewSkill("");
    }
  }

  async function uploadCv(file: File) {
    setUploadingCv(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", "cv");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (json.success) {
        update("cvUrl", json.data.url);
      } else {
        alert(json.error?.message ?? "Upload failed");
      }
    } finally {
      setUploadingCv(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          currentDegree: profile.currentDegree || undefined,
          currentSchool: profile.currentSchool || undefined,
          gpa: profile.gpa ? parseFloat(profile.gpa) : undefined,
          researchInterests: profile.researchInterests,
          industryYears: profile.industryYears ? parseInt(profile.industryYears) : undefined,
          skills: profile.skills,
          targetTerm: profile.targetTerm,
          targetCountry: profile.targetCountry,
          fundingRequired: profile.fundingRequired,
          willingToSelfFund: profile.willingToSelfFund,
          linkedinUrl: profile.linkedinUrl || "",
          githubUrl: profile.githubUrl || "",
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message ?? "Save failed");
      } else {
        setSavedAt(new Date());
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">
          Keep your profile updated for better professor matching and email generation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input value={profile.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>LinkedIn URL</Label>
              <Input
                placeholder="https://linkedin.com/in/..."
                value={profile.linkedinUrl}
                onChange={(e) => update("linkedinUrl", e.target.value)}
              />
            </div>
            <div>
              <Label>GitHub URL</Label>
              <Input
                placeholder="https://github.com/..."
                value={profile.githubUrl}
                onChange={(e) => update("githubUrl", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> Education
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Current Degree</Label>
              <Input
                value={profile.currentDegree}
                onChange={(e) => update("currentDegree", e.target.value)}
              />
            </div>
            <div>
              <Label>Current School</Label>
              <Input
                value={profile.currentSchool}
                onChange={(e) => update("currentSchool", e.target.value)}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>GPA</Label>
              <Input
                type="number"
                step="0.01"
                value={profile.gpa}
                onChange={(e) => update("gpa", e.target.value)}
              />
            </div>
            <div>
              <Label>Expected Graduation</Label>
              <Input
                type="date"
                value={profile.graduationDate}
                onChange={(e) => update("graduationDate", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Experience & Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Years of Industry Experience</Label>
            <Input
              type="number"
              value={profile.industryYears}
              onChange={(e) => update("industryYears", e.target.value)}
            />
          </div>
          <div>
            <Label>Skills</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => update("skills", profile.skills.filter((s) => s !== skill))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              />
              <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
            </div>
          </div>
          <div>
            <Label>Upload CV (PDF / DOCX, max 5MB)</Label>
            <div className="flex items-center gap-3 mt-1">
              <Input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCv(f);
                }}
                disabled={uploadingCv}
              />
              {uploadingCv && <Loader2 className="h-4 w-4 animate-spin" />}
              {profile.cvUrl && !uploadingCv && (
                <a
                  href={profile.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline whitespace-nowrap"
                >
                  View current CV
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" /> PhD Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Target Start Term</Label>
              <Select value={profile.targetTerm} onValueChange={(v) => v && update("targetTerm", v as string)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fall 2027">Fall 2027</SelectItem>
                  <SelectItem value="Spring 2027">Spring 2027</SelectItem>
                  <SelectItem value="Fall 2028">Fall 2028</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Country</Label>
              <Select value={profile.targetCountry} onValueChange={(v) => v && update("targetCountry", v as string)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Research Interests</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {RESEARCH_AREAS.map((area) => {
                const active = profile.researchInterests.includes(area);
                return (
                  <Badge
                    key={area}
                    variant={active ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      update(
                        "researchInterests",
                        active
                          ? profile.researchInterests.filter((r) => r !== area)
                          : [...profile.researchInterests, area]
                      )
                    }
                  >
                    {area}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Funding Required?</Label>
            <Select
              value={profile.fundingRequired ? "yes" : profile.willingToSelfFund ? "no" : "preferred"}
              onValueChange={(raw) => {
                const v = raw as string | null;
                if (v === "yes") { update("fundingRequired", true); update("willingToSelfFund", false); }
                else if (v === "no") { update("fundingRequired", false); update("willingToSelfFund", true); }
                else { update("fundingRequired", false); update("willingToSelfFund", false); }
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes, funding required</SelectItem>
                <SelectItem value="preferred">Preferred but not required</SelectItem>
                <SelectItem value="no">No, willing to self-fund</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {savedAt && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="h-4 w-4" /> Saved at {savedAt.toLocaleTimeString()}
        </p>
      )}

      <Button size="lg" className="w-full" onClick={save} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Profile
      </Button>
    </div>
  );
}
