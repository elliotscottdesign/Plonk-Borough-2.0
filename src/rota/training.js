// No Dice staff training — the master training doc + compliance modules.
// Metadata here is stable; the rewritten (de-Plonked) content lives in
// MODULE_CONTENT (produced from the venue's real training docs). Cocktail
// training reads the live cocktail specs, so it stays in sync with the bar.

export const TRAINING_CATEGORIES = ['The bar', 'Health & safety', 'Licensing & guests', 'Food & allergens']

export const MODULE_META = [
  { key: 'bar-manual', title: 'The No Dice Bar Manual', category: 'The bar', icon: '📖' },
  { key: 'fire-safety', title: 'Fire Safety Awareness', category: 'Health & safety', icon: '🔥' },
  { key: 'first-aid', title: 'Emergency First Aid Awareness', category: 'Health & safety', icon: '⛑️' },
  { key: 'health-safety', title: 'Health & Safety Awareness', category: 'Health & safety', icon: '🦺' },
  { key: 'coshh', title: 'COSHH — Hazardous Substances', category: 'Health & safety', icon: '🧴' },
  { key: 'manual-handling', title: 'Manual Handling', category: 'Health & safety', icon: '📦' },
  { key: 'slips-trips', title: 'Slips, Trips & Falls', category: 'Health & safety', icon: '⚠️' },
  { key: 'challenge-25', title: 'Challenge 25', category: 'Licensing & guests', icon: '🪪' },
  { key: 'conflict', title: 'Conflict Management', category: 'Licensing & guests', icon: '🤝' },
  { key: 'drink-spiking', title: 'Drink Spiking Awareness', category: 'Licensing & guests', icon: '🍹' },
  { key: 'drugs', title: 'Drug Awareness', category: 'Licensing & guests', icon: '🚫' },
  { key: 'safeguarding', title: 'Safeguarding', category: 'Licensing & guests', icon: '🛡️' },
  { key: 'allergens', title: 'Allergen Awareness (Natasha’s Law)', category: 'Food & allergens', icon: '🥜' },
  { key: 'food-safety', title: 'Food Safety Awareness', category: 'Food & allergens', icon: '🍽️' },
]

