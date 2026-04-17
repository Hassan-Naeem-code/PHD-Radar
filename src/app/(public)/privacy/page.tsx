import Link from "next/link";
import { Radar } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Radar className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold">PhDRadar</span>
          </Link>
        </div>
      </nav>
      <article className="max-w-4xl mx-auto px-4 py-12 prose prose-gray">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: April 12, 2026</p>

        <h2>1. Introduction</h2>
        <p>Shammas Development LLC (&quot;we&quot;, &quot;us&quot;) operates PhDRadar. This Privacy Policy explains how we collect, use, and protect your personal information in compliance with GDPR and applicable data protection laws.</p>

        <h2>2. Data We Collect</h2>
        <h3>Account Information</h3>
        <ul>
          <li>Name, email address</li>
          <li>Authentication data (password hash, OAuth tokens)</li>
        </ul>
        <h3>Profile Information (voluntarily provided)</h3>
        <ul>
          <li>Education history, GPA, research interests</li>
          <li>Skills, industry experience</li>
          <li>Uploaded documents (CV, transcripts)</li>
          <li>PhD application preferences</li>
        </ul>
        <h3>Usage Data</h3>
        <ul>
          <li>Search queries, saved professors, application tracking data</li>
          <li>Outreach email drafts and tracking status</li>
          <li>Page views, feature usage (via PostHog analytics)</li>
        </ul>
        <h3>Technical Data</h3>
        <ul>
          <li>IP address, browser type, device information</li>
          <li>Cookies and session data</li>
        </ul>

        <h2>3. How We Use Your Data</h2>
        <ul>
          <li><strong>Service delivery:</strong> Professor matching, AI email generation, application tracking</li>
          <li><strong>Personalization:</strong> Research fit scoring based on your profile</li>
          <li><strong>Communication:</strong> Deadline reminders, follow-up alerts, account notifications</li>
          <li><strong>Improvement:</strong> Anonymous usage analytics to improve the product</li>
          <li><strong>Security:</strong> Fraud prevention, abuse detection</li>
        </ul>

        <h2>4. Data We Do NOT Collect</h2>
        <ul>
          <li>Actual academic records or transcripts (we only store metadata and uploaded files you choose to share)</li>
          <li>Emails you send to professors (we draft them; you send from your own email client)</li>
          <li>Payment card numbers (handled by Stripe)</li>
        </ul>

        <h2>5. Data Sharing</h2>
        <p>We do NOT sell your personal data. We share data only with:</p>
        <ul>
          <li><strong>Service providers:</strong> Supabase (database), Stripe (payments), Resend (emails), Vercel (hosting), Sentry (error tracking)</li>
          <li><strong>AI providers:</strong> Anthropic (Claude API) — your research profile is sent for matching/email generation. See Anthropic&apos;s privacy policy.</li>
          <li><strong>AI providers:</strong> OpenAI — research text is sent to generate semantic embeddings for vector search. Only text content is sent, not personal identifiers. See OpenAI&apos;s data usage policy.</li>
          <li><strong>Vector storage:</strong> Pinecone — semantic vectors (numerical representations of research text, not raw text) are stored for search functionality. See Pinecone&apos;s privacy policy.</li>
          <li><strong>Legal requirements:</strong> If required by law or legal process.</li>
        </ul>

        <h2>6. Your Rights (GDPR)</h2>
        <ul>
          <li><strong>Access:</strong> Export all your data at any time from Settings &gt; Export All Data</li>
          <li><strong>Rectification:</strong> Update your profile at any time</li>
          <li><strong>Erasure:</strong> Delete your account and all data from Settings &gt; Delete Account</li>
          <li><strong>Portability:</strong> Download your data in CSV/JSON format</li>
          <li><strong>Objection:</strong> Opt out of marketing emails at any time via Settings &gt; Email Preferences or the one-click unsubscribe link in any email</li>
        </ul>

        <h2>7. Data Retention</h2>
        <ul>
          <li>Active accounts: Data retained while account is active</li>
          <li>Deleted accounts: All personal data permanently deleted within 30 days</li>
          <li>Audit logs: Retained for 1 year for security purposes</li>
        </ul>

        <h2>8. Cookies</h2>
        <ul>
          <li><strong>Essential cookies:</strong> Authentication session (required for the Service to work)</li>
          <li><strong>Analytics cookies:</strong> PostHog (opt-in, can be declined via cookie consent banner)</li>
          <li>We do NOT use advertising or tracking cookies.</li>
        </ul>

        <h2>9. Security</h2>
        <ul>
          <li>Passwords hashed with bcrypt (12 rounds)</li>
          <li>All data encrypted in transit (TLS 1.3)</li>
          <li>Database encrypted at rest (AES-256 via Supabase)</li>
          <li>Regular security audits and dependency scanning</li>
        </ul>

        <h2>10. Children</h2>
        <p>PhDRadar is not intended for users under 18. We do not knowingly collect data from minors.</p>

        <h2>11. Changes</h2>
        <p>We may update this policy. Significant changes will be communicated via email.</p>

        <h2>12. Contact</h2>
        <p>Data Protection Officer: <a href="mailto:privacy@phdradar.com" className="text-primary">privacy@phdradar.com</a></p>
        <p>Shammas Development LLC</p>
      </article>
    </div>
  );
}
