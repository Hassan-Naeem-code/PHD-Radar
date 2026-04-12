import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const universities = [
  { name: "Massachusetts Institute of Technology", shortName: "MIT", location: "Cambridge, MA", state: "MA", csRanking: 1, usNewsRanking: 1, website: "https://www.mit.edu", greRequired: false, toeflMinimum: 100 },
  { name: "Stanford University", shortName: "Stanford", location: "Stanford, CA", state: "CA", csRanking: 2, usNewsRanking: 1, website: "https://www.stanford.edu", greRequired: false, toeflMinimum: 100 },
  { name: "Carnegie Mellon University", shortName: "CMU", location: "Pittsburgh, PA", state: "PA", csRanking: 3, usNewsRanking: 3, website: "https://www.cmu.edu", greRequired: false, toeflMinimum: 100 },
  { name: "University of California, Berkeley", shortName: "UCB", location: "Berkeley, CA", state: "CA", csRanking: 4, usNewsRanking: 4, website: "https://www.berkeley.edu", greRequired: false, toeflMinimum: 90 },
  { name: "University of Illinois Urbana-Champaign", shortName: "UIUC", location: "Champaign, IL", state: "IL", csRanking: 5, usNewsRanking: 5, website: "https://www.illinois.edu", greRequired: false, toeflMinimum: 96 },
  { name: "Georgia Institute of Technology", shortName: "Georgia Tech", location: "Atlanta, GA", state: "GA", csRanking: 6, usNewsRanking: 8, website: "https://www.gatech.edu", greRequired: false, toeflMinimum: 90 },
  { name: "University of Washington", shortName: "UW", location: "Seattle, WA", state: "WA", csRanking: 7, usNewsRanking: 7, website: "https://www.washington.edu", greRequired: false, toeflMinimum: 92 },
  { name: "University of Michigan", shortName: "UMich", location: "Ann Arbor, MI", state: "MI", csRanking: 8, usNewsRanking: 9, website: "https://umich.edu", greRequired: false, toeflMinimum: 84 },
  { name: "Cornell University", shortName: "Cornell", location: "Ithaca, NY", state: "NY", csRanking: 9, usNewsRanking: 6, website: "https://www.cornell.edu", greRequired: false, toeflMinimum: 100 },
  { name: "University of California, San Diego", shortName: "UCSD", location: "La Jolla, CA", state: "CA", csRanking: 10, usNewsRanking: 12, website: "https://ucsd.edu", greRequired: false, toeflMinimum: 85 },
  { name: "Princeton University", shortName: "Princeton", location: "Princeton, NJ", state: "NJ", csRanking: 11, usNewsRanking: 10, website: "https://www.princeton.edu", greRequired: true, toeflMinimum: 100 },
  { name: "University of Texas at Austin", shortName: "UT Austin", location: "Austin, TX", state: "TX", csRanking: 12, usNewsRanking: 11, website: "https://www.utexas.edu", greRequired: false, toeflMinimum: 79 },
  { name: "University of California, Los Angeles", shortName: "UCLA", location: "Los Angeles, CA", state: "CA", csRanking: 13, usNewsRanking: 14, website: "https://www.ucla.edu", greRequired: false, toeflMinimum: 87 },
  { name: "Columbia University", shortName: "Columbia", location: "New York, NY", state: "NY", csRanking: 14, usNewsRanking: 15, website: "https://www.columbia.edu", greRequired: false, toeflMinimum: 100 },
  { name: "University of Maryland", shortName: "UMD", location: "College Park, MD", state: "MD", csRanking: 15, usNewsRanking: 16, website: "https://www.umd.edu", greRequired: false, toeflMinimum: 96 },
  { name: "University of Wisconsin-Madison", shortName: "UW-Madison", location: "Madison, WI", state: "WI", csRanking: 16, usNewsRanking: 13, website: "https://www.wisc.edu", greRequired: false, toeflMinimum: 92 },
  { name: "Harvard University", shortName: "Harvard", location: "Cambridge, MA", state: "MA", csRanking: 17, usNewsRanking: 17, website: "https://www.harvard.edu", greRequired: false, toeflMinimum: 100 },
  { name: "University of Pennsylvania", shortName: "UPenn", location: "Philadelphia, PA", state: "PA", csRanking: 18, usNewsRanking: 18, website: "https://www.upenn.edu", greRequired: false, toeflMinimum: 100 },
  { name: "Purdue University", shortName: "Purdue", location: "West Lafayette, IN", state: "IN", csRanking: 19, usNewsRanking: 20, website: "https://www.purdue.edu", greRequired: false, toeflMinimum: 80 },
  { name: "University of Massachusetts Amherst", shortName: "UMass", location: "Amherst, MA", state: "MA", csRanking: 20, usNewsRanking: 22, website: "https://www.umass.edu", greRequired: false, toeflMinimum: 80 },
  { name: "George Mason University", shortName: "GMU", location: "Fairfax, VA", state: "VA", csRanking: 67, usNewsRanking: 75, website: "https://www.gmu.edu", greRequired: false, toeflMinimum: 80 },
  { name: "University of Texas at Arlington", shortName: "UTA", location: "Arlington, TX", state: "TX", csRanking: 95, usNewsRanking: 100, website: "https://www.uta.edu", greRequired: false, toeflMinimum: 79 },
  { name: "Texas Tech University", shortName: "TTU", location: "Lubbock, TX", state: "TX", csRanking: 120, usNewsRanking: 130, website: "https://www.ttu.edu", greRequired: false, toeflMinimum: 79 },
  { name: "Virginia Tech", shortName: "VT", location: "Blacksburg, VA", state: "VA", csRanking: 25, usNewsRanking: 28, website: "https://www.vt.edu", greRequired: false, toeflMinimum: 90 },
  { name: "Ohio State University", shortName: "OSU", location: "Columbus, OH", state: "OH", csRanking: 30, usNewsRanking: 30, website: "https://www.osu.edu", greRequired: false, toeflMinimum: 79 },
];

