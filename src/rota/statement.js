// No Dice — Statement of Intent for freelance / casual bar team. This is NOT a
// contract of employment; it's a plain overview of the standards we expect and
// what the team can expect from us. Shown on every Bar Staff & Asst Manager
// profile; the calendar stays locked until it's signed + onboarding is complete.
// Bump SOI_VERSION when the wording changes so past sign-offs are traceable.

export const SOI_VERSION = '2026-07'

export const STATEMENT = {
  title: 'Statement of Intent — Freelance Bar Team',
  intro: "This is not a contract of employment. No Dice (London Fields, 407 Mentmore Terrace, E8 3PH) engages you on a freelance, casual basis. It sets out the standards we expect from everyone working a shift with us, and what you can expect from us. By signing, you confirm you have read and understood it.",
  sections: [
    { heading: 'Presentation & hygiene', body: '• Arrive clean, tidy and well-presented, in suitable clothing for the bar.\n• Keep your hands, your station and the bar clean throughout the shift — follow the cleaning checklists.\n• Maintain good personal hygiene at all times. Don’t work while unwell with anything that could affect food or drink safety.' },
    { heading: 'How we serve', body: '• Smile, be welcoming, and give every guest warm, attentive service.\n• Listen — to guests and to management. Make drinks to spec.\n• Follow all house rules and the law, including Challenge 25 (ID anyone who looks under 25), licensing and health & safety.' },
    { heading: 'What we expect from you', body: '• Reliability & punctuality — turn up on time, ready to work.\n• Only pick shifts you can genuinely work, and honour the ones you take. If you truly can’t make a shift, drop it back as early as possible so someone else can cover.\n• Be a team player — help your colleagues, keep the floor and stations tidy, and follow reasonable instructions from management.' },
    { heading: 'Rules, warnings & ending an engagement', body: '• We’ll always try to support you. If standards slip, management may give you an informal or written warning.\n• As a freelance engagement, either side can end it — we just ask for reasonable notice where possible.\n• Serious misconduct means we may end your engagement immediately (see below).' },
    { heading: 'Serious misconduct — immediate end of engagement', body: 'Behaviour that can end your engagement on the spot includes:\n• Theft, fraud or dishonesty (including with the till or cash).\n• Violence, or threatening / abusive behaviour.\n• Being under the influence of alcohol or drugs while working.\n• Serving alcohol to anyone underage, or ignoring Challenge 25.\n• Serious health, safety or hygiene breaches.\n• Discrimination, bullying or harassment of guests or colleagues.' },
    { heading: 'Payment', body: '• You are engaged on a self-employed / freelance basis and invoice for the shifts you work, at the rate agreed with management.\n• You are responsible for your own tax and National Insurance.\n• Payment is made to your nominated bank account on the agreed schedule. Ask management for current rates and pay dates.' },
    { heading: 'Right to work & getting you paid', body: 'Before you can pick up shifts, the law requires us to hold — and you must provide:\n• Proof of your right to work in the UK.\n• A copy of your passport or photo ID.\n• Your National Insurance number.\n• Your bank details, personal details and next-of-kin.\nWe hold these securely and use them only to pay you and meet our legal duties.' },
  ],
}

// The onboarding a Bar Staff / Asst Manager must finish before the calendar opens.
// `s` is the staff object; `docs` = { passport: bool, rtw: bool }.
export const ONBOARDING_STEPS = [
  { key: 'statement', label: 'Sign the Statement of Intent', done: (s) => !!s?.soi_signed_at },
  { key: 'personal', label: 'Personal details (name, phone, address, date of birth)', done: (s) => !!(s?.name && s?.phone && s?.address && s?.dob) },
  { key: 'nok', label: 'Next-of-kin / emergency contact', done: (s) => !!(s?.emergency_name && s?.emergency_phone) },
  { key: 'ni', label: 'National Insurance number', done: (s) => !!s?.ni_number },
  { key: 'bank', label: 'Bank details (for payment)', done: (s) => !!(s?.bank_name && s?.bank_sort && s?.bank_account) },
  { key: 'passport', label: 'Passport / photo ID copy', done: (s, d) => !!d?.passport },
  { key: 'rtw', label: 'Proof of right to work in the UK', done: (s, d) => !!d?.rtw },
]

export const onboardingComplete = (s, docs) => ONBOARDING_STEPS.every(step => step.done(s, docs || {}))
export const onboardingMissing = (s, docs) => ONBOARDING_STEPS.filter(step => !step.done(s, docs || {}))

// The statement + onboarding gate applies to every rostered role.
export const ONBOARDING_ROLES = ['Bar Staff', 'Supervisor', 'Asst. Manager', 'Manager']
export const requiresOnboarding = (role) => ONBOARDING_ROLES.includes(role)
// Locked = this role needs onboarding AND it isn't finished.
export const calendarLocked = (s, docs) => requiresOnboarding(s?.role) && !onboardingComplete(s, docs)
