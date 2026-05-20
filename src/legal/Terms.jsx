import React, { useEffect } from 'react'
import LegalLayout, { H2, P, UL, LI, Strong, Em, A } from './LegalLayout.jsx'

// Terms — website terms of use for nodice.bar.
//
// Scoped narrowly to the PUBLIC marketing site + waitlist signup. The
// password-protected investor area is governed by individual Investors'
// Agreements, NOT these terms — section 2 makes that explicit so we
// don't accidentally conflict with the investor-side contract.
//
// Key inclusions for a UK consumer-facing landing:
//   • Company identity (Companies Act 2006 §1064 — company info on website)
//   • Permitted / prohibited use
//   • IP ownership of logo, photography, content
//   • Disclaimer on the opening date — explicitly NOT a reservation
//   • Liability cap (£100 — proportionate for a free marketing site;
//     consumer-rights-friendly carve-outs for death/personal injury/
//     fraud as required by UK law)
//   • Governing law: England & Wales
//
// Placeholders to fill in before going live:
//   • [COMPANY NUMBER] — Companies House number
//   • [REGISTERED ADDRESS] — registered office

export default function Terms() {
  useEffect(() => {
    const prev = document.title
    document.title = 'Terms of Use — No Dice'
    return () => { document.title = prev }
  }, [])

  return (
    <LegalLayout eyebrow="Website Terms" title="Terms of Use" lastUpdated="20 May 2026">

      <P>
        These Terms of Use govern your access to and use of the public website at <A href="https://nodice.bar/">nodice.bar</A>. By using the site, you agree to these terms. If you don't agree, please don't use the site.
      </P>

      <H2>1. Who we are</H2>
      <P>
        nodice.bar is operated by <Strong>No Dice Hackney Ltd</Strong> (company number <Strong>[COMPANY NUMBER TBC]</Strong>), trading as <Em>No Dice</Em>. Our registered office is <Strong>[REGISTERED ADDRESS TBC]</Strong>, London E8 3PH. You can contact us at <A href="mailto:elliot@nodice.bar">elliot@nodice.bar</A>.
      </P>

      <H2>2. What these terms cover</H2>
      <P>
        These terms apply to the <Strong>public marketing site at nodice.bar</Strong> (homepage, signup form, privacy and terms pages). The password-protected investor area at <Em>/borough</Em> and <Em>/hackney</Em> is governed by separate Investors' Agreements between us and each named investor — these terms <Strong>do not apply there</Strong>, and where the two conflict, the Investors' Agreement controls for that investor.
      </P>

      <H2>3. Permitted use</H2>
      <P>You may:</P>
      <UL>
        <LI>Browse the site and read its content</LI>
        <LI>Submit your own email address to the waitlist signup form</LI>
        <LI>Share the public URL of the site with others</LI>
      </UL>

      <H2>4. Prohibited use</H2>
      <P>You must <Strong>not</Strong>:</P>
      <UL>
        <LI>Submit anyone else's email address without their explicit permission</LI>
        <LI>Submit spam, automated, fake or large-volume signups</LI>
        <LI>Attempt to access the investor area without a valid access code issued by us</LI>
        <LI>Scrape, copy, mirror, or republish any part of the site (the dice logo, the photography, the text, the design) without our written permission</LI>
        <LI>Use the site for any unlawful, fraudulent, harassing, defamatory, or harmful purpose</LI>
        <LI>Probe, scan, stress-test, or attempt to circumvent the site's security measures</LI>
        <LI>Use bots, crawlers, or any automated means to interact with the signup form</LI>
        <LI>Frame, embed, or pass off the site's content as your own</LI>
      </UL>
      <P>
        Breach of these prohibitions may result in your IP being blocked, your signup being removed from the list, and (in serious cases) referral to law enforcement.
      </P>

      <H2>5. Intellectual property</H2>
      <P>
        All content on nodice.bar — the "No Dice" name and logo, the dice mark, all photography, design, copy, and code — is owned by No Dice Hackney Ltd or used under licence, and is protected by UK copyright, trade mark, and unregistered design rights.
      </P>
      <P>
        You may not reproduce, distribute, modify, or create derivative works from any of it without our prior written permission. The grant of permission to <Em>view</Em> the site does not grant permission to <Em>copy</Em> from it.
      </P>

      <H2>6. Disclaimers</H2>
      <P>The site is provided "as is" and we make no warranty that:</P>
      <UL>
        <LI><Strong>Opening date.</Strong> The advertised opening date is our planned date and is <Strong>subject to change</Strong> due to factors outside our reasonable control (licensing, building works, supplier delays, force majeure). Signing up to the waitlist is <Strong>not a reservation</Strong>, not a contract, and is no guarantee of admission on opening night.</LI>
        <LI><Strong>Pricing, menu and offers.</Strong> Any pricing, menu items, or offers shown on the site (when added) are indicative and subject to change without notice. Final terms are those displayed at the venue or at the point of sale.</LI>
        <LI><Strong>External links.</Strong> The site may link to third-party sites. We are not responsible for their content, terms, or privacy practices and linking does not imply endorsement.</LI>
        <LI><Strong>Site availability.</Strong> We don't guarantee the site will always be available, error-free, or virus-free. We may take it down for maintenance without notice.</LI>
      </UL>

      <H2>7. Limitation of liability</H2>
      <P>
        Subject to the next paragraph, and to the maximum extent permitted by law:
      </P>
      <UL>
        <LI>We exclude all implied warranties, conditions, and other terms not expressly stated here</LI>
        <LI>We're not liable for any indirect, consequential, or special losses arising from your use of (or inability to use) the site</LI>
        <LI>Our total liability for any direct loss arising from these terms or your use of the site is limited to <Strong>£100</Strong></LI>
      </UL>
      <P>
        <Strong>Nothing in these terms</Strong> limits our liability for: death or personal injury caused by our negligence; fraud or fraudulent misrepresentation; any other liability that cannot be excluded or limited under UK law (including your statutory rights as a consumer under the Consumer Rights Act 2015).
      </P>

      <H2>8. Privacy</H2>
      <P>
        Our handling of any personal data you submit is set out in our <A href="/privacy">Privacy Policy</A>. By using the signup form you confirm you have read it.
      </P>

      <H2>9. Cookies</H2>
      <P>
        We use no tracking cookies and no marketing cookies on this site. We store one preference in your browser's local storage (your choice in the cookie banner) — see the <A href="/privacy">Privacy Policy</A> for the full detail and the "Cookie settings" link in the homepage footer to change your choice.
      </P>

      <H2>10. Suspension and termination</H2>
      <P>
        We can withdraw or suspend access to the site, or remove your waitlist signup, at any time and at our discretion — for example, if we reasonably believe you've breached these terms. Termination doesn't affect either party's rights or obligations that accrued before termination.
      </P>

      <H2>11. Changes to these terms</H2>
      <P>
        We may update these terms from time to time. The current version is always at <A href="/terms">nodice.bar/terms</A> with the "Last updated" date at the top. Material changes (the kind that affect your rights) will be flagged on the homepage. By continuing to use the site after a change, you accept the updated terms.
      </P>

      <H2>12. Other</H2>
      <UL>
        <LI><Strong>Severability.</Strong> If any part of these terms is found to be unenforceable, the rest stays in force.</LI>
        <LI><Strong>No waiver.</Strong> If we don't enforce a right, that doesn't waive our ability to enforce it later.</LI>
        <LI><Strong>No assignment.</Strong> You can't transfer your rights under these terms to anyone else. We can assign ours to a successor or affiliate.</LI>
        <LI><Strong>Entire agreement.</Strong> These terms (plus the Privacy Policy) are the entire agreement between you and us in respect of the public website.</LI>
      </UL>

      <H2>13. Governing law and jurisdiction</H2>
      <P>
        These terms and any dispute or claim arising out of them or in connection with them are governed by the <Strong>laws of England and Wales</Strong>. The English courts have exclusive jurisdiction to settle any dispute.
      </P>

      <H2>14. Contact</H2>
      <P>
        For any question about these terms, email <A href="mailto:elliot@nodice.bar">elliot@nodice.bar</A>.
      </P>

    </LegalLayout>
  )
}
