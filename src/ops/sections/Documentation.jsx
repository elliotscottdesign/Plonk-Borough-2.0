import React from 'react'
import Roadmap from '../components/Roadmap.jsx'

// Documentation section — one home for live operational documents that staff
// download or that get link-shared to external parties (trade officials, sales
// reps, government agencies, media, insurers).
export default function Documentation() {
  return (
    <Roadmap
      title="Documentation"
      intro="One place for live operational documents — so when a sales rep, council officer, insurer or journalist asks for something, it's one link away instead of a scramble through old emails."
      sections={[
        { h: 'What it will hold', items: [
          'Insurance certificates (public liability, employers’ liability)',
          'Premises & alcohol licence, food hygiene rating',
          'Supplier details & previous-supplier references',
          'Health & safety / risk assessments, fire & PAT certs',
          'Press / media pack & approved assets',
          'Company / entity details for credit & account applications',
        ]},
        { h: 'How sharing will work', items: [
          'Staff: browse and download any current document',
          'External parties: send a single share link (no login needed)',
          'Always the live version — replace the file, the link stays the same',
        ]},
      ]}
      need={[
        'Decide the store: all-in-platform uploads vs links to Google Drive',
        'The first set of documents to load (insurance, licence, H&S)',
        'Who can edit/replace vs who can only view',
      ]}
      liveNote="Quickest start: drop everything into one Google Drive folder and I’ll surface tidy, categorised share links here. We can move to native in-platform uploads later if you’d rather not depend on Drive."
    />
  )
}
