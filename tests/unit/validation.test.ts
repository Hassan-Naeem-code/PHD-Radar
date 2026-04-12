import {
  searchSchema,
  signupSchema,
  loginSchema,
  applicationSchema,
  profileSchema,
} from "@/utils/validation";

describe("searchSchema", () => {
  it("accepts valid search query", () => {
    expect(searchSchema.parse({ query: "trustworthy AI" })).toBeTruthy();
  });

  it("rejects empty query", () => {
    expect(() => searchSchema.parse({ query: "" })).toThrow();
  });

  it("rejects single character", () => {
    expect(() => searchSchema.parse({ query: "a" })).toThrow();
  });

  it("accepts query with filters", () => {
    const result = searchSchema.parse({
      query: "machine learning",
      filters: { fundingRequired: true, rankingMax: 50 },
    });
    expect(result.filters?.fundingRequired).toBe(true);
  });
});

describe("signupSchema", () => {
  it("accepts valid signup data", () => {
    const result = signupSchema.parse({
      name: "Test User",
      email: "test@example.com",
      password: "StrongPass1",
    });
    expect(result.email).toBe("test@example.com");
  });

  it("rejects weak password", () => {
    expect(() =>
      signupSchema.parse({ name: "Test", email: "a@b.com", password: "weak" })
    ).toThrow();
  });

  it("rejects password without uppercase", () => {
    expect(() =>
      signupSchema.parse({ name: "Test", email: "a@b.com", password: "nouppercas1" })
    ).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      signupSchema.parse({ name: "Test", email: "notanemail", password: "Strong1a" })
    ).toThrow();
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    expect(loginSchema.parse({ email: "a@b.com", password: "pass" })).toBeTruthy();
  });

  it("rejects empty password", () => {
    expect(() => loginSchema.parse({ email: "a@b.com", password: "" })).toThrow();
  });
});

describe("applicationSchema", () => {
  it("accepts valid application", () => {
    const result = applicationSchema.parse({
      universityName: "MIT",
      program: "PhD CS",
      term: "Fall 2027",
    });
    expect(result.universityName).toBe("MIT");
  });

  it("rejects missing required fields", () => {
    expect(() =>
      applicationSchema.parse({ universityName: "", program: "PhD", term: "Fall" })
    ).toThrow();
  });
});

describe("profileSchema", () => {
  it("accepts valid profile", () => {
    expect(profileSchema.parse({ name: "Test" })).toBeTruthy();
  });

  it("rejects GPA over 4.0", () => {
    expect(() => profileSchema.parse({ name: "Test", gpa: 5.0 })).toThrow();
  });

  it("accepts empty optional URL as empty string", () => {
    expect(profileSchema.parse({ name: "Test", linkedinUrl: "" })).toBeTruthy();
  });
});
