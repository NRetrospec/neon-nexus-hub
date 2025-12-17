import { mutation } from "./_generated/server";

/**
 * Seed Legal Documents
 *
 * This function initializes the legal documents in the database.
 * Run this ONCE when setting up the platform.
 *
 * Usage:
 * 1. Deploy your Convex functions
 * 2. Run this mutation from Convex dashboard or via API
 * 3. Verify documents are created with isActive=true
 *
 * IMPORTANT: Update the content below with your actual legal documents
 */
export const seedLegalDocuments = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if documents already exist
    const existingTerms = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_version", (q) =>
        q.eq("documentType", "terms_of_service").eq("version", "1.0.0")
      )
      .first();

    if (existingTerms) {
      return { message: "Legal documents already seeded", skipped: true };
    }

    // Terms of Service Content (HTML format for rich display)
    const termsContent = `
<h1>Terms of Service</h1>

<p><strong>Version:</strong> 1.0.0<br>
<strong>Effective Date:</strong> January 1, 2025</p>

<h2>1. ACCEPTANCE OF TERMS</h2>
<p>By accessing or using the Neon Nexus gaming platform, you agree to be bound by these Terms of Service. <strong>IF YOU DO NOT AGREE, DO NOT USE THIS SERVICE.</strong></p>

<h2>2. ELIGIBILITY AND AGE REQUIREMENTS</h2>
<p>You must be at least 13 years of age to use this Service. Users under 18 must have parental consent.</p>

<h2>3. LICENSE AND OWNERSHIP</h2>
<p>You grant us a <strong>worldwide, perpetual, irrevocable, transferable, sublicensable, royalty-free license</strong> to use your content for operating, promoting, and improving the Service, and for any business purpose, including sale or transfer of the company.</p>

<h2>4. VIRTUAL CURRENCY AND XP</h2>
<p>XP, points, badges, and virtual items <strong>have no real-world monetary value</strong> and cannot be exchanged for cash. Purchases are <strong>final and non-refundable</strong>.</p>

<h2>5. CONTENT MODERATION</h2>
<p>We reserve the right to review, monitor, edit, or remove any user content at any time, for any reason, without notice.</p>

<h2>6. PRIVACY AND DATA USE</h2>
<p>By using the Service, you grant us the right to:</p>
<ul>
  <li>Collect, process, and analyze your usage data</li>
  <li>Aggregate and anonymize your data for analytics</li>
  <li><strong>Sell, license, or monetize aggregated or anonymized data</strong></li>
  <li>Share data with third parties for business purposes</li>
  <li>Use data to train AI and machine learning models</li>
</ul>

<h2>7. DISCLAIMERS AND LIMITATION OF LIABILITY</h2>
<p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES. <strong>WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.</strong></p>
<p><strong>OUR TOTAL LIABILITY SHALL NOT EXCEED $100 OR THE AMOUNT YOU PAID IN THE PAST 12 MONTHS.</strong></p>

<h2>8. INDEMNIFICATION</h2>
<p>You agree to <strong>indemnify and hold harmless</strong> Neon Nexus Hub from any claims arising from your use of the Service or violation of these Terms.</p>

<h2>9. DISPUTE RESOLUTION AND ARBITRATION</h2>
<p><strong>ANY DISPUTES SHALL BE RESOLVED BY BINDING ARBITRATION, NOT IN COURT.</strong></p>
<p><strong>CLASS ACTION WAIVER:</strong> You waive the right to participate in class action lawsuits.</p>

<h2>10. TERMINATION</h2>
<p>We may terminate your account at any time, for any reason, with or without notice. Upon termination, you forfeit all virtual items and progress.</p>

<h2>11. ASSIGNMENT AND TRANSFER</h2>
<p><strong>We may freely assign these Terms in connection with a merger, acquisition, or sale of assets without your consent.</strong></p>

<h2>12. GOVERNING LAW</h2>
<p>These Terms are governed by the laws of the State of Delaware.</p>

<h2>13. MODIFICATIONS</h2>
<p>We may modify these Terms at any time. Material changes will require your re-acceptance.</p>

<hr>

<p><strong>BY CLICKING "I ACCEPT," YOU ACKNOWLEDGE THAT YOU HAVE READ AND AGREE TO THESE TERMS.</strong></p>

<p>For the complete Terms of Service, visit: <a href="/legal/terms">Full Terms Document</a></p>
<p>Contact: <a href="mailto:legal@neonnexus.com">legal@neonnexus.com</a></p>
    `.trim();

    // Privacy Policy Content (HTML format)
    const privacyContent = `
<h1>Privacy Policy</h1>

<p><strong>Version:</strong> 1.0.0<br>
<strong>Effective Date:</strong> January 1, 2025</p>

<h2>1. INFORMATION WE COLLECT</h2>

<h3>Information You Provide:</h3>
<ul>
  <li>Account information (name, email, date of birth)</li>
  <li>User-generated content (posts, messages, uploads)</li>
  <li>Payment information</li>
  <li>Communications and feedback</li>
</ul>

<h3>Automatically Collected:</h3>
<ul>
  <li>IP address, device identifiers, browser type</li>
  <li>Usage data (pages viewed, features used, time spent)</li>
  <li>Gaming data (progress, achievements, rankings)</li>
  <li>Location data (IP-based geolocation)</li>
  <li>Cookies and tracking technologies</li>
</ul>

<h3>From Third Parties:</h3>
<ul>
  <li>Authentication providers (Clerk)</li>
  <li>Analytics services (Google Analytics, Mixpanel)</li>
  <li>Data brokers (demographic data)</li>
</ul>

<h2>2. HOW WE USE YOUR INFORMATION</h2>
<ul>
  <li>Provide and improve the Service</li>
  <li>Personalize your experience</li>
  <li><strong>Analytics and insights</strong></li>
  <li><strong>Marketing and advertising</strong></li>
  <li><strong>Monetization: Aggregate, anonymize, and sell data</strong></li>
  <li><strong>AI Training: Train machine learning models</strong></li>
  <li>Legal compliance and security</li>
  <li><strong>Corporate transactions: Facilitate mergers and acquisitions</strong></li>
</ul>

<h2>3. HOW WE SHARE YOUR INFORMATION</h2>
<ul>
  <li><strong>Service Providers:</strong> Clerk, Convex, analytics tools, payment processors</li>
  <li><strong>Advertising Partners:</strong> Google Ads, Facebook Ads</li>
  <li><strong>Data Buyers:</strong> We may sell aggregated/anonymized data to research firms, advertisers, and analytics companies</li>
  <li><strong>Legal Requirements:</strong> Comply with subpoenas and legal process</li>
  <li><strong>Business Transfers:</strong> Your data may be transferred in a merger or acquisition</li>
</ul>

<h2>4. COOKIES AND TRACKING</h2>
<p>We use cookies for authentication, analytics, and targeted advertising. You can control cookies via browser settings.</p>

<h2>5. DATA RETENTION</h2>
<ul>
  <li>Account data: Until deletion</li>
  <li>Legal consent records: <strong>Indefinitely</strong> (for legal defense)</li>
  <li>Usage data: 7 years</li>
  <li>Anonymized data: <strong>Indefinitely</strong></li>
</ul>

<h2>6. YOUR PRIVACY RIGHTS</h2>

<h3>California Residents (CCPA):</h3>
<ul>
  <li>Right to know what data we collect</li>
  <li>Right to delete your data</li>
  <li><strong>Right to opt-out of data sale</strong></li>
  <li>Non-discrimination</li>
</ul>

<p><strong><a href="/legal/opt-out">DO NOT SELL MY PERSONAL INFORMATION</a></strong></p>

<h3>European Residents (GDPR):</h3>
<ul>
  <li>Right to access, rectify, erase, and port data</li>
  <li>Right to object to processing</li>
  <li>Right to lodge a complaint</li>
</ul>

<h2>7. CHILDREN'S PRIVACY (COPPA)</h2>
<p>We do not collect data from children under 13 without verified parental consent. Parents may review, delete, or refuse collection of their child's information.</p>

<h2>8. DATA SECURITY</h2>
<p>We use encryption, access controls, and security audits. However, <strong>no system is 100% secure</strong>, and we cannot guarantee absolute security.</p>

<h2>9. INTERNATIONAL TRANSFERS</h2>
<p>Your data may be transferred to the US. <strong>By using the Service, you consent to this transfer.</strong></p>

<h2>10. CHANGES TO POLICY</h2>
<p>We may update this Policy at any time. Material changes will require your re-consent.</p>

<h2>11. CONTACT US</h2>
<p>Email: <a href="mailto:privacy@neonnexus.com">privacy@neonnexus.com</a><br>
Data Requests: <a href="mailto:privacy@neonnexus.com">privacy@neonnexus.com</a></p>

<hr>

<h3>SUMMARY OF KEY POINTS:</h3>
<ul>
  <li><strong>What We Collect:</strong> Account info, usage data, location, content</li>
  <li><strong>How We Use It:</strong> Service provision, analytics, marketing, <strong>data monetization</strong></li>
  <li><strong>Who We Share With:</strong> Providers, advertisers, <strong>data buyers</strong>, acquirers</li>
  <li><strong>Your Rights:</strong> Access, delete, opt-out</li>
  <li><strong>Data Sale:</strong> We may sell anonymized data. California residents can opt out.</li>
</ul>

<p><strong>BY USING THE SERVICE, YOU CONSENT TO OUR DATA PRACTICES.</strong></p>

<p>For the complete Privacy Policy, visit: <a href="/legal/privacy">Full Privacy Policy</a></p>
    `.trim();

    // Insert Terms of Service
    const termsId = await ctx.db.insert("legalDocuments", {
      documentType: "terms_of_service",
      version: "1.0.0",
      content: termsContent,
      effectiveDate: Date.now(),
      materialChange: false, // First version, no prior changes
      changesSummary: "Initial Terms of Service",
      createdAt: Date.now(),
      createdBy: "system",
      isActive: true,
    });

    // Insert Privacy Policy
    const privacyId = await ctx.db.insert("legalDocuments", {
      documentType: "privacy_policy",
      version: "1.0.0",
      content: privacyContent,
      effectiveDate: Date.now(),
      materialChange: false, // First version, no prior changes
      changesSummary: "Initial Privacy Policy",
      createdAt: Date.now(),
      createdBy: "system",
      isActive: true,
    });

    // Log the seeding
    await ctx.db.insert("consentAuditLog", {
      eventType: "version_updated",
      timestamp: Date.now(),
      documentVersion: "1.0.0",
      eventData: JSON.stringify({
        action: "initial_seed",
        termsId,
        privacyId,
      }),
    });

    return {
      success: true,
      message: "Legal documents seeded successfully",
      termsId,
      privacyId,
      version: "1.0.0",
    };
  },
});

