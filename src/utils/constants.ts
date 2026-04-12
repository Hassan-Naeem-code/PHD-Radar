export const RESEARCH_AREAS = [
  "Machine Learning / Deep Learning",
  "Computer Vision",
  "NLP / LLMs",
  "Robotics",
  "AI Safety / Trustworthy AI",
  "Systems / Architecture",
  "Security / Privacy",
  "HCI",
  "Data Mining",
  "Computer Graphics",
  "Theory / Algorithms",
  "Databases",
  "Networking",
  "Software Engineering",
  "Bioinformatics",
  "Quantum Computing",
] as const;

export const FUNDING_AGENCIES = [
  "NSF",
  "NIH",
  "DARPA",
  "DOE",
  "DOD",
  "Amazon",
  "Google",
  "Meta",
  "Microsoft",
  "IARPA",
] as const;

export const APP_NAME = "PhDRadar";
export const APP_TAGLINE = "Find your PhD advisor before you apply.";

export const BRAND_COLORS = {
  navy: "#1a1a2e",
  blue: "#4361ee",
  white: "#ffffff",
  lightGray: "#f8fafc",
  darkGray: "#334155",
} as const;

export const PRICING = {
  free: {
    name: "Free",
    price: 0,
    searchesPerMonth: 5,
    features: [
      "5 professor searches/month",
      "Basic professor profiles",
      "Save up to 10 professors",
      "Application tracker",
    ],
  },
  pro: {
    name: "Pro",
    price: 19,
    priceId: "price_pro",
    features: [
      "Unlimited searches",
      "Full professor profiles",
      "Unlimited saved professors",
      "Outreach tracking",
      "Funding intelligence",
      "Application tracker",
      "Email support",
    ],
  },
  premium: {
    name: "Premium",
    price: 49,
    priceId: "price_premium",
    features: [
      "Everything in Pro",
      "AI-generated emails",
      "Paper analysis",
      "Funding alerts",
      "Research fit scoring",
      "Priority support",
    ],
  },
} as const;

export const OUTREACH_STATUS_LABELS: Record<string, string> = {
  NOT_CONTACTED: "Not Contacted",
  EMAIL_DRAFTED: "Email Drafted",
  EMAIL_SENT: "Email Sent",
  FOLLOW_UP_SENT: "Follow-up Sent",
  RESPONDED_POSITIVE: "Positive Response",
  RESPONDED_NEUTRAL: "Neutral Response",
  RESPONDED_NEGATIVE: "Negative Response",
  MEETING_SCHEDULED: "Meeting Scheduled",
  MEETING_COMPLETED: "Meeting Completed",
  RELATIONSHIP_ACTIVE: "Active Relationship",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  RESEARCHING: "Researching",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ADMITTED_FUNDED: "Admitted (Funded)",
  ADMITTED_UNFUNDED: "Admitted (Unfunded)",
  WAITLISTED: "Waitlisted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ACCEPTED_OFFER: "Accepted Offer",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  TOP: "bg-red-100 text-red-700",
};
