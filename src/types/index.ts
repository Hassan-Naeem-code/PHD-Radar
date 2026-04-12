export interface SearchFilters {
  fundingRequired?: boolean;
  rankingMax?: number;
  country?: string;
  researchArea?: string;
  lookingForStudents?: boolean;
  universityName?: string;
  minFundingScore?: number;
}

export interface ProfessorResult {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  universityName: string;
  researchAreas: string[];
  hIndex: number | null;
  citations: number | null;
  hasActiveFunding: boolean;
  lookingForStudents: boolean;
  fundingScore: number | null;
  researchAlignmentScore: number;
  overallMatchScore: number;
}

export interface ProfessorDetail {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  department: string | null;
  university: {
    id: string;
    name: string;
    shortName: string | null;
    location: string | null;
    csRanking: number | null;
  };
  personalWebsite: string | null;
  googleScholarUrl: string | null;
  labName: string | null;
  labWebsite: string | null;
  researchAreas: string[];
  researchSummary: string | null;
  hIndex: number | null;
  citations: number | null;
  recentPaperCount: number | null;
  hasActiveFunding: boolean;
  lookingForStudents: boolean;
  currentPhDStudents: number | null;
  graduatedPhDStudents: number | null;
  internationalStudents: boolean | null;
  fundingScore: number | null;
  responsivenessScore: number | null;
  dataQuality: string;
  publications: PublicationSummary[];
  fundingSources: GrantSummary[];
}

export interface PublicationSummary {
  id: string;
  title: string;
  authors: string[];
  venue: string | null;
  year: number;
  citationCount: number;
  summary: string | null;
  url: string | null;
}

export interface GrantSummary {
  id: string;
  title: string;
  agency: string;
  amount: number | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
}

export interface ResearchFitAnalysis {
  fitScore: number;
  explanation: string;
  talkingPoints: string[];
  suggestedQuestion: string;
  industryConnection: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  talkingPoints: string[];
}

export interface DashboardStats {
  savedProfessors: number;
  emailsSent: number;
  responsesReceived: number;
  applicationsInProgress: number;
}

export interface DeadlineItem {
  id: string;
  universityName: string;
  program: string;
  deadline: string;
  daysRemaining: number;
}

export interface OutreachActivity {
  id: string;
  professorName: string;
  status: string;
  lastAction: string;
  lastActionDate: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currentDegree: string | null;
  currentSchool: string | null;
  gpa: number | null;
  researchInterests: string[];
  industryYears: number | null;
  skills: string[];
  targetTerm: string | null;
  targetCountry: string;
  fundingRequired: boolean;
  linkedinUrl: string | null;
  githubUrl: string | null;
  cvUrl: string | null;
}