/**
 * Helper function to update legal documents (for admins)
 * This creates a new version and requires re-acceptance if materialChange=true
 */
export const publishNewVersion = mutation({
  args: {},
  handler: async (ctx) => {
    // Example of publishing Terms v2.0.0
    // In production, this would be called from an admin panel

    const newTermsVersion = "2.0.0";

    // Check if version already exists
    const existing = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_version", (q) =>
        q.eq("documentType", "terms_of_service").eq("version", newTermsVersion)
      )
      .first();

    if (existing) {
      return { message: "Version already exists", skipped: true };
    }

    // Deactivate current version
    const currentActive = await ctx.db
      .query("legalDocuments")
      .withIndex("by_type_and_active", (q) =>
        q.eq("documentType", "terms_of_service").eq("isActive", true)
      )
      .first();

    if (currentActive) {
      await ctx.db.patch(currentActive._id, { isActive: false });
    }

    // Insert new version (update content as needed)
    const newTermsContent = `
<!-- Updated Terms Content Here -->
<h1>Terms of Service v2.0.0</h1>
<p><strong>IMPORTANT CHANGES:</strong> We have updated our data sharing policies...</p>
<!-- Include full updated terms -->
    `.trim();

    await ctx.db.insert("legalDocuments", {
      documentType: "terms_of_service",
      version: newTermsVersion,
      content: newTermsContent,
      effectiveDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days notice
      materialChange: true, // Requires re-acceptance
      changesSummary:
        "Updated data sharing policies, added new arbitration clause",
      createdAt: Date.now(),
      createdBy: "admin@example.com",
      isActive: true,
    });

    return { success: true, version: newTermsVersion };
  },
});
