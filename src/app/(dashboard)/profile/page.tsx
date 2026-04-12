"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, GraduationCap, Briefcase, Target, X } from "lucide-react";

const RESEARCH_AREAS = [
  "Machine Learning / Deep Learning", "Computer Vision", "NLP / LLMs",
  "Robotics", "AI Safety / Trustworthy AI", "Systems / Architecture",
  "Security / Privacy", "HCI", "Data Mining", "Theory / Algorithms",
];

export default function ProfilePage() {
  const [skills, setSkills] = useState(["Python", "PyTorch", "LangChain", "TensorFlow"]);
  const [newSkill, setNewSkill] = useState("");
  const [researchInterests, setResearchInterests] = useState(["Trustworthy AI", "Neural Network Verification"]);

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">
          Keep your profile updated for better professor matching and email generation.
        </p>
      </div>

      {/* Personal Info */}
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
              <Input defaultValue="Hassan Naeem" />
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue="hassan@example.com" disabled />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>LinkedIn URL</Label>
              <Input placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <Label>GitHub URL</Label>
              <Input placeholder="https://github.com/..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Education */}
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
              <Input defaultValue="MS Computer Science" />
            </div>
            <div>
              <Label>Current School</Label>
              <Input defaultValue="Concordia University Saint Paul" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>GPA</Label>
              <Input type="number" step="0.01" defaultValue="3.89" />
            </div>
            <div>
              <Label>Expected Graduation</Label>
              <Input type="date" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Experience & Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Years of Industry Experience</Label>
            <Input type="number" defaultValue="5" />
          </div>
          <div>
            <Label>Skills</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <button onClick={() => setSkills(skills.filter((s) => s !== skill))}>
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
            <Label>Upload CV (PDF)</Label>
            <Input type="file" accept=".pdf,.docx" className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* PhD Preferences */}
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
              <Select defaultValue="Fall 2027">
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
              <Select defaultValue="US">
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
              {RESEARCH_AREAS.map((area) => (
                <Badge
                  key={area}
                  variant={researchInterests.includes(area) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() =>
                    setResearchInterests(
                      researchInterests.includes(area)
                        ? researchInterests.filter((r) => r !== area)
                        : [...researchInterests, area]
                    )
                  }
                >
                  {area}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label>Describe your specific research interest</Label>
            <Textarea
              rows={3}
              defaultValue="I'm interested in developing formal verification techniques for neural networks, particularly for safety-critical AI systems. My focus is on scalable methods that can provide provable guarantees about neural network behavior."
            />
          </div>
          <div>
            <Label>Funding Required?</Label>
            <Select defaultValue="yes">
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

      <Button size="lg" className="w-full">Save Profile</Button>
    </div>
  );
}