const demoProfessors = [
  {
    name: "Dr. Xiang Li",
    email: "xli@gmu.edu",
    title: "Assistant Professor",
    department: "Computer Science",
    universityShortName: "GMU",
    researchAreas: ["Trustworthy AI", "Neural Network Verification", "Formal Methods", "AI Safety"],
    researchSummary: "Dr. Li's research focuses on developing formal verification techniques for neural networks, with applications in safety-critical systems. Her recent work combines abstract interpretation with constraint solving to provide provable guarantees about neural network behavior.",
    hIndex: 28,
    citations: 3200,
    recentPaperCount: 12,
    hasActiveFunding: true,
    lookingForStudents: true,
    currentPhDStudents: 4,
    graduatedPhDStudents: 2,
    internationalStudents: true,
    fundingScore: 88,
    responsivenessScore: 75,
    dataQuality: "HIGH" as const,
    labName: "ROARS Lab",
  },
  {
    name: "Dr. Sarah Chen",
    email: "schen@uta.edu",
    title: "Associate Professor",
    department: "Computer Science",
    universityShortName: "UTA",
    researchAreas: ["Adversarial Robustness", "Deep Learning", "Computer Vision"],
    researchSummary: "Dr. Chen's research focuses on understanding and improving the robustness of deep learning models against adversarial attacks, with applications in computer vision and autonomous driving.",
    hIndex: 42,
    citations: 5800,
    recentPaperCount: 15,
    hasActiveFunding: false,
    lookingForStudents: true,
    currentPhDStudents: 6,
    graduatedPhDStudents: 4,
    internationalStudents: true,
    fundingScore: 45,
    responsivenessScore: 60,
    dataQuality: "MEDIUM" as const,
    labName: "Secure AI Lab",
  },
  {
    name: "Dr. Wei Zhang",
    email: "wzhang@ttu.edu",
    title: "Assistant Professor",
    department: "Electrical & Computer Engineering",
    universityShortName: "TTU",
    researchAreas: ["AI Safety", "Reinforcement Learning", "Robotics"],
    researchSummary: "Dr. Zhang works on safe reinforcement learning algorithms for robotic systems. His lab develops methods to ensure that learned policies satisfy safety constraints during both training and deployment.",
    hIndex: 19,
    citations: 1500,
    recentPaperCount: 8,
    hasActiveFunding: true,
    lookingForStudents: false,
    currentPhDStudents: 3,
    graduatedPhDStudents: 0,
    internationalStudents: true,
    fundingScore: 76,
    responsivenessScore: 80,
    dataQuality: "MEDIUM" as const,
    labName: "Safe Robotics Lab",
  },
  {
    name: "Dr. Maria Rodriguez",
    email: "mrodriguez@umich.edu",
    title: "Professor",
    department: "Computer Science",
    universityShortName: "UMich",
    researchAreas: ["Machine Learning", "Trustworthy AI", "Fairness", "Algorithmic Decision Making"],
    researchSummary: "Dr. Rodriguez is a leading researcher in fair and trustworthy machine learning. Her work addresses bias in algorithmic decision-making systems and develops methods to ensure equitable outcomes.",
    hIndex: 65,
    citations: 15000,
    recentPaperCount: 20,
    hasActiveFunding: true,
    lookingForStudents: true,
    currentPhDStudents: 8,
    graduatedPhDStudents: 12,
    internationalStudents: true,
    fundingScore: 92,
    responsivenessScore: 40,
    dataQuality: "HIGH" as const,
    labName: "Responsible AI Lab",
  },
  {
    name: "Dr. James Park",
    email: "jpark@vt.edu",
    title: "Associate Professor",
    department: "Computer Science",
    universityShortName: "VT",
    researchAreas: ["NLP", "Large Language Models", "AI Safety", "Information Retrieval"],
    researchSummary: "Dr. Park's research focuses on the safety and reliability of large language models. His group develops techniques for detecting and mitigating hallucinations, biases, and safety violations in LLM outputs.",
    hIndex: 35,
    citations: 4200,
    recentPaperCount: 14,
    hasActiveFunding: true,
    lookingForStudents: true,
    currentPhDStudents: 5,
    graduatedPhDStudents: 3,
    internationalStudents: true,
    fundingScore: 80,
    responsivenessScore: 70,
    dataQuality: "HIGH" as const,
    labName: "Safe NLP Lab",
  },
];

