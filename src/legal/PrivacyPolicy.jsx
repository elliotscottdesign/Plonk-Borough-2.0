import React, { useEffect } from 'react'
import LegalLayout, { H2, H3, P, UL, LI, Strong, A, Table } from './LegalLayout.jsx'

// PrivacyPolicy — UK GDPR / ICO-aligned policy for nodice.bar.
//
// Drafted to match what this site ACTUALLY does (not boilerplate). Key
// honest disclosures:
//   • No analytics, no marketing pixels, no behavioural tracking
//   • One single piece of data collected via user action: the email
//     they type into the waitlist signup form
//   • Two processors only: Google Workspace (Sheets + Apps Script +
//     Gmail) and GitHub Pages (static hosting)
//   • Cookie footprint = one local-storage preference (banner choice)
//
// Placeholders that need the founder to fill in before going live:
//   • [COMPANY NUMBER]  — Companies House number for No Dice Bars Ltd
//   • [REGISTERED ADDRESS] — registered office address
//
// ICO registration: any UK business processing personal data must
// register with the ICO (£40-60/yr unless exempt). For a waitlist with
// no automated decisions and no special-category data, the £40 micro
// tier applies. The policy doesn't have to reference an ICO reference
// number, but it's good practice once registered.

export default function PrivacyPolicy() {
  // Set the document title for the tab + share previews.
  useEffect(() => {
    const prev = document.title
    document.title = 'Privacy Policy — No Dice'
    return () => { document.title = prev }
  }, [])

  return (
    <LegalLayout eyebrow="Privacy & Data" title="Privacy Policy" lastUpdated="20 May 2026">

      <P>
        This policy explains what personal data we collect through this website, why, who we share it with, how long we keep it, and what rights you have under UK data protection law. Email <A href="mailto:elliot@nodice.bar">elliot@nodice.bar</A> if anything here is unclear.
      </P>

      <H2>1. Who we are</H2>
      <P>
        nodice.bar is operated by <Strong>No Dice Bars Ltd</Strong> ("we", "us", "our"), a company registered in England and Wales (company number <Strong>[COMPANY NUMBER TBC]</Strong>). Our registered office is <Strong>[REGISTERED ADDRESS TBC]</Strong>. Our first trading venue is at London Fields, E8 3PH.
      </P>
      <P>
        For the purposes of the UK GDPR and the Data Protection Act 2018, No Dice Bars Ltd is the <Em>data controller</Em> for personal data collected through this website.
      </P>

      <H2>2. What this policy covers</H2>
      <P>
        This policy applies to the <Strong>public-facing nodice.bar website only</Strong>. Our password-protected investor area (at /borough and /hackney) is governed by separate Investors' Agreements with each named investor; the data handling there is described in those agreements.
      </P>

      <H2>3. What we collect</H2>
      <P>The only personal data we collect through this website is:</P>
      <UL>
        <LI><Strong>The email address you submit through the signup form</Strong>, which you provide voluntarily when you click "Notify me" to join the opening-night waitlist.</LI>
        <LI><Strong>Basic technical information</Strong> captured automatically when the form is submitted: timestamp, your browser's user-agent string, and the referring page (if any).</LI>
      </UL>
      <P>
        We <Strong>do not</Strong> use Google Analytics or any other analytics tool, we do not use Meta / TikTok / LinkedIn or any other marketing pixels, we do not use behavioural tracking, browser fingerprinting, or session recording, and we do not buy or sell mailing lists.
      </P>

      <H2>4. Why we collect it (our lawful basis)</H2>
      <P>
        We rely on <Strong>consent</Strong> (UK GDPR Article 6(1)(a)) for processing the email address you submit. You give consent by typing your email and pressing "Notify me". You can withdraw consent at any time (see section 8).
      </P>
      <P>
        We process the technical information (timestamp, user-agent, referrer) under <Strong>legitimate interest</Strong> (Article 6(1)(f)) for the limited purposes of de-duplicating signups, diagnosing technical issues, and understanding which referring sites people are coming from.
      </P>

      <H2>5. What we use it for</H2>
      <P>The email address you submit is used <Strong>only</Strong> to:</P>
      <UL>
        <LI>Send you notification(s) about the opening of the venue and pre-opening details</LI>
        <LI>Send occasional updates between now and the opening (no more than one per month)</LI>
        <LI>Action your unsubscribe request if you ask to be removed</LI>
      </UL>
      <P>
        We do not use your email for any other marketing or commercial purpose. We do not sell it, share it with advertisers, or pass it to third parties for their own marketing.
      </P>

      <H2>6. Who we share it with (our processors)</H2>
      <P>
        We share your data with the following <Em>data processors</Em> in order to operate the website:
      </P>
      <Table
        headers={['Processor', 'Purpose', 'Location']}
        rows={[
          ['Google LLC (Workspace)', 'Email storage (Google Sheets), notification emails (Gmail), form endpoint (Apps Script)', 'UK / EU / US (SCCs + UK–US Data Bridge)'],
          ['GitHub, Inc. (GitHub Pages)', 'Static website hosting', 'UK / EU / US (Standard Contractual Clauses)'],
        ]}
      />
      <P>
        Both Google and GitHub operate under UK GDPR-compliant data processing terms with us. Neither sub-processes your data for their own purposes.
      </P>
      <P>
        We do <Strong>not</Strong> share your data with marketing networks, advertisers, data brokers, or any other third party.
      </P>

      <H2>7. International transfers</H2>
      <P>
        Some of our processors store data outside the UK (in the EU or US). When data is transferred outside the UK, the transfer is protected by one of:
      </P>
      <UL>
        <LI>The UK adequacy decision for the EU / EEA</LI>
        <LI>The UK–US Data Bridge (extension of the EU–US Data Privacy Framework)</LI>
        <LI>Standard Contractual Clauses with the UK International Data Transfer Addendum</LI>
      </UL>
      <P>
        You can request a copy of the safeguards in place by emailing <A href="mailto:elliot@nodice.bar">elliot@nodice.bar</A>.
      </P>

      <H2>8. How long we keep it</H2>
      <Table
        headers={['Data', 'Retention']}
        rows={[
          ['Waitlist signups', 'Until 3 months after opening night, then deleted in bulk'],
          ['Customer-support correspondence', '2 years from the last interaction, then deleted'],
          ['Accounting records (where applicable)', '6 years (UK accounting law)'],
        ]}
      />
      <P>
        If you ask us to delete your data sooner, we will (see section 9).
      </P>

      <H2>9. Your rights</H2>
      <P>You have the following rights under UK GDPR:</P>
      <UL>
        <LI><Strong>Right of access</Strong> — ask what data we hold about you. We'll send you a copy within 30 days, free of charge.</LI>
        <LI><Strong>Right to rectification</Strong> — correct any inaccurate data.</LI>
        <LI><Strong>Right to erasure</Strong> — ask us to delete your data. We'll action within 30 days.</LI>
        <LI><Strong>Right to restriction</Strong> — ask us to limit how we process your data.</LI>
        <LI><Strong>Right to object</Strong> — object to our processing (especially relevant for direct marketing — we'll stop immediately).</LI>
        <LI><Strong>Right to data portability</Strong> — receive your data in a machine-readable format.</LI>
        <LI><Strong>Right to withdraw consent</Strong> — at any time, without affecting processing already carried out before withdrawal.</LI>
      </UL>
      <P>
        To exercise any of these rights, email <A href="mailto:elliot@nodice.bar?subject=Privacy%20request">elliot@nodice.bar</A> with the subject line "Privacy request". We will respond within 30 days.
      </P>

      <H2>10. Right to complain</H2>
      <P>
        You also have the right to lodge a complaint with the <Strong>Information Commissioner's Office (ICO)</Strong>:
      </P>
      <UL>
        <LI>Website: <A href="https://ico.org.uk" external>ico.org.uk</A></LI>
        <LI>Phone: 0303 123 1113</LI>
        <LI>Post: Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF</LI>
      </UL>
      <P>
        We'd appreciate the chance to put things right first, but you don't have to come to us before going to the ICO.
      </P>

      <H2>11. Cookies and local storage</H2>
      <P>
        We use <Strong>no tracking cookies and no marketing cookies</Strong> on this site.
      </P>
      <P>
        We store <Strong>one preference in your browser's local storage</Strong> — the choice you make in our cookie / privacy banner (accepted or rejected). This avoids us asking you again on every visit. Clearing your browser data removes it. You can also reset it via the "Cookie settings" link in the homepage footer.
      </P>
      <P>
        The signup form itself does not set cookies. Google Fonts (which we use to serve the typefaces) may set short-lived technical cookies on the <Em>fonts.gstatic.com</Em> domain when your browser loads the font files; these are outside our control and contain no identifying information.
      </P>

      <H2>12. Security</H2>
      <P>
        Personal data is held in Google Workspace and on GitHub Pages, both of which provide enterprise-grade encryption in transit (TLS) and at rest (AES-256), and hold ISO 27001 and SOC 2 certifications. The Workspace account holding the data is protected by two-factor authentication and access is limited to the company director.
      </P>
      <P>
        No system is perfectly secure. If we ever become aware of a personal data breach that's likely to result in a risk to your rights and freedoms, we will notify the ICO within 72 hours and, if the risk is high, notify affected individuals directly as required by Article 34 UK GDPR.
      </P>

      <H2>13. Children's data</H2>
      <P>
        This website is not aimed at children under 18 (the venue is licensed for over-18s only). We don't knowingly collect personal data from anyone under 18. If you believe we've collected data from a minor, email <A href="mailto:elliot@nodice.bar">elliot@nodice.bar</A> and we'll delete it immediately.
      </P>

      <H2>14. Changes to this policy</H2>
      <P>
        If we make material changes to this policy, we'll update the "Last updated" date at the top and, if the changes affect you (for example, a new processor handling your data), we'll email any waitlist subscribers to let them know before the change takes effect.
      </P>

      <H2>15. Contact</H2>
      <P>
        For any privacy question, email <A href="mailto:elliot@nodice.bar">elliot@nodice.bar</A>.
      </P>

    </LegalLayout>
  )
}
