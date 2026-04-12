import { z } from "zod";

export const searchSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters").max(500),
  filters: z
    .object({
      fundingRequired: z.boolean().optional(),
      rankingMax: z.number().min(1).max(500).optional(),
      country: z.string().optional(),
      researchArea: z.string().optional(),
      lookingForStudents: z.boolean().optional(),
      universityName: z.string().optional(),
      minFundingScore: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  currentDegree: z.string().max(100).optional(),
  currentSchool: z.string().max(200).optional(),
  gpa: z.number().min(0).max(4.0).optional(),
  researchInterests: z.array(z.string()).max(10).optional(),
  industryYears: z.number().min(0).max(50).optional(),
  skills: z.array(z.string()).max(20).optional(),
  targetTerm: z.string().max(20).optional(),
  targetCountry: z.string().max(50).optional(),
  fundingRequired: z.boolean().optional(),
  willingToSelfFund: z.boolean().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
});

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const applicationSchema = z.object({
  universityName: z.string().min(1, "University name is required"),
  program: z.string().min(1, "Program is required"),
  term: z.string().min(1, "Term is required"),
  deadline: z.string().optional(),
  portalUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

export const outreachEmailSchema = z.object({
  professorId: z.string().min(1),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(10, "Email body must be at least 10 characters").max(5000),
  type: z.enum([
    "COLD_OUTREACH",
    "FOLLOW_UP",
    "THANK_YOU",
    "MEETING_REQUEST",
    "APPLICATION_NOTICE",
  ]),
});

export const savedProfessorSchema = z.object({
  professorId: z.string().min(1),
  notes: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "TOP"]).optional(),
});