async function main() {
  console.log("Seeding database...");

  // Seed universities
  for (const uni of universities) {
    await prisma.university.upsert({
      where: { name: uni.name },
      update: uni,
      create: uni,
    });
  }
  console.log(`Seeded ${universities.length} universities`);

  // Seed demo professors
  for (const prof of demoProfessors) {
    const university = await prisma.university.findFirst({
      where: { shortName: prof.universityShortName },
    });

    if (!university) continue;

    const { universityShortName, labName, ...profData } = prof;

    await prisma.professor.create({
      data: {
        ...profData,
        labName,
        universityId: university.id,
      },
    });
  }
  console.log(`Seeded ${demoProfessors.length} demo professors`);

  // Seed demo grants for funded professors
  const fundedProfessors = await prisma.professor.findMany({
    where: { hasActiveFunding: true },
  });

  for (const prof of fundedProfessors) {
    await prisma.fundingGrant.create({
      data: {
        title: `CAREER: Research in ${prof.researchAreas[0]}`,
        agency: "NSF",
        awardNumber: `CNS-${2023000 + Math.floor(Math.random() * 1000)}`,
        amount: 500000 + Math.floor(Math.random() * 500000),
        startDate: new Date("2024-01-01"),
        endDate: new Date("2028-12-31"),
        status: "Active",
        professorId: prof.id,
      },
    });
  }
  console.log(`Seeded grants for ${fundedProfessors.length} professors`);

  // Seed demo publications
  const allProfessors = await prisma.professor.findMany();
  for (const prof of allProfessors) {
    const venues = ["NeurIPS", "ICML", "ICLR", "AAAI", "CVPR", "ACL", "USENIX Security"];
    for (let i = 0; i < 3; i++) {
      await prisma.publication.create({
        data: {
          title: `${prof.researchAreas[0]} Research Paper ${i + 1}`,
          authors: [prof.name.replace("Dr. ", ""), "Co-Author A", "Co-Author B"],
          venue: venues[Math.floor(Math.random() * venues.length)] + ` ${2024 + Math.floor(Math.random() * 2)}`,
          year: 2024 + Math.floor(Math.random() * 2),
          abstract: `This paper presents novel approaches to ${prof.researchAreas.join(" and ").toLowerCase()}.`,
          citationCount: Math.floor(Math.random() * 100),
          professorId: prof.id,
        },
      });
    }
  }
  console.log(`Seeded publications for ${allProfessors.length} professors`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