// Filled from the training-rewrite workflow. Shape per key:
//   { intro: string, sections: [{ heading, body }], keyPoints: [string] }
export const MODULE_CONTENT = {
  "allergens": {
    "intro": "No Dice (London Fields, 407 Mentmore Terrace, E8 3PH) mainly serves drinks, but we handle food — bar snacks, fresh fruit garnishes, syrups and mixers — every shift. Under Natasha's Law we have a legal duty to give customers accurate allergen information, and getting it wrong can seriously harm someone, so every bartender needs to know this.",
    "sections": [
      {
        "heading": "What Natasha's Law means for us",
        "body": "Natasha's Law (in force since October 2021) requires UK food businesses to give customers clear, accurate allergen information on the food they serve, including pre-packed items.\n\nEven though we're a bar, it applies to us whenever we handle or serve:\n• Pre-packed snacks (crisps, nuts)\n• Pre-packaged mixers, syrups and juices\n• Any packaged food we hand directly to a customer\n\nThese products must carry a clear, readable label showing whether they contain any of the 14 major allergens. Your job is to read those labels and pass the information on accurately."
      },
      {
        "heading": "The 14 allergens you must know",
        "body": "By law these 14 must be identified in any food product:\n• Cereals containing gluten (wheat, barley, rye, oats)\n• Crustaceans (prawns, crab)\n• Eggs\n• Fish\n• Peanuts\n• Soybeans\n• Milk\n• Nuts (almonds, walnuts, cashews)\n• Celery\n• Mustard\n• Sesame seeds\n• Lupin\n• Molluscs (squid, oysters)\n• Sulphur dioxide / sulphites (over 10mg/kg or 10mg/l — common in wine and wine-based products)\n\nLearn these so you can spot them and flag them to customers."
      },
      {
        "heading": "Where allergens hide at No Dice",
        "body": "• Snacks: crisps and nuts can contain nuts, peanuts or gluten. Check the packaging before you answer.\n• Fruit garnishes: some people react to specific fruits (citrus, berries). Know what garnish is going in a drink and be ready to leave it out or swap it.\n• Mixers and syrups: pre-made syrups, mixers and juices can contain sulphites or other allergens — sulphites are especially common in wine-based products.\n\nWhen in doubt, don't guess — check the label or ask your manager."
      },
      {
        "heading": "Handling an allergy request",
        "body": "• Always ask: if a customer mentions an allergy — or you're unsure — ask before you make the drink. Better to ask up front than assume.\n• Know your products: be familiar with what's in our snacks, syrups and mixers so you can answer confidently and steer people to safe choices.\n• Offer alternatives: allergic to nuts? Suggest a nut-free snack. Can't have citrus? Offer a different garnish. Never just say 'no' — offer a safe option.\n• Reading labels: check ingredient lists on any pre-packed item — allergens are shown in bold or a different colour. If you can't confirm a product is safe, ask a manager or check the supplier's allergen info before serving. Never reassure a customer on a guess."
      },
      {
        "heading": "If someone has a reaction",
        "body": "1. Stay calm and assess. Look for swelling, difficulty breathing, or distress. Reassure the customer.\n2. For anything serious or life-threatening (trouble breathing, swelling of the throat) call 999 immediately. Be ready to tell them the suspected allergen. No Dice has entrances/exits onto Mentmore Terrace — make sure the way is clear so paramedics can reach the customer fast (ask your manager for the exact meeting point for emergency services if you don't know it).\n3. Alert a manager straight away so they can investigate the source and check ingredients.\n4. Offer support. If it's mild, help them to a safe, calm spot and offer water while help arrives. Our first-aid kit is on site — ask your manager where it's kept if you're not sure."
      },
      {
        "heading": "Talking to customers",
        "body": "• Be honest and clear about possible allergens in what we serve.\n• If you're not certain, say so — tell them you'll double-check the ingredients or ask a manager. Never bluff.\n• Point them to where the information is (product packaging, or staff who can check).\n• If a customer wants detailed allergen info on a snack or item, make sure we can provide it. The goal is peace of mind and a safe visit."
      }
    ],
    "keyPoints": [
      "Natasha's Law applies to No Dice too — we must give accurate allergen info on the pre-packed snacks, mixers and syrups we serve.",
      "Know the 14 allergens; sulphites (in wine-based products) are the one bartenders miss most.",
      "If a customer mentions an allergy, always ask before making the drink — never guess or reassure on a hunch.",
      "Read the label: allergens appear in bold or a different colour. Can't confirm it's safe? Ask a manager before serving.",
      "Serious reaction (breathing trouble, throat swelling) = call 999 immediately, name the suspected allergen, and alert a manager.",
      "Always offer a safe alternative rather than just refusing — and know where the first-aid kit is (ask your manager if unsure)."
    ]
  },
  "challenge-25": {
    "intro": "Challenge 25 is the law-driven age-check policy that keeps No Dice (London Fields, E8 3PH) legally allowed to sell alcohol. Get it wrong and you personally face a fine and No Dice Hackney Ltd risks losing its licence — so this is one of the few things every bartender must get right, every shift.",
    "sections": [
      {
        "heading": "What Challenge 25 is",
        "body": "If a customer looks under 25, you ask for ID — even if you're sure they're over 18. The extra 7 years is a safety buffer so we never accidentally serve someone under 18.\n\n• Looks under 25 = you must see ID. No exceptions, no \"but they're clearly older.\"\n• It applies everywhere alcohol is served — the bar, table service by the mini-golf, the beer garden, the arcade and pool areas."
      },
      {
        "heading": "The law and the penalties",
        "body": "Under the Licensing Act 2003 it is illegal to:\n• Sell alcohol to anyone under 18.\n• Let a sale to a minor happen because you didn't check ID.\n• Serve an adult who is buying for a minor (a \"proxy\" purchase).\n\nIf it goes wrong:\n• YOU can be personally fined up to £5,000.\n• No Dice can lose its alcohol licence.\n• The bar can be hit with a fixed penalty notice.\n\nHackney Council licensing and the police can and do run test purchases."
      },
      {
        "heading": "ID we accept",
        "body": "Only valid, in-date, original documents:\n• Passport\n• UK or EU photocard driving licence\n• PASS card (Proof of Age Standards Scheme — look for the PASS hologram)\n• Military ID or UK national ID\n\nNever accept:\n• A photo or screenshot of an ID\n• Student cards\n• Bank cards\n\nExpired ID does not count — treat it as no ID."
      },
      {
        "heading": "How to check ID",
        "body": "Ask politely, then actually inspect it:\n• \"Hi, can I just see some ID please?\" or \"We run Challenge 25, so I need to check your ID.\"\n• Work out the age from the date of birth — do the maths, don't guess.\n• Check it's genuine: holograms/watermarks, raised lettering, overall quality.\n• Watch for fakes: smudged ink, mismatched fonts, odd or peeling lamination, a photo that doesn't match the person.\n\nIf you have any doubt about the ID, do not serve. Trust your instinct — if in doubt, refuse."
      },
      {
        "heading": "Run the check through the till",
        "body": "When you check ID, use the age-verification prompt on the till if it has one. This creates a digital record that protects you and the venue.\n\n• Complete the age prompt before ringing the drink.\n• If the ID is declined or they can't produce one, don't serve — and log the refusal (see next section)."
      },
      {
        "heading": "Refusing service and logging it",
        "body": "No valid ID = you must refuse. Keep it calm and short:\n• \"Sorry, I can't serve you without ID — it's part of our Challenge 25 policy.\"\n\nThen log EVERY refusal in the refusals book / digital log:\n• Date and time\n• Description of the customer (rough age, gender, clothing)\n• Reason (no ID, ID looked fake, suspected proxy purchase)\n• Your initials\n\nWhy: the log is our proof to Hackney Council and the police that we're following the policy. Ask your manager where the refusals book/log lives if you don't know."
      },
      {
        "heading": "Handling difficult customers",
        "body": "• Stay calm and polite even if they push back or get angry.\n• Don't argue or negotiate — the policy isn't yours to bend.\n• Get a manager or supervisor if it escalates.\n• Never serve when you have doubts, whatever they say."
      }
    ],
    "keyPoints": [
      "Looks under 25 → you must see ID, even if you're sure they're over 18.",
      "Only accept valid, in-date, original passport / UK-EU driving licence / PASS card / military or national ID — never photos, student or bank cards.",
      "Do the age maths from the date of birth and check for holograms, raised lettering and signs of tampering.",
      "Use the till's age-verification prompt to create a digital record.",
      "Log every refusal (time, description, reason, your initials) in the refusals book — it's our proof to Hackney Council and police.",
      "If in doubt, refuse. Stay calm, and get a manager if it escalates."
    ]
  },
  "conflict": {
    "intro": "At No Dice (London Fields, E8), you're working a floor with mini-golf, arcade machines, pool tables, ping pong and a beer garden, plus a busy bar — flashpoints happen. Handling them calmly keeps the venue safe, protects the relaxed atmosphere and covers you legally when things escalate.",
    "sections": [
      {
        "heading": "What kicks off at No Dice",
        "body": "The usual flashpoints on shift:\n• Games disputes — whose turn on the pool table, ping pong scores, people hogging the mini-golf course or arcade machines.\n• Intoxicated or disorderly guests — loud, rude or rowdy; or pushing back after being refused service.\n• Complaints — wait times, drink quality, music volume, or another guest's behaviour.\n• Group tensions — friends falling out, or people clashing over seating and table space in the bar or beer garden."
      },
      {
        "heading": "Core principles",
        "body": "Stay calm and professional. Control your tone and body language, don't raise your voice or use confrontational language, and hold a neutral, assertive stance.\n\nListen actively. Let the guest explain without interrupting. Use lines like \"I understand why you're upset\" and \"Let me see how I can help.\"\n\nBe clear and firm. If someone's being unreasonable, hold your position politely but firmly: \"I'm sorry, but we can't allow any more turns on the table right now\" or \"I can't serve you any more drinks this evening.\""
      },
      {
        "heading": "De-escalation",
        "body": "Take the heat out before it grows:\n• Calm, reassuring tone — speak slowly and clearly, don't sound defensive or aggressive.\n• Create space — if someone's agitated, step back and give them room. Never make physical contact.\n• Empathise and offer a solution — acknowledge the frustration and fix what you can. Unhappy with a drink? Offer a replacement. Game dispute? Suggest they take a break and come back to it."
      },
      {
        "heading": "When to get help",
        "body": "Some situations go beyond you. Involve a manager or call for support if:\n• A guest becomes aggressive or threatening.\n• You feel unsafe or intimidated.\n• A group argument is drawing attention from other guests.\n• You're unsure how to proceed and need backing.\n\nDon't tough it out alone — flag it early. Know where the panic/help point is behind the bar; if you don't, ask your manager at the start of your shift."
      },
      {
        "heading": "Refusing an intoxicated guest",
        "body": "When someone is clearly intoxicated and you need to refuse service:\n• Stay polite but firm: \"I can't serve you any more alcohol tonight.\"\n• Don't argue or justify the refusal — state the decision and walk away if you need to.\n• Log the refusal in the refusals book (time, description of the person, reason). Ask your manager where the refusals book is kept if you're not sure.\n• If they turn aggressive, involve a manager immediately.\n\nThis matters under our Hackney premises licence — refusing service to someone who's had too much is a legal duty, not a judgement call."
      },
      {
        "heading": "Games disputes",
        "body": "With mini-golf, pool, ping pong and arcade machines, games rows are common. Handle them by:\n• Sticking to house rules — refer to the bar's rules (e.g. max playing time, winner-stays-on). If you don't know the rule for a game, ask your manager.\n• Staying impartial — never take sides; the rules decide it, not you.\n• Offering an alternative — if two groups are stuck arguing, move one on to another activity (e.g. off ping pong onto the arcade machines or a round of mini-golf)."
      },
      {
        "heading": "Handy phrases",
        "body": "To calm someone down:\n• \"I get why you're frustrated. Let's see how we can sort this out.\"\n• \"I want to help, but I need you to stay calm so we can talk properly.\"\n\nTo hold your line:\n• \"I understand you're upset, but I need you to lower your voice.\"\n• \"I can't serve you any more drinks this evening.\"\n\nFor games:\n• \"We've got a winner-stays-on policy, so it's their turn next.\"\n• \"You've had your turn on the machine — let's give others a go now.\""
      },
      {
        "heading": "Log it afterwards",
        "body": "Once a conflict is dealt with, record it in the incident book (ask your manager where it's kept). Include:\n• Date and time.\n• Description of the people involved.\n• Nature of the conflict.\n• What you did (e.g. refused service, called a manager).\n• Whether police or security were involved, if applicable.\n\nAn accurate log protects you, the team and No Dice Hackney Ltd if anything comes back later."
      }
    ],
    "keyPoints": [
      "Stay calm, professional and polite — never let emotions take over.",
      "De-escalate: lower your tone, give space, offer a solution, no physical contact.",
      "Stick to house rules on games disputes and stay impartial — the rules decide, not you.",
      "Refusing an intoxicated guest is a legal duty under our Hackney licence — state it firmly, don't argue, log it in the refusals book.",
      "Know when to call a manager or security: aggression, threats, feeling unsafe, or a crowd forming.",
      "Log every incident in the incident book with time, people, what happened and what you did."
    ]
  },
  "coshh": {
    "intro": "COSHH is the law that keeps you safe around the chemicals and hazardous stuff we use every shift at No Dice — cleaning products, high-proof spirits, gas cylinders. Handle them wrong and you risk burns, fumes, fire, or worse; this module shows you how to handle them right.",
    "sections": [
      {
        "heading": "What COSHH is",
        "body": "COSHH stands for Control of Substances Hazardous to Health — a UK regulation that requires us to protect staff and customers from hazardous substances. At No Dice (London Fields) that mainly means:\n• Cleaning chemicals — surface cleaners, sanitisers, disinfectants\n• Alcohol-based products — high-proof spirits and flammable liquids\n• Gases — pressurised cylinders (e.g. CO2 for lines, nitrous oxide)\n• Fumes, dusts and vapours — from strong cleaners, cleaning powders, or powdered ingredients\nWe have a legal duty to handle, store and dispose of all of these properly to reduce the risk of harm."
      },
      {
        "heading": "Spotting the hazards",
        "body": "Hazardous substances come as liquids, gases, solids and vapours. The common ones on our floor:\n• Cleaning chemicals — harmful if swallowed, breathed in, or on skin/eyes\n• High-proof spirits & other flammable liquids — fire and spill risk\n• Gas cylinders — CO2, nitrous oxide and similar are pressurised; handle and secure carefully\n• Equipment — the glasswasher/dishwasher uses chemicals and produces heat and steam that can burn or scald\nCheck the label. A hazard symbol (flame, corrosion, health hazard) means treat it with care."
      },
      {
        "heading": "Controlling exposure",
        "body": "Four ways we keep exposure down:\n• Use the least hazardous option — pick non-toxic or eco cleaners where they'll do the job\n• Store it right — keep chemicals clearly labelled, in a secure, well-ventilated spot, away from food prep, drinks and customers. Keep cleaning products in locked storage away from public access. Store spirits and flammables so they can't spill or catch fire\n• Wear PPE — gloves, apron, and goggles where needed, especially with strong cleaning chemicals or decanting spirits\n• Never decant a chemical into an unlabelled bottle — it must stay in its original, labelled container"
      },
      {
        "heading": "Handling it safely",
        "body": "• Read and follow the label — every product has a correct way to use it\n• Ventilate — open a window or run the extractor when using anything with strong fumes or vapours\n• Keep it to designated areas — handle chemicals in the store/cleaning areas, not where customers, drinks or golf/arcade/pool players are\n• Dilute to instructions — never use a concentrate neat; mix to the ratio on the label\n• Never mix chemicals together (e.g. bleach with anything) — it can create toxic gas"
      },
      {
        "heading": "If something goes wrong",
        "body": "Act quickly and stay calm.\n• Chemical spill — secure the area. Small spill: follow the label's clean-up instructions (e.g. absorbent materials). Large spill: tell a manager and use the spill kit to contain and clean it\n• On skin: rinse the area with plenty of water. If irritation persists, get medical help\n• In eyes: rinse with water for at least 15 minutes and seek medical attention if irritation continues\n• Breathed in fumes: if you feel dizzy or sick, get out to fresh air straight away. If it doesn't pass, seek medical attention\nKnow where the nearest first-aid kit is before your shift starts — ask your manager if you're not sure. Emergency services: 999."
      },
      {
        "heading": "Risk assessments, SDS & training",
        "body": "• COSHH risk assessments — we assess every hazardous substance we use: what it is, how risky it is, what controls (PPE, storage) are needed, and we review it regularly. Follow the control measures set out for anything you work with\n• Safety Data Sheets (SDS) — every chemical has one, covering its hazards, safe handling and first-aid steps. Know where the SDS folder is kept and read it before handling an unfamiliar substance — ask your manager where it lives\n• Training — take part in COSHH training when it's offered\nIf you're ever unsure how to handle a substance, stop and ask your manager. No exceptions."
      }
    ],
    "keyPoints": [
      "COSHH is a legal duty — it protects staff and customers from cleaning chemicals, high-proof spirits, gas cylinders and fumes.",
      "Always read and follow the product label; dilute concentrates to instructions and never mix chemicals.",
      "Store chemicals labelled, secure, ventilated and away from food, drink and the public — keep cleaning products locked away.",
      "Wear the right PPE (gloves, apron, goggles) and ventilate when using strong products.",
      "Eyes: rinse 15 minutes. Skin: rinse with plenty of water. Fumes: get to fresh air. Persisting symptoms or big spills: get a manager / seek medical help.",
      "Know where the first-aid kit and SDS folder are before your shift — if unsure how to handle something, ask your manager."
    ]
  },
  "drink-spiking": {
    "intro": "Drink spiking is a real risk in any bar, and spotting it fast can protect a customer from serious harm. This module gives every No Dice bartender the plain-English steps to prevent spiking, spot the signs, and respond correctly on shift.",
    "sections": [
      {
        "heading": "1. What drink spiking is",
        "body": "Spiking means secretly putting drugs or extra alcohol into someone's drink without them knowing or agreeing. It happens in bars everywhere and can cause serious physical, emotional and legal harm.\n\nIt comes in two forms:\n• Drugs — sedatives, hallucinogens or other substances that mess with someone's judgement, memory or body control.\n• Alcohol — adding extra shots so someone gets far more drunk than they chose to.\n\nAt No Dice we stay alert to prevent it and act fast if we suspect it."
      },
      {
        "heading": "2. Signs to watch for",
        "body": "People often don't know straight away that they've been spiked. Watch for:\n• Sudden change in behaviour — someone becomes very drunk, confused or disoriented after only a small amount to drink.\n• Unexplained symptoms — dizziness, nausea, trouble walking, blurred vision or fainting, especially if it comes on fast.\n• Loss of control — can't control their movements or speech.\n• Memory gaps — blank spots around how they got so intoxicated.\n\nIf you spot these signs, trust your instincts and act."
      },
      {
        "heading": "3. Preventing spiking on shift",
        "body": "Every bartender helps stop this from happening:\n• Make drinks in front of the customer and hand them straight over. Don't leave drinks sitting unattended.\n• Tell customers to keep their drink with them — or hand it to a trusted friend — if they head off to the toilet, the golf lanes, the pool tables, the arcade or out to the garden. It's easy to lose sight of a glass in a busy venue.\n• Watch for anyone getting drunk unusually fast or acting confused. Keep an eye on them and their glass, and offer to make them a fresh drink.\n• Offer drink covers or coasters as an extra layer of protection where we have them.\n• Watch for suspicious behaviour — anyone who looks like they're tampering with a drink. Tell a supervisor or manager straight away."
      },
      {
        "heading": "4. If you suspect a drink has been spiked",
        "body": "Act quickly and calmly:\n• Stay calm and supportive — don't alarm the customer. Reassure them they're safe and you'll help.\n• Offer a safe space — a quiet spot to sit and rest. If they're with friends, ask their friends to help support them.\n• Call 999 (or 112) immediately if they show serious intoxication or distress. Explain the situation clearly to the operator.\n• Tell a manager or supervisor right away — they may need to check CCTV and gather details.\n• KEEP the drink — do not let it be tipped away or cleared. It can be tested to confirm tampering.\n• Never leave the customer alone — stay with them in a safe area until help arrives.\n• Alert other staff so the whole team stays watchful and helps manage it."
      },
      {
        "heading": "5. If a customer reports they've been spiked",
        "body": "• Take it seriously — even if they seem unsure or scared. This is sensitive; handle it carefully.\n• Reassure them their safety and wellbeing come first.\n• Support medical help — encourage them to get checked. Offer to call 999 or help them reach a friend or family member.\n• Document the incident — time, the drink involved, and the customer's account. This may matter for any investigation.\n• Report to authorities if needed — a manager decides on informing the police, especially if the customer's health is at risk or it looks like part of a pattern."
      },
      {
        "heading": "6. Keeping No Dice safe for everyone",
        "body": "We all share this:\n• Encourage responsible drinking — overconsumption makes people more vulnerable to spiking.\n• Foster a culture of care — make it clear No Dice is a place where respect and safety come first.\n• Share information — posters or info about spiking and staying safe help customers protect themselves.\n\nIf you're ever in doubt, don't hesitate — get a manager or supervisor. It's always better to raise it."
      }
    ],
    "keyPoints": [
      "Spiking = secretly adding drugs OR extra alcohol to a drink without consent. It's a crime and can seriously harm someone.",
      "Watch for: sudden heavy drunkenness after little alcohol, confusion, dizziness, trouble walking or speaking, memory gaps. Trust your gut and act.",
      "Prevent it: prepare drinks in front of the customer, never leave drinks unattended, and tell people to keep their drink with them (busy garden, golf lanes and arcade make it easy to lose sight of a glass).",
      "If you suspect it: stay calm, keep the customer safe and never leave them alone, tell a manager, and KEEP the drink — do not throw it away, it can be tested.",
      "Serious symptoms or distress = call 999 straight away. Explain clearly what you've seen.",
      "Take every report seriously, support the customer, log the incident, and let a manager decide on police/authorities."
    ]
  },
  "drugs": {
    "intro": "Drug awareness is legally-relevant safety training for anyone serving customers at No Dice, Hackney. With a mini-golf course, arcade, pool tables and a busy beer garden, our floor gets lively — spotting and handling drug-related situations calmly keeps customers and staff safe and protects our licence.",
    "sections": [
      {
        "heading": "1. What drug awareness means",
        "body": "Drug awareness is understanding how drugs affect people's behaviour and wellbeing, spotting the signs of intoxication or misuse, and knowing how to respond. Drugs can be legal or illegal, and either can affect a customer's ability to safely enjoy the bar, the golf course and our other activities.\n\nTwo categories to keep in mind:\n• Legal drugs: alcohol, nicotine, prescription medication (can still impair behaviour through side effects).\n• Illegal drugs: substances prohibited by law — e.g. cocaine, ecstasy, heroin, cannabis and others."
      },
      {
        "heading": "2. How drugs affect people",
        "body": "Drugs impair judgment, coordination and behaviour. Signs someone may be under the influence:\n• Physical: bloodshot eyes, dilated pupils, slurred speech, unsteady movement, excessive sweating, or a strong drug odour.\n• Behavioural: aggression, paranoia, hyperactivity, anxiety, mood swings, or disorientation.\n\nMixing danger: combining alcohol with drugs — legal or illegal — is very dangerous. It can intensify the effects of both and cause far more severe impairment. Watch for this especially given how much drinking happens on a night out here."
      },
      {
        "heading": "3. Signs of drug misuse",
        "body": "Everyone reacts differently, but common signs include:\n• Altered speech: fast, incoherent, or slurred.\n• Erratic behaviour: extreme mood swings, aggression, unpredictability.\n• Physical signs: sweating, shaking, twitching, or unfocused eyes.\n• Paranoia or anxiety: unusual nervousness, agitation, or seeming distracted / unaware of surroundings.\n• Excessive energy or drowsiness: hyperactive and restless, or unusually sleepy.\n\nNote: drugs can also make people over-confident, leading to risky or inappropriate behaviour — like disrupting other customers or putting themselves in danger (near the golf course, pool tables or beer garden)."
      },
      {
        "heading": "4. Handling a situation involving drugs",
        "body": "If you suspect someone is under the influence, act with care and professionalism:\n• Assess calmly: look for signs of misuse, but also consider alcohol, health issues or other causes.\n• Don't jump to conclusions: not every change in behaviour is drugs — stress, anxiety or a medical issue can look similar. Approach each case thoughtfully.\n• Approach with caution: stay calm and non-confrontational. Let them know you're there to make sure they're safe and having a good time.\n• Stop service if needed: you have the right to refuse service. Politely but firmly explain their behaviour is a concern and, for their safety, you can't serve them.\n• Call for help: if it escalates, or they may be a danger to themselves or others (aggressive, disoriented), notify a manager immediately. Involve security or emergency services if necessary."
      },
      {
        "heading": "5. Refusing service",
        "body": "If you believe a customer is too intoxicated or under the influence of drugs, you must refuse service. Alongside this:\n• Offer a safe exit: help them leave safely — call a taxi or ride-share, offer water.\n• Document it: always tell your manager and make sure any refusal of service is properly recorded in case it needs reviewing later."
      },
      {
        "heading": "6. Handling a drug-related emergency",
        "body": "In a medical emergency, stay calm and follow these steps:\n• Assess: is the person conscious, breathing, responsive? If they are NOT breathing or unresponsive, call 999 immediately and request an ambulance.\n• First aid: if unconscious but breathing, place them in the recovery position to keep the airway clear. If conscious, keep them calm and reassure them help is on the way.\n• Give information: tell emergency services the symptoms you've seen and any substances the person may have taken.\n\nKnow where the first-aid kit is and who the trained first-aiders on shift are — if you're not sure, ask your manager now, before you need it. Know your nearest fire exits and clear routes for paramedics."
      },
      {
        "heading": "7. Prevention",
        "body": "We can't stop all misuse, but we can reduce the risk:\n• Know the signs so you respond quickly and correctly.\n• Encourage safe behaviour and remind customers of the dangers of mixing drink and drugs.\n• Work as a team: if in doubt, talk it through with a manager or a colleague before acting."
      }
    ],
    "keyPoints": [
      "Legal (alcohol, nicotine, prescription) and illegal drugs can both impair customers — stay alert on the floor, golf course, arcade and beer garden.",
      "Learn the signs: slurred/fast speech, dilated pupils, sweating, paranoia, aggression, mood swings, hyper or drowsy behaviour.",
      "Mixing alcohol with drugs is especially dangerous and can cause severe impairment.",
      "Stay calm, don't jump to conclusions, and you have the right to refuse service — do it politely but firmly, offer a safe exit, and tell your manager.",
      "In an emergency: not breathing or unresponsive = call 999 for an ambulance; recovery position if unconscious but breathing; tell responders what they took.",
      "Record any refusal of service, and if ever unsure, ask a manager — vigilance prevents dangerous situations."
    ]
  },
  "first-aid": {
    "intro": "Accidents happen in busy venues, and No Dice (London Fields) has a mini-golf course, arcade machines, pool tables and a beer garden alongside a working bar — so trips, cuts, burns and choking are all realistic. This module gives you the basics to act fast and confidently until professional help arrives.",
    "sections": [
      {
        "heading": "Why this matters",
        "body": "Fast, calm action after an accident can prevent further harm, save a life (choking, severe bleeding, cardiac arrest), comfort the injured person, and keep both staff and guests feeling safe.\n\nAt No Dice the risks come from the activities we offer — mini-golf, arcade, pool tables, the beer garden — and from bar work: sharp tools, glassware, hot water and heavy lifting."
      },
      {
        "heading": "Emergencies you might see",
        "body": "• Cuts and lacerations — broken glass, bar tools, garnish prep\n• Slips, trips and falls — wet floors, around the golf course, pool tables and the beer garden\n• Burns or scalds — hot water, glass-washing, cleaning\n• Choking — on food or a drink\n• Severe allergic reaction (anaphylaxis) — food, drinks, snacks, garnishes\n• Fainting or unconsciousness — dehydration, low blood sugar, an accident\n• Heart attack or stroke — rare, but watch for chest pain, dizziness, confusion\n• Severe bleeding — deep cuts can lose blood fast"
      },
      {
        "heading": "The steps for any emergency",
        "body": "1. Assess — is it life-threatening (unconscious, severe bleeding)? Any danger like fire or electrical hazard?\n2. Make it safe — never rush into danger; protect yourself first.\n3. Call for help — dial 999 (or 112) for anything serious. Tell them the injury, the exact spot in the venue, and how many people are hurt. For minor things, grab another staff member or a first aider.\n4. Stay with them — reassure and comfort. Don't leave a conscious person alone; if unconscious, watch their breathing and pulse. Keep them still after a fall or suspected spinal injury.\n5. Give first aid (see next section).\n6. Record and report — fill in an Accident Report Form and tell a manager so any safety issue gets fixed."
      },
      {
        "heading": "Basic first aid by situation",
        "body": "Cuts and bleeding:\n• Firm direct pressure with a clean cloth or bandage.\n• Large wound — raise the limb and keep pressing.\n• Don't remove embedded objects; press around them.\n\nBurns and scalds:\n• Cool running water for at least 10 minutes.\n• No ice, creams or ointments.\n• Cover with a clean non-stick dressing.\n\nChoking (conscious adult):\n• Encourage coughing. If they can't cough or speak: 5 sharp back blows between the shoulder blades.\n• Still stuck: abdominal thrusts (Heimlich).\n• They go unconscious: start CPR.\n\nHeart attack / stroke:\n• Chest pain, breathing trouble, or pain spreading to arm/neck/jaw — call 999 now.\n• Stroke signs — sudden face/arm/leg weakness or numbness, slurred speech, confusion — get help immediately.\n\nFainting / unconscious:\n• Lay them down, raise the legs, check they're breathing.\n• Don't move someone who's fallen unless they're in immediate danger."
      },
      {
        "heading": "CPR and defibrillator (AED)",
        "body": "If someone is unresponsive and not breathing, start chest compressions straight away — push hard and fast in the centre of the chest, about 100–120 per minute.\n\nNo Dice has an Automated External Defibrillator (AED) on site — ask your manager where it is if you're not sure. It's safe and talks you through every step, including any shock. Follow its spoken instructions.\n\nStaff should attend CPR and AED training so you're ready to use these for real."
      },
      {
        "heading": "Allergic reaction (anaphylaxis)",
        "body": "With our cocktails and snacks, allergies are a real risk. If a guest shows swelling, hives or difficulty breathing:\n• Call 999 for an ambulance immediately — this can be life-threatening.\n• If they have an EpiPen (epinephrine auto-injector), help them use it straight away.\n• Stay with them and keep them calm until help arrives."
      },
      {
        "heading": "Guests in crisis",
        "body": "Treat an injured or unwell guest exactly as you'd treat a colleague. Reassure them and call a manager or another staff member for help.\n\nStay calm and focused — distressed guests often get anxious, and keeping them calm until professional help arrives is part of the job."
      },
      {
        "heading": "First aid kits and equipment",
        "body": "Know where our first aid kits are kept — ask your manager to show you on your first shift — and check they're stocked. A basic kit holds:\n• Plasters and bandages\n• Sterile gauze and dressings\n• Antiseptic wipes or cream\n• Burn gel and cold compresses\n• Scissors, tweezers and gloves\n• A first aid manual\n\nIf a kit is running low or anything is expired, tell a manager so it gets restocked."
      }
    ],
    "keyPoints": [
      "Stay calm, make the area safe for yourself first, then help.",
      "Call 999 (or 112) for anything serious — give the nature of the injury, the exact location in the venue, and how many people are hurt.",
      "Severe bleeding: firm direct pressure with a clean cloth; don't pull out embedded objects, press around them.",
      "Choking that stops coughing/speaking: 5 back blows, then abdominal thrusts; if they collapse, start CPR.",
      "Anaphylaxis (swelling, hives, trouble breathing): call 999 now, help them use their EpiPen if they have one.",
      "Every incident gets an Accident Report Form and a manager told — no exceptions."
    ]
  },
  "fire-safety": {
    "intro": "No Dice (London Fields, 407 Mentmore Terrace, E8 3PH) serves alcohol and uses heat and electrical kit behind the bar and across the floor — plus a mini-golf course, arcade machines, pool tables and a beer garden. Fire spreads fast in a busy venue, so every staff member needs to know how to prevent one and how to act if one starts.",
    "sections": [
      {
        "heading": "Why this matters",
        "body": "Fires start quickly and spread fast, putting customers and staff in real danger. Because we handle alcohol, cleaning chemicals and heat sources (cocktail torches, toasters, hot equipment), the risk is always present. Staying alert and reacting fast is what keeps everyone safe."
      },
      {
        "heading": "Common causes of fire in the venue",
        "body": "Watch for these hazards:\n• Heating equipment — hot plates, toasters, cocktail torches: a risk if left unattended or poorly maintained.\n• Alcohol and flammable liquids — high-proof spirits (vodka, rum) ignite easily near heat or open flames.\n• Electrical faults — faulty wiring or overloaded sockets from blenders, music gear, arcade machines.\n• Chemical spills — cleaning chemicals stored or used wrongly add to fire risk.\n• Waste and clutter — paper, bins and clutter near heat or electrics can catch light."
      },
      {
        "heading": "How to prevent fires",
        "body": "• Store flammable materials properly — alcohol, cleaning chemicals and other flammables in their designated places, away from heat and flames.\n• Maintain equipment — check electrical and heating kit is working, no frayed or exposed cables, and turn heating equipment off after use.\n• Smoking areas — smokers use the designated outside area only; use the fireproof bins for cigarette butts and empty them regularly.\n• Minimise clutter — keep work areas clear of paper and waste, and keep every fire exit clear and unobstructed at all times.\n• Fire-resistant materials — where possible, use fire-retardant surfaces and decor to slow any spread."
      },
      {
        "heading": "If you discover a fire",
        "body": "Don't panic. Act in this order:\n• Raise the alarm — shout \"FIRE\", alert everyone nearby, and set off the nearest fire alarm.\n• Evacuate — calmly direct customers and staff to the nearest fire exit and out of the building. Never use lifts.\n• Contain it ONLY if safe — if the fire is small and you're confident, use the nearest extinguisher. If it's large or spreading, leave it and get out. Never put yourself at risk.\n• Call 999 — if the fire is out of control or you're unsure, call 999 (or 112) and ask for the fire service. Give your location and any details.\n• Do not re-enter — stay out until the fire service says it's safe."
      },
      {
        "heading": "Using fire extinguishers (PASS)",
        "body": "Know the types before you need them:\n• Water — Class A only (wood, paper, textiles). NEVER on electrical fires or flammable liquids.\n• Foam — Class A and B (including spilled alcohol or chemicals). Versatile.\n• CO2 — Class B and electrical (flammable liquids, and kit like blenders or arcade machines).\n• Powder — Class A, B and C (adds flammable gases).\nOnly use an extinguisher you know is working and know how to operate. Use the PASS method:\n• Pull the pin\n• Aim at the base of the fire\n• Squeeze the handle\n• Sweep side to side"
      },
      {
        "heading": "Know your venue before your shift",
        "body": "Ask your manager to walk you through these on your first shift and stay familiar with them:\n• Fire exits and evacuation routes — including the beer garden and floor areas around the mini-golf, arcade and pool tables.\n• Where the fire extinguishers and fire alarm call points are.\n• Where the first-aid kit is.\nTake part in fire drills so evacuating quickly and safely becomes second nature."
      },
      {
        "heading": "Evacuation plan",
        "body": "• Know the routes — the safest way out from wherever you're working.\n• Assist customers — guide them calmly out and away from the building.\n• Stay calm — reassure people and make sure no one is left behind.\n• Headcount — once outside, do a headcount if possible to confirm everyone is safe. Do not go back in for anyone until the fire service arrives."
      }
    ],
    "keyPoints": [
      "Prevent fires: maintain equipment, store alcohol and chemicals correctly, and keep exits and work areas clear of clutter.",
      "If you find a fire: shout FIRE, set off the alarm, evacuate calmly to the nearest exit — never use lifts.",
      "Only tackle a small fire if it's safe and you're confident; otherwise get out and call 999.",
      "Match the extinguisher to the fire — never water on electrical or flammable-liquid fires. Remember PASS: Pull, Aim, Squeeze, Sweep.",
      "Know your fire exits, extinguisher locations and the first-aid kit — ask your manager on your first shift and join every drill.",
      "Once out, do a headcount and do not re-enter until the fire service says it's safe.",
      "If you're ever unsure about any fire procedure, ask a manager — your safety and others' comes first."
    ]
  },
  "food-safety": {
    "intro": "No Dice at London Fields doesn't run a full kitchen, but we still handle food: fruit garnishes, snacks, and cocktail mixers all go into or alongside drinks we serve. Get the basics right and you keep customers safe and No Dice Hackney Ltd on the right side of Hackney Council's food hygiene rules.",
    "sections": [
      {
        "heading": "1. What food safety means here",
        "body": "Food safety is about preventing illness caused by food that's been mishandled, contaminated or badly stored. We don't do full meals, but we do handle food that needs the same care:\n• Snacks — crisps, nuts and similar\n• Fresh fruit garnishes — citrus slices, berries\n• Cocktail ingredients — syrups, mixers, fresh juices"
      },
      {
        "heading": "2. Personal hygiene",
        "body": "Your hygiene is the first line of defence.\n• Wash hands often — always before prepping or serving garnishes, snacks or ingredients. Soap and warm water, at least 20 seconds.\n• Wear clean gloves when handling fruit garnishes or snacks. Don't touch these with bare hands.\n• Keep your uniform clean. Change it if it gets soiled."
      },
      {
        "heading": "3. Storing food and ingredients",
        "body": "• Snacks — keep pre-packed crisps and nuts in their original packaging in a dry, cool spot. Seal tightly after opening so air and moisture don't get in.\n• Fresh fruit — lemons, limes, berries live in the fridge. Use within a sensible time frame and bin anything that looks spoiled.\n• Cocktail ingredients — store mixers and syrups as the label says. Refrigerate any perishables like fresh juice and use within the recommended time."
      },
      {
        "heading": "4. Handling fresh ingredients",
        "body": "• Cutting fruit — use a clean, sanitised board and knife. Never cut fruit straight on the bar counter.\n• Avoid cross-contamination — don't use the same board or tools for fruit and for anything that might carry allergens. Keep separate tools for fresh fruit.\n• Wash garnishes — rinse fruit under running water before prepping to remove dirt and pesticides. Clean the skin even on fruit you'll peel."
      },
      {
        "heading": "5. Allergen awareness",
        "body": "We're mostly drinks and snacks, but allergens still matter.\n• Snacks — some contain nuts or gluten. Take customer allergy requests seriously and handle these items carefully.\n• Fruit garnishes — some people react to certain fruits. Ask about allergies when serving garnishes.\n• Cocktail ingredients — make sure syrups, mixers and juices are stored properly and any allergens are clearly labelled. If a customer asks about a specific ingredient, check whether it could contain an allergen and tell them."
      },
      {
        "heading": "6. Cleaning and sanitation",
        "body": "• Sanitise surfaces — clean the bar regularly, especially counters and garnish trays that touch food.\n• Cocktail tools — wash shakers, strainers and jiggers after each use so bacteria don't build up.\n• Waste — bin fruit scraps, peels and food waste promptly. Keep bins covered and empty them regularly so we don't attract pests."
      },
      {
        "heading": "7. Serving and presenting",
        "body": "• Garnishing drinks — use clean tongs or gloves to place fruit on a drink. Never use bare hands on a garnish going into someone's glass.\n• Snacks — serve crisps or nuts in a clean bowl or dish. Don't touch the food directly; present it hygienically."
      },
      {
        "heading": "8. Complaints and concerns",
        "body": "If a customer raises a food safety issue — a hair in a drink, an allergic reaction — stay calm and professional:\n• Apologise and deal with it straight away.\n• Offer a replacement or a fix.\n• Tell your manager so they can look into it and stop it happening again."
      },
      {
        "heading": "9. Summary",
        "body": "Food safety is everyone's job. Even without a kitchen, handling snacks, fresh fruit and cocktail ingredients needs real attention to hygiene. Follow these steps and you keep customers safe and uphold the standards we set at No Dice, London Fields. Any question or anything you're unsure about — ask your manager."
      }
    ],
    "keyPoints": [
      "Wash hands with soap and warm water for at least 20 seconds before touching any garnish, snack or ingredient.",
      "Never touch garnishes or snacks with bare hands — use clean tongs or gloves, especially when the garnish goes into a drink.",
      "Keep fresh fruit and perishable mixers (fresh juice) in the fridge; check for spoilage and bin anything off.",
      "Cut fruit on a clean, sanitised board — never straight on the bar top — and keep separate tools to avoid cross-contamination.",
      "Take allergies seriously: ask customers, know that snacks can contain nuts/gluten, and check ingredients before you serve.",
      "Any food safety complaint (hair in a drink, allergic reaction) — apologise, sort it, and tell your manager so it's logged."
    ]
  },
  "health-safety": {
    "intro": "No Dice is an active venue — mini-golf, arcade machines, pool tables and a beer garden alongside a busy bar — so hazards mix drinks, kit and moving customers. Keeping it safe is a legal duty and part of everyone's job on shift.",
    "sections": [
      {
        "heading": "Your responsibilities on shift",
        "body": "Health and safety means keeping everyone — staff and customers — free from harm. Every team member shares the duty. On shift you must:\n• Follow the procedures and safety guidelines we have in place.\n• Know the hazards around you (wet floors, heavy lifting, broken glass) and avoid them.\n• Use any PPE provided — gloves, non-slip shoes, aprons.\n• Report every hazard and incident to a manager straight away: wet floors, broken glass, faulty equipment.\n• Look out for customers and colleagues. If you see something unsafe, fix it or alert a manager."
      },
      {
        "heading": "Common risks at No Dice and how to prevent them",
        "body": "• Slips, trips and falls — wet floors, spills, clutter. Prevent: clean spills immediately, put out the wet-floor sign, keep walkways and fire exits clear.\n• Manual handling — kegs, cases of stock, furniture. Prevent: use safe lifting technique, use a trolley, ask for help.\n• Cuts — glassware, knives, bar tools. Prevent: handle sharps carefully, glove up when needed, store glassware safely.\n• Fire — electrical kit, hot surfaces, alcohol (flammable). Prevent: keep flammables away from heat, know where the fire exits and extinguishers are.\n• Food safety — snacks, fruit garnishes, any fresh food. Prevent: store at correct temperatures, follow allergen and food-safety procedures.\n• Electrical — blenders, ice machines, lighting. Prevent: don't use damaged kit, report anything faulty.\n• Mini-golf, pool tables and arcade machines — playing injuries. Prevent: keep equipment set up correctly and in good condition, and make sure customers know how to use it safely."
      },
      {
        "heading": "Procedures we all follow",
        "body": "• Risk assessments — done before any new event or layout change (moving tables, adding kit).\n• Report every incident, however small — fill in an accident report form and tell your manager.\n• Fire drills — know the evacuation plan; we run drills so everyone knows what to do.\n• First aid — a trained first aider must be on site. If you don't know where the first-aid kit is, ask your manager.\n• Food safety — we handle snacks, garnishes and fresh ingredients, so food-safety rules are followed strictly."
      },
      {
        "heading": "Keeping the venue safe and tidy",
        "body": "• Cleaning — follow the cleaning schedule; sanitise high-touch surfaces and toilets.\n• Floors — sweep and mop regularly, sign wet floors.\n• Surfaces — keep the bar, tables and counters clear of waste and spills.\n• Waste — dispose of rubbish properly and recycle where possible.\n• Lighting and ventilation — keep walkways, stairs and the golf course well lit, and the bar well ventilated.\n• Signage — warn of hazards (wet floors, hot surfaces) and keep fire exits and escape routes clearly marked."
      },
      {
        "heading": "PPE",
        "body": "Wear the right protection for the task:\n• Gloves — handling sharps, cleaning, or prepping garnishes.\n• Non-slip shoes — especially around wet areas.\n• Apron / protective clothing — when working with food or hot equipment, to guard against spills and burns."
      },
      {
        "heading": "Customer safety",
        "body": "• Watch behaviour — step in if customers overindulge or act dangerously (e.g. running on the mini-golf course).\n• Explain the kit — give clear guidance on safe use of the golf course, pool tables and arcade machines.\n• Allergens — take every allergy seriously and follow our allergen-awareness procedure when serving snacks or garnishes."
      },
      {
        "heading": "Emergencies",
        "body": "• Fire — know the fire exits, alarm points and how to use an extinguisher. Direct customers calmly to the nearest exit.\n• First aid — give first aid if trained, and call 999 for anything serious.\n• Evacuation — know the plan for fire, gas leak or other emergency, and where the exits and safe zones are. If you're unsure of the assembly point, ask your manager."
      }
    ],
    "keyPoints": [
      "Report every hazard and incident to a manager — no matter how small — and fill in an accident report form.",
      "Clean spills immediately and sign wet floors; slips are our most common risk.",
      "Know where the fire exits, extinguishers and first-aid kit are before your shift starts — ask your manager if unsure.",
      "Handle glassware, knives and bar tools carefully, and use PPE (gloves, non-slip shoes, aprons) where needed.",
      "Store food at correct temperatures and take every customer allergy seriously.",
      "Mini-golf, pool and arcade kit must be in good condition and customers shown how to use it safely; call 999 for any serious emergency."
    ]
  },
  "manual-handling": {
    "intro": "At No Dice (London Fields, E8 3PH), moving kegs, stock, cocktail kit and furniture is part of nearly every shift. Lifting badly is one of the most common ways staff hurt their back — this module keeps you and your colleagues injury-free.",
    "sections": [
      {
        "heading": "What manual handling means here",
        "body": "Manual handling is any lifting, carrying, pushing, pulling or moving of objects. At No Dice you'll do it constantly:\n• Moving kegs and large bottles of spirits\n• Carrying trays and boxes of stock in from deliveries\n• Lifting glassware, fruit garnishes and cocktail kit\n• Rearranging tables and chairs for events and setups\n• Restocking the bar — ice, snacks, bottles from the store"
      },
      {
        "heading": "Why it matters",
        "body": "Everyday lifting can cause serious injury if done wrong:\n• Strains and sprains — muscles in your back, legs and arms\n• Back injuries — twisting or bending at the waist while lifting damages the spine\n• Joint damage — repetitive heavy lifting wears out wrists, elbows and knees\n• Slips, trips and falls — awkward loads block your view and your balance"
      },
      {
        "heading": "The safe lifting technique (LIFT)",
        "body": "• Look — assess the load first. Too heavy or awkward? Packed and balanced? If it's too much on your own, get help or use equipment.\n• Initiate — stand close, feet shoulder-width apart, load close to your body. This protects your back and keeps you balanced.\n• Force — bend your knees, NOT your back. Lift with your legs, back straight, no bending or twisting.\n• Turn — if you need to change direction, move your feet and pivot. Never twist your back."
      },
      {
        "heading": "Use the aids — don't muscle it",
        "body": "No Dice has kit to make lifting safer. Ask your manager where these are kept:\n• Trolleys / carts — for cases of alcohol and bulk stock\n• Keg dollies — for moving kegs and barrels with less effort\n• Ice bins / large containers — don't carry these by hand when full; use the right equipment\n• Furniture trolley (if available) — for moving tables and chairs\n\nAlways reach for the right aid before lifting heavy. Unsure? Ask a supervisor."
      },
      {
        "heading": "Key risk areas at No Dice",
        "body": "• Kegs and alcohol — heavy and awkward, handled daily. Proper technique or a dolly, every time.\n• Fruit garnishes — trays of lemons, limes and berries are heavier than they look; use a cart for big batches.\n• Cocktail equipment — glassware, ice machines and large tools are cumbersome and breakable. Get help or use a cart.\n• Moving furniture for events — we have pool tables, arcade machines, a mini-golf course and a beer garden that all get rearranged. Use help or a trolley for tables and chairs.\n• Restocking — plan trips from the store to the bar to cut down on carrying; use trolleys for bulk."
      },
      {
        "heading": "Assess the load first",
        "body": "Before you lift anything, ask yourself:\n• Is it too heavy for me alone?\n• Is it awkward to carry or reach?\n• Can I split it into smaller, lighter loads?\n• Should I be using a trolley or other aid?\n\nIf you're unsure — get help or use equipment. Don't guess."
      },
      {
        "heading": "Posture on every lift",
        "body": "• Keep your back straight — neutral spine, no arching or bending.\n• Use your legs — bend the knees; legs do the work, not the back or arms.\n• Don't twist — pivot on your feet to change direction.\n• Move slowly and steadily — rushing causes accidents."
      },
      {
        "heading": "Heavy or awkward loads",
        "body": "If a load is too heavy or awkward:\n• Ask for help — never lift a big or awkward item alone.\n• Use equipment — trolleys and carts spread the weight and do the hard part.\n• Break it down — split large loads into smaller, manageable pieces where you can."
      },
      {
        "heading": "Training and equipment checks",
        "body": "• Attend manual handling training — refresh your technique regularly.\n• Check equipment — inspect trolleys, dollies and lifting aids before use. Anything damaged, report it to your manager straight away and take it out of use."
      }
    ],
    "keyPoints": [
      "Lift with your legs, not your back — bend your knees, keep your back straight.",
      "Keep the load close to your body and never twist while lifting — pivot your feet instead.",
      "If it's too heavy or awkward to lift alone, get help or use a trolley/dolly. Don't be a hero with a keg.",
      "Assess every load before you lift: too heavy? awkward? can it be split into smaller bits?",
      "Use the aids — trolleys, carts, keg dollies. Ask your manager where they're kept.",
      "If any lifting equipment is damaged, report it to your manager straight away and don't use it."
    ]
  },
  "safeguarding": {
    "intro": "No Dice (London Fields, Hackney) is an adults-first bar, but with a mini-golf course, arcade machines, pool tables and a beer garden, kids do sometimes turn up — at family events, private hires, or just tagging along. Safeguarding is a legal duty: every one of us has to spot risks to under-18s and act correctly.",
    "sections": [
      {
        "heading": "What safeguarding means",
        "body": "Safeguarding children means protecting under-18s from harm, abuse or neglect. No Dice is built for adults, but children can be present at family gatherings, charity or family-friendly events, or accompanying adults. While they're on our premises, their safety is our responsibility — and it's a legal duty, not a nice-to-have."
      },
      {
        "heading": "Children and alcohol — the hard rule",
        "body": "Under-18s must never be served alcohol or allowed to drink it at No Dice — full stop.\n• At any event with families or minors, be extra vigilant that no under-18 gets access to alcohol.\n• Make sure family/kids events are properly supervised.\n• If children are present, steer them away from areas where alcohol is served or being drunk, and check they're always with a responsible adult."
      },
      {
        "heading": "Spotting the risks",
        "body": "Watch for the specific hazards our venue creates:\n• Noise & crowds — the arcade, pool tables and busy nights can be loud and overwhelming for a child.\n• Physical play areas — mini-golf, pool and arcade machines mean kids can run or play unsafely. Make sure there's adult supervision.\n• Beer garden — an outdoor space kids may wander into; keep an eye out.\n• Unsupervised or with strangers — a child alone, or seemingly with someone not paying attention, deserves a careful, calm check-in."
      },
      {
        "heading": "Your responsibilities on shift",
        "body": "• Age verification: If unsure of anyone's age, ask for ID. Apply Challenge 25 consistently — under 25, ask.\n• Observing behaviour: A child in distress or being neglected? Tell your supervisor/manager immediately. Suspect abuse or harm? It must be reported to the proper authorities.\n• Disruptive or lone minor: Approach calmly, warmly and professionally. Offer to help find their parent or guardian, or move them somewhere safer. Never confront aggressively."
      },
      {
        "heading": "Reporting procedure",
        "body": "If you think a child is at risk or in immediate danger:\n• 1. Tell a supervisor or manager right away.\n• 2. If it needs more, a manager calls the local authorities / child protection services (999 in an emergency).\n• Remember: if in doubt, report it and let the professionals handle it. Overreporting is fine; staying quiet isn't."
      },
      {
        "heading": "Key contacts & kit",
        "body": "• Manager / supervisor on duty — your first port of call for any concern.\n• First-aid kit: ask your manager where the kit and the nearest first-aider are if you don't already know.\n• Fire exits: know your nearest exits before your shift — ask a manager to point them out.\n• Any questions about safeguarding, or a situation you're unsure of — always ask a manager for guidance."
      }
    ],
    "keyPoints": [
      "Under-18s must NEVER be served or allowed to drink alcohol on the premises — no exceptions.",
      "Apply Challenge 25 every time: if someone looks under 25, ask for ID before serving.",
      "If you see a child unattended, in distress, or in a situation that worries you, tell a manager straight away — don't sit on it.",
      "Never confront a child or adult aggressively. Stay calm, friendly and professional.",
      "If in doubt, report it. It's always better to raise a concern and let managers/authorities handle it.",
      "In immediate danger, a manager calls 999 / child protection services — your job is to flag it fast."
    ]
  },
  "slips-trips": {
    "intro": "Slips, trips and falls are the most common accidents in any bar — and No Dice has extra hazards most bars don't: a mini-golf course with obstacles, arcade machines, pool tables and an outdoor beer garden. This module is legally-relevant safety training: knowing the drill protects our guests, our team and No Dice Hackney Ltd.",
    "sections": [
      {
        "heading": "Where the hazards are",
        "body": "Slips, trips and falls can happen anywhere at No Dice — indoors and out. Know the high-risk spots on every shift.\n\nBar & floor:\n• Spills — spilt drinks, water, ice and cocktail ingredients are the #1 slip risk. Clean up immediately.\n• Wet floors — on rainy days, dripping umbrellas and coats near the entrance make floors slippery.\n• Clutter — kegs, boxes, cables and stock left in walkways are trip hazards.\n\nMini-golf course:\n• Obstacles — ramps, raised sections and moving/fixed obstacles are fun but easy to trip on. Watch spots where guests bend, step up or over.\n• Uneven surfaces — raised or uneven areas must be visible and, where needed, clearly marked.\n\nArcade & pool tables:\n• Trailing cables, cues left on the floor, chalk and stools pushed into walkways all cause trips. Keep these areas tidy.\n\nBeer garden (outdoors):\n• Weather changes everything — rain makes decking, paths and course obstacles slippery; wet leaves and debris are hazards; heat can dry out and loosen surfaces. Check outdoor areas regularly."
      },
      {
        "heading": "Your job: prevent them",
        "body": "Every team member is responsible for keeping the floor safe.\n\n• Clean spills straight away — never walk past one. Put out a wet-floor / caution sign while the floor is wet or drying.\n• Do regular walk-rounds — sweep the bar, arcade, pool area, mini-golf course and beer garden for spills, debris and misplaced items.\n• Keep walkways clear — move furniture, stock or equipment blocking a route, especially in busy areas.\n• Keep lighting on — well-lit floors matter most around the course and outdoors where obstacles are harder to see. Report any failed lights to your manager.\n• Use the right kit — non-slip mats where needed; make sure mops, signs and cleaning gear are in good condition. Ask your manager where wet-floor signs and cleaning supplies are kept."
      },
      {
        "heading": "Guests on the mini-golf course",
        "body": "The course is the biggest fall risk we control — get guests set up safely.\n\n• Brief them — before they start, give a quick heads-up about tricky obstacles and remind them to take their time.\n• Signage — clearly mark raised ground, uneven surfaces and any slippery obstacles so guests can see them.\n• Footwear — encourage sensible shoes for the course. High heels and flip-flops raise the risk of slipping and tripping on obstacles."
      },
      {
        "heading": "If someone falls",
        "body": "Minor (not seriously hurt):\n• Help them up gently, check them for injuries, offer assistance.\n• Log the incident — record it in case it's needed later.\n\nSerious injury:\n• Call for medical help immediately (999 for emergencies).\n• Secure the area so no one else steps into the hazard.\n• Give first aid if you're trained. Ask your manager where the first-aid kit and trained first-aiders are.\n• Stay with the person until emergency services arrive.\n\nReport everything:\n• Every incident — however minor — must be reported to a manager and recorded. Records help us spot patterns and stop the next accident. Serious incidents may also need reporting to the authorities (RIDDOR) — your manager handles that."
      },
      {
        "heading": "Cleaning & maintenance",
        "body": "Keep the venue safe over the whole shift, not just at open.\n\n• Regular floor checks — scan high-traffic areas (bar, mini-golf, pool, arcade, beer garden) for spills, debris and hazards.\n• Course inspections — check obstacles are stable and no new hazards have appeared from weather, wear or use. Remove any loose items before guests play.\n• Keep paths clean — clear wet leaves, grass and debris from routes around the course and garden.\n• Report faults — anything you can't fix (broken obstacle, damaged surface, failed light), tell your manager so it gets sorted."
      }
    ],
    "keyPoints": [
      "Clean spills the moment you see them and put out a wet-floor sign — don't walk past.",
      "Keep walkways clear across the bar, arcade, pool tables, mini-golf course and beer garden.",
      "Weather makes outdoor areas and course obstacles slippery — check them regularly.",
      "Brief guests on the mini-golf course and encourage sensible footwear (no heels/flip-flops).",
      "Serious injury: call 999, secure the area, give first aid if trained, stay with them.",
      "Report EVERY incident to a manager, however minor — it must be recorded."
    ]
  },
  "bar-manual": {
    "intro": "This is the master Bar Manual for No Dice, our games bar and kitchen at London Fields (407 Mentmore Terrace, E8 3PH), run by No Dice Hackney Ltd. Read all of it: it covers your daily duties plus the legal rules we must follow to keep our licence, our staff and our customers safe.",
    "sections": [
      {
        "heading": "1. Welcome & what No Dice is about",
        "body": "Welcome to No Dice, our games bar and kitchen at London Fields. We want this to be a fun place to work and drink, but selling alcohol carries real responsibility — to our customers, our neighbours and our licence.\n\nThe venue genuinely has a lot going on: a mini-golf course, arcade and pinball machines, pool tables and a beer garden, alongside the bar and kitchen. Your job is to keep all of it running safely and give guests a great time.\n\nThis manual sets out our policies and daily/weekly tasks. Read the whole thing so you know your responsibilities. If anything isn't clear, ask your manager — don't guess."
      },
      {
        "heading": "2. Who we serve (age, entry & refusal)",
        "body": "We run Challenge 25. If a customer looks under 25, ask for ID before serving alcohol. The ONLY acceptable ID is a passport, UK driving licence, or a card with the PASS hologram.\n• If someone's buying a round for friends who look under 25, ask to see their IDs too — even if they're sitting down.\n• Under-18s are only allowed in during daytime hours if with a responsible adult, or at a private event. They must never buy or drink alcohol.\n• Evenings are over-18s only, unless it's a private event.\n\nWe can refuse entry or service to anyone at the manager's discretion, and can ask anyone to leave. Grounds include: being drunk, no valid ID, aggressive/abusive/destructive behaviour, or suspected possession of drugs, weapons or outside alcohol. Any staff member can refuse service if they suspect someone is drunk or on drugs — then call the duty manager. Log every incident on an incident form."
      },
      {
        "heading": "3. Serving alcohol responsibly",
        "body": "Our rule is simple: never serve someone who's had too much. Offer water or a soft drink instead and, if needed, ask them to leave. Free drinking water is always available during opening hours.\n\nAt the bar:\n• Always ask single or double on a spirit + mixer.\n• Never reuse a glass, even if the customer offers.\n• Always use a scoop or tongs for ice — never scoop with a glass.\n• Never serve spirits above a double in one glass, don't mix spirits in one glass except in recognised cocktails, and never add spirits to a draught product (e.g. whisky in a pint).\n• We don't normally stock anything over 50% ABV, and never apply a flame to a spirit or use dry ice / liquid nitrogen.\n\nDrink-driving: if you know a customer is driving, don't recommend alcohol — steer them to soft drinks. There's no safe limit. We keep local taxi numbers at the bar.\n\nDrink spiking: if a customer seems suddenly unwell, disoriented, or can't identify who they came with, treat them as a casualty — first aid, help getting home, find a friend. If you suspect spiking, treat it as a crime and call emergency services."
      },
      {
        "heading": "4. Drugs policy",
        "body": "We do not permit possession, use or supply of illegal drugs on the premises (Misuse of Drugs Act 1971). Refuse entry or service to anyone suspected of being under the influence of illegal drugs.\n\nIf you suspect dealing, ask the customer to leave. If someone is found in possession, ask them to leave immediately; if they refuse, call the police. Any drugs found on the premises are disposed of via general waste.\n\nAll drugs incidents are logged on an incident form and decisions rest with the duty manager. A customer found in possession is banned — normally a minimum of 12 months. Incident forms are kept on file and made available to police.\n\nKeeping people safe: free water is offered, staff watch for anyone badly affected, and we'll refuse further alcohol and arrange safe passage home or medical help where someone's wellbeing is at risk."
      },
      {
        "heading": "5. Ejections & safety of staff/customers",
        "body": "We have a duty of care over customers even when removing them. If someone's being ejected for being too drunk, make sure a friend is with them to get home safely — or call an ambulance if you believe they're at real risk of harm.\n\nStandard procedure:\n1. Politely ask them to leave and give the reason (e.g. too drunk).\n2. If they refuse, warn them at least twice that refusing will mean police are called.\n3. If they still refuse, call the police.\n\nFor violence or serious offences, skip straight to calling the police. This is the ideal procedure — in the real world you may not always be able to follow it to the letter. Your safety and customers' safety come first: if you feel threatened, or believe anyone is at risk of harm, call the police immediately."
      },
      {
        "heading": "6. Safe Space, licensing objectives & CCTV",
        "body": "No Dice operates a Safe Space Policy. We will not tolerate racist, sexist, homophobic or disablist language or behaviour. Contravention means being barred. Help us keep this a place everyone can enjoy.\n\nWe work to the four licensing objectives, especially preventing crime and disorder, and we engage constructively with local residents, the police and Hackney Council. Keep noise down, respect the neighbourhood, and help disperse crowds quietly at closing.\n\nCCTV runs in line with data-protection law (GDPR) to keep people safe and help catch offenders. Our alcohol policy and code of practice is reviewed at least annually and after any major incident.\n\nLost property: never offer to “mind” or “keep an eye on” customers' belongings — we don't accept responsibility for them. Found items go somewhere staff-only; high-value items (wallets, phones, passports) go in the manager's safe."
      },
      {
        "heading": "7. Health, safety & fire",
        "body": "Fire exits: check they're clear before opening and throughout the shift — clear any obstruction immediately. Know your role in an emergency and the congregation point (ask your manager if you're unsure where it is).\n\n• Spillages and breakages: clear immediately, use wet-floor signs, and spot hazards before they cause a slip.\n• Manual handling: if you're not comfortable or trained to lift something, don't. Use the equipment provided.\n• COSHH: keep cleaning chemicals in their original labelled containers — never decant — and follow the instructions.\n• Faulty electricals: unplug/switch off at the wall, add an “out of order” sign, tell staff not to use it, and report it to your manager.\n• Report every accident — staff or customer — on an incident form.\n\nThe first-aid kit and incident forms are kept in a set place — ask your manager to show you where on your first shift."
      },
      {
        "heading": "8. Cash & till",
        "body": "We use the till/POS system for all sales.\n• Don't ask customers whether they want to pay by cash or card — only take cash if they ask to pay that way.\n• Check any note over £10 with the UV torch and forgery-checker pen.\n• If cash is taken from the cash box for petty cash, leave a receipt with the person's name written on the back.\n\nAt the end of the night, charge the card reader for the next day."
      },
      {
        "heading": "9. Opening the venue",
        "body": "Venue: switch on all lights (dim but usable), put personal bags in the manager's office, wipe tables if needed, put out food menus, check table/chair/stool positions.\n\nBar: check and restock fridges, switch on fridge / back-bar / tap lights, set up bar and glass washer, stock napkins and straws and side shelves, slice fruit (limes cut into wedges; lemons and oranges sliced), check tokens behind the bar, and check bar snacks. Don't top up the peanut/olive jars until they're completely empty — old stock sitting at the bottom is a hygiene risk. Set air con or heating to suit the weather.\n\nGames: switch on pinball and arcade machines, check ten balls per foosball table, clean pinball glass (only the proper glass cleaner), check pool tables are set up. Golf: clear balls back to the bucket, check for damage (report it), sweep/light the course as relevant.\n\nToilets: refill toilet roll, soap and blue roll; check locks and flushes work; make sure they're clean.\n\nJust before opening: get ice, switch on speakers and connect the music, open the till, unlock the fire doors, open the customer entrances, and flip the sign to Open."
      },
      {
        "heading": "10. During service",
        "body": "Bar: keep storage areas tidy, cut more fruit during quiet spells before you run low, label opened juice cartons with the date, and only ever use glass-polishing cloths on glasses (never surface cloths).\n\nGames & golf: if the golf course is quiet, customers can play straight away. If it's busy, list the waiting groups (size, lead name, where they're sitting), give smaller groups priority, and split large groups into fours. If an arcade machine eats a token, give an “X” token replacement. If a machine plays up, turn it off and on once — if that doesn't fix it, switch it off and tell your manager. Never try to repair a machine yourself.\n\nFood orders: give the customer an order number, check any dip choices, write the order slip with the number and pass it to the kitchen. Collect menus when the kitchen closes.\n\nKeep it clean as you go: clear empty glasses from the bar, golf course and beer garden, keep floors and furniture tidy, and regularly check/refill the toilets.\n\nQuiet-period offers (when the venue's calm): a token with each drink, a round of golf for £5, 2-for-1 cocktails, and ask happy customers for a Google review."
      },
      {
        "heading": "11. Last orders, closing & locking up",
        "body": "Last orders: 15 minutes before close — ring the bell. Offer table service to customers deep in a game who can't get to the bar. The very last order is 1 minute before close, no exceptions. Drinking-up time is 30 minutes; offer plastic cups for any drinks not finished. (Last entry any evening is 23:45.)\n\nAfter close: music off, lights fully up, get everyone out, then lock the front and fire doors. Collect all glasses from the floor, golf course and beer garden.\n\nBar shutdown: restock fridges/shelves, switch off fridge and tap lights, cover speed-pourer spirits, wash all barware and bar runners in the glass washer, wipe down surfaces and back-bar bottles with anti-bac, clean fridge doors with glass cleaner, break down and clean the glass washer, pump open wine bottles, fridge any leftover cut fruit, empty/reline bins, then mop behind the bar and the rubber mats. Food waste and straws go to the correct bins (straws = mixed recycling).\n\nGames & venue: switch off arcade/pinball, clean pinball glass and foosball/pool surfaces, wipe all tables with anti-bac, reset furniture (level tables with rubber feet), and clear the golf course.\n\nBefore leaving: air con/heating off, charge the tablet and card reader, lights off, sign to Closed, set the alarm and lock up."
      },
      {
        "heading": "12. Cleaning schedule (daily & weekly)",
        "body": "Beyond the nightly clean-down, we run a weekly rota:\n• Wednesday — clean the refuse area, deep-clean/salt the dishwasher, wipe down stools and chairs.\n• Thursday — wipe the golf course and bumpers, clean front windows from inside, deep-clean the ice machine.\n• Friday — clean the back-bar light box and all back-bar bottles.\n• Saturday — clean golf balls and clubs, and the course and bumpers again.\n• Sunday — deep-clean all bar shelves (wash glasses and grip mats, clean shelves, put back), clean the bins, and check board games for missing parts (notes go inside the box lids)."
      },
      {
        "heading": "13. Cellar, deliveries, lines & waste",
        "body": "Stock ordering: the Sunday closer lists what we're short on — pay special attention to bar snacks and soft drinks, which are harder to track on the till. Orders go to our supplier and, if placed before the cut-off, arrive next day.\n\nDeliveries: the delivery team may have keys, so stock can arrive without staff present. Bring empty kegs and gas cylinders up the evening before so they can be taken away.\n\nCellar hatch — SAFETY CRITICAL: the hatch may only be opened with two staff present — one at the hatch on the ground floor, one in the cellar. Tell anyone else in the venue and get them to confirm they've understood. The person at the hatch must not leave it until it's shut. Only kegs are rolled/dropped down (warn the person below so they're off the crash mat first) — everything else is passed down by hand, never dropped. Close the hatch immediately after the last item.\n\nLine cleaning (if beer lines are installed): scheduled every two weeks, ideally on a closed day; if on an open day it must start by 1pm and finish by 4pm. It's dangerous work — only trained staff do it (ask your manager who's trained), wearing rubber gloves, eye protection, closed-toe shoes and no exposed skin on the arms. While one person cleans lines, the other does cellar maintenance: break down cardboard (each bundle under 5kg, labelled), remove it, then sweep and mop the store areas and cellar.\n\nWaste & recycling: we use pre-paid sacks — general waste, mixed recycling and glass — so only put the right items in each and only use them for their purpose. Full sacks go to the rubbish store at the rear.\n\nEvents & staffing: events need extra staff — roughly two staff for 20–40 guests, four for 40–60, six for 60–90, eight for 90–120."
      }
    ],
    "keyPoints": [
      "Challenge 25 is law here: if someone looks under 25, ask for ID before serving alcohol. Only a passport, driving licence, or PASS-hologram card counts.",
      "Free tap water is always available, and we refuse service to anyone who's had too much or is suspected of drug use — safety over sales, every time.",
      "Check fire exits are clear before opening and throughout the shift. Report every accident, ejection, or drugs incident on an incident form.",
      "Last orders is 15 minutes before close; the very last order is 1 minute before close, no exceptions. Last entry 23:45, 30-minute drinking-up time.",
      "Never reuse a glass, always scoop ice with a scoop/tongs (never a glass), and always ask single or double on spirits.",
      "Two staff are required to open the cellar hatch — one at the hatch upstairs, one below — and the person up top must not leave the hatch until it's shut."
    ]
  }
}

export const MODULES = MODULE_META.map(m => ({ ...m, ...(MODULE_CONTENT[m.key] || { intro: '', sections: [], keyPoints: [] }) }))
export const moduleByKey = (key) => MODULES.find(m => m.key === key) || null
export const MODULE_KEYS = MODULE_META.map(m => m.key)
export const cocktailKey = (id) => `cocktail:${id}`
