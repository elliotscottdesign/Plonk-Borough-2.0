// No Dice — training quizzes. One MCQ bank per training module (keyed by the same
// module key as MODULE_META). Staff "test yourself" after reading a module; the
// founder pulls the same questions up to spot-check on shift. Each question:
//   { q, options: [4 strings], answer: <0-3>, why }
// Banks are authored from the module content (see the author-training-quizzes workflow).

export const PASS_MARK = 0.8   // 80% to pass — matches a typical Level 2 exam

export const QUIZZES = {
  "food-safety-l2": [
    {
      "q": "What temperature range is the food 'danger zone'?",
      "options": [
        "0-5 °C",
        "5-37 °C",
        "8-63 °C",
        "63-100 °C"
      ],
      "answer": 2,
      "why": "Bacteria multiply fastest between 8 °C and 63 °C, so food must be kept hot or cold, never left in between."
    },
    {
      "q": "What core temperature should food reach in its thickest part when cooked?",
      "options": [
        "45 °C",
        "63 °C",
        "70 °C",
        "75 °C"
      ],
      "answer": 3,
      "why": "We cook to 75 °C in the thickest part (or 70 °C held for 2 minutes) to make food safe."
    },
    {
      "q": "How many times may cooked food be reheated?",
      "options": [
        "Once only",
        "Twice",
        "As many times as needed",
        "Three times"
      ],
      "answer": 0,
      "why": "Food may be reheated once only, and must reach 75 °C (piping hot)."
    },
    {
      "q": "What temperature should a fridge be kept at?",
      "options": [
        "Any temperature below room temperature",
        "5 °C or below",
        "15 °C or below",
        "Exactly 8 °C"
      ],
      "answer": 1,
      "why": "Chilled food is kept at 5 °C or below (target 0-5 °C); the legal maximum is 8 °C."
    },
    {
      "q": "What temperature should the freezer be kept at?",
      "options": [
        "0 °C or below",
        "-5 °C or below",
        "-18 °C or below",
        "-30 °C exactly"
      ],
      "answer": 2,
      "why": "Frozen food must be held at -18 °C or below, checked at open and close."
    },
    {
      "q": "The four types of food hazard are microbiological, physical, chemical and which one?",
      "options": [
        "Allergenic",
        "Nutritional",
        "Visual",
        "Thermal"
      ],
      "answer": 0,
      "why": "The four hazards are microbiological, physical, chemical and allergenic (the 14 allergens)."
    },
    {
      "q": "Which of these is an example of a physical hazard?",
      "options": [
        "Salmonella bacteria",
        "Cleaning sanitiser",
        "A strand of hair",
        "Peanut traces"
      ],
      "answer": 2,
      "why": "Physical hazards are objects in food such as glass, metal, hair, blue plaster or packaging."
    },
    {
      "q": "Which colour chopping board is used for raw meat?",
      "options": [
        "Green",
        "Yellow",
        "Blue",
        "Red"
      ],
      "answer": 3,
      "why": "Red = raw meat, yellow = cooked meat, green = salad/veg."
    },
    {
      "q": "Where should raw meat be stored in the fridge?",
      "options": [
        "In the same container as salad",
        "Below ready-to-eat food",
        "Above ready-to-eat food",
        "Next to cooked food"
      ],
      "answer": 1,
      "why": "Raw meat goes below ready-to-eat food so its juices can't drip onto it."
    },
    {
      "q": "After diarrhoea or vomiting, how long must a food handler stay off before handling food again?",
      "options": [
        "24 hours",
        "Until they feel better",
        "48 hours after the last symptom",
        "One week"
      ],
      "answer": 2,
      "why": "You must not handle food with diarrhoea or vomiting, and must stay off for 48 hours after the last symptom."
    },
    {
      "q": "Why are the plasters used in the kitchen blue?",
      "options": [
        "It is the cheapest colour",
        "So they are easy to spot if they fall into food",
        "Blue repels bacteria",
        "It matches the uniform"
      ],
      "answer": 1,
      "why": "Blue detectable plasters stand out so they can be seen easily if one falls into food."
    },
    {
      "q": "What does a 'use-by' date tell you?",
      "options": [
        "It is about quality only",
        "It is just a guideline",
        "It only applies to frozen food",
        "It is about safety - never use food after it"
      ],
      "answer": 3,
      "why": "Use-by is about safety; it is illegal to use food after it. Best-before is only about quality."
    }
  ],
  "allergens": [
    {
      "q": "When did Natasha's Law come into force?",
      "options": [
        "October 2021",
        "January 2020",
        "March 2023",
        "October 2018"
      ],
      "answer": 0,
      "why": "The module states Natasha's Law has been in force since October 2021, requiring clear, accurate allergen information."
    },
    {
      "q": "How many major allergens must be identified by law in food products?",
      "options": [
        "10",
        "12",
        "14",
        "8"
      ],
      "answer": 2,
      "why": "By law, 14 major allergens must be identified in any food product."
    },
    {
      "q": "Which allergen do bartenders most often miss, and is common in wine-based products?",
      "options": [
        "Celery",
        "Mustard",
        "Lupin",
        "Sulphites (sulphur dioxide)"
      ],
      "answer": 3,
      "why": "Sulphites (sulphur dioxide) are common in wine and wine-based products and are the allergen bartenders miss most."
    },
    {
      "q": "A customer mentions a nut allergy. What should you do before making their drink?",
      "options": [
        "Make the drink and hope for the best",
        "Ask about the allergy and check ingredients before making it",
        "Tell them all our drinks are fine",
        "Refuse to serve them anything at all"
      ],
      "answer": 1,
      "why": "Always ask and check before making the drink if a customer mentions an allergy — never guess or assume."
    },
    {
      "q": "On a pre-packed snack label, how are the allergens shown?",
      "options": [
        "In bold or a different colour",
        "In tiny print at the very bottom",
        "Only in a separate leaflet",
        "They are not shown at all"
      ],
      "answer": 0,
      "why": "On the ingredient list, allergens are shown in bold or a different colour."
    },
    {
      "q": "A customer has a serious reaction with trouble breathing and throat swelling. What do you do first?",
      "options": [
        "Give them water and wait to see if it passes",
        "Call 999 immediately and be ready to name the suspected allergen",
        "Send them home in a taxi",
        "Finish serving other customers first"
      ],
      "answer": 1,
      "why": "For anything serious or life-threatening, call 999 immediately and be ready to name the suspected allergen."
    },
    {
      "q": "You are not sure whether a snack contains an allergen. What is the right thing to do?",
      "options": [
        "Guess based on the product name",
        "Tell the customer it is probably fine",
        "Check the label or ask a manager before serving",
        "Serve it without mentioning anything"
      ],
      "answer": 2,
      "why": "If you can't confirm a product is safe, check the label or ask a manager — never reassure on a guess."
    },
    {
      "q": "A customer is allergic to nuts. What is the best response according to the module?",
      "options": [
        "Just say no and move on",
        "Tell them to check for themselves",
        "Serve the nuts anyway",
        "Offer a safe nut-free alternative"
      ],
      "answer": 3,
      "why": "Never just say 'no' — always offer a safe alternative, such as a nut-free snack."
    }
  ],
  "food-safety": [
    {
      "q": "How should you wash your hands before handling garnishes, snacks or ingredients?",
      "options": [
        "With soap and warm water for at least 20 seconds",
        "A quick rinse under cold water",
        "For about 5 seconds",
        "Only when they look dirty"
      ],
      "answer": 0,
      "why": "Wash hands with soap and warm water for at least 20 seconds before touching any garnish, snack or ingredient."
    },
    {
      "q": "How should you place a fruit garnish into a customer's drink?",
      "options": [
        "With your clean bare hands",
        "With clean tongs or gloves",
        "With whatever tool is nearest",
        "With the same knife you cut it with"
      ],
      "answer": 1,
      "why": "Never touch a garnish going into a glass with bare hands - use clean tongs or gloves."
    },
    {
      "q": "Where should you cut fruit garnishes?",
      "options": [
        "Straight on the bar counter",
        "On a plate",
        "On a clean, sanitised board",
        "On any free surface"
      ],
      "answer": 2,
      "why": "Cut fruit on a clean, sanitised board and knife - never straight on the bar counter."
    },
    {
      "q": "How should fresh fruit like lemons, limes and berries be stored?",
      "options": [
        "At room temperature on the bar",
        "In a dry cupboard",
        "In the freezer",
        "In the fridge"
      ],
      "answer": 3,
      "why": "Fresh fruit lives in the fridge and should be binned if it looks spoiled."
    },
    {
      "q": "A customer finds a hair in their drink. What should you do?",
      "options": [
        "Ignore it and carry on",
        "Apologise, offer a replacement and tell your manager",
        "Argue that it isn't yours",
        "Charge them for the drink anyway"
      ],
      "answer": 1,
      "why": "For any food safety complaint, apologise, offer a replacement or fix, and tell your manager so it's logged."
    },
    {
      "q": "Why should you keep separate tools and boards for fresh fruit?",
      "options": [
        "To avoid cross-contamination",
        "To save on washing up",
        "Because it looks tidier",
        "It is not really necessary"
      ],
      "answer": 0,
      "why": "Keeping separate tools for fresh fruit prevents cross-contamination with anything that might carry allergens."
    }
  ],
  "challenge-25": [
    {
      "q": "You're serving a group at the bar. Under Challenge 25, who do you ask for ID?",
      "options": [
        "Anyone who looks under 25 — even if you're sure they're over 18",
        "Only anyone who looks under 18",
        "Only when a manager tells you to",
        "No one, once you've judged they look over 18"
      ],
      "answer": 0,
      "why": "Challenge 25 means anyone who looks under 25 must show ID, giving a 7-year safety buffer above 18."
    },
    {
      "q": "Why does the policy use 25 as the cut-off rather than 18?",
      "options": [
        "Because 25 is the legal drinking age",
        "Because IDs only show ages up to 25",
        "It's a 7-year safety buffer so we never accidentally serve someone under 18",
        "Because Hackney Council sets a local drinking age of 25"
      ],
      "answer": 2,
      "why": "The extra 7 years is a deliberate safety margin to make sure no under-18 is ever served."
    },
    {
      "q": "Which of these is an acceptable form of ID at No Dice?",
      "options": [
        "A clear photo of a passport on the customer's phone",
        "A valid, in-date passport",
        "A student union card",
        "A bank card with the customer's name"
      ],
      "answer": 1,
      "why": "Only valid, in-date, original documents like a passport, UK/EU photocard licence, PASS card or military/national ID are accepted — never photos, student or bank cards."
    },
    {
      "q": "A customer hands you a driving licence that expired last month. What do you do?",
      "options": [
        "Accept it — the photo still matches",
        "Accept it if they also show a bank card",
        "Accept it but log it in the refusals book",
        "Treat it as no ID and refuse service"
      ],
      "answer": 3,
      "why": "Expired ID does not count — treat it as no ID and refuse to serve."
    },
    {
      "q": "If you sell alcohol to someone under 18, what can happen to you personally?",
      "options": [
        "You can be personally fined up to £5,000",
        "Nothing — only the venue is liable",
        "You get a written warning only",
        "You must pay a £50 fixed fee"
      ],
      "answer": 0,
      "why": "Under the Licensing Act 2003 the individual server can be personally fined up to £5,000."
    },
    {
      "q": "An adult with valid ID offers to buy drinks for a friend who looks under 18 and has no ID. What is this?",
      "options": [
        "Fine, because the buyer is an adult",
        "Only a problem if the under-18 drinks it at the bar",
        "A proxy purchase — it's illegal and you must refuse",
        "Allowed if the adult signs the refusals book"
      ],
      "answer": 2,
      "why": "Serving an adult who is buying for a minor is a proxy purchase and is illegal under the Licensing Act 2003."
    },
    {
      "q": "When should you complete the till's age-verification prompt?",
      "options": [
        "At the end of the night with all the other refusals",
        "Before ringing the drink through",
        "Only if the customer looks under 18",
        "After you've served the drink"
      ],
      "answer": 1,
      "why": "Complete the age prompt before ringing the drink — it creates a digital record that protects you and the venue."
    },
    {
      "q": "You refuse service because an ID looks fake. What must you record in the refusals log?",
      "options": [
        "Just the time",
        "Only the customer's name and address",
        "Nothing — a verbal note to the manager is enough",
        "Date/time, a description of the customer, the reason, and your initials"
      ],
      "answer": 3,
      "why": "Every refusal is logged with date/time, customer description, reason and your initials as proof to Hackney Council and police."
    }
  ],
  "conflict": [
    {
      "q": "A guest is agitated and getting worked up. What does the de-escalation guidance say about physical contact?",
      "options": [
        "A hand on the shoulder helps calm them",
        "Gently guide them to the door by the arm",
        "Never make physical contact — step back and give them room",
        "Only touch them if they touch you first"
      ],
      "answer": 2,
      "why": "De-escalation means creating space and never making physical contact with an agitated guest."
    },
    {
      "q": "Refusing service to a clearly intoxicated guest is best described as:",
      "options": [
        "A legal duty under our Hackney premises licence",
        "A personal judgement call you can skip if they're calm",
        "Only the manager's job, never yours",
        "Optional unless the police are present"
      ],
      "answer": 0,
      "why": "Refusing service to someone who's had too much is a legal duty under the Hackney licence, not a judgement call."
    },
    {
      "q": "Two groups are arguing over whose turn it is on the pool table. How should you handle it?",
      "options": [
        "Pick whichever group asked you first",
        "Take the side of the regulars",
        "Let them sort it out between themselves",
        "Stick to the house rules and stay impartial — the rules decide, not you"
      ],
      "answer": 3,
      "why": "For games disputes you stay impartial and apply the house rules; the rules settle it, not your opinion."
    },
    {
      "q": "Which situation means you should involve a manager or call for support rather than handle it alone?",
      "options": [
        "A guest politely asks for a drink recommendation",
        "A guest becomes aggressive or threatening, or you feel unsafe",
        "A guest asks where the toilets are",
        "A guest wants to pay by cash"
      ],
      "answer": 1,
      "why": "Aggression, threats or feeling unsafe are exactly when to flag it early and get a manager — don't tough it out alone."
    },
    {
      "q": "After you've dealt with a conflict, what should you record in the incident book?",
      "options": [
        "Only whether the police were called",
        "Nothing, unless someone was injured",
        "Date/time, who was involved, what happened and what you did",
        "Just your own name"
      ],
      "answer": 2,
      "why": "An accurate incident log records the time, people involved, the nature of the conflict and your actions — it protects you and the venue."
    }
  ],
  "drink-spiking": [
    {
      "q": "What counts as drink spiking?",
      "options": [
        "Only secretly adding illegal drugs to a drink",
        "Secretly adding drugs OR extra alcohol to someone's drink without their consent",
        "Serving someone a stronger cocktail than they ordered by mistake",
        "A customer buying their own double instead of a single"
      ],
      "answer": 1,
      "why": "Spiking is secretly putting drugs or extra alcohol into someone's drink without them knowing or agreeing."
    },
    {
      "q": "You suspect a customer's drink has been spiked. What should you do with the drink itself?",
      "options": [
        "Tip it away so no one drinks it by accident",
        "Give it back to the customer to finish",
        "Wash the glass immediately for hygiene",
        "Keep it — don't let it be thrown away, as it can be tested"
      ],
      "answer": 3,
      "why": "Keep the drink and don't let it be cleared away — it can be tested to confirm tampering."
    },
    {
      "q": "Which of these is a warning sign that someone may have been spiked?",
      "options": [
        "Becoming very drunk, confused or unsteady after only a small amount to drink",
        "Asking for a glass of water",
        "Wanting to pay their tab and leave",
        "Ordering a second round for their table"
      ],
      "answer": 0,
      "why": "A sudden change — heavy drunkenness, confusion or trouble walking after little alcohol — is a key sign of spiking."
    },
    {
      "q": "Which practice helps prevent spiking on shift?",
      "options": [
        "Leaving finished drinks on the bar for a while",
        "Making drinks out of sight in the back",
        "Making drinks in front of the customer and handing them straight over",
        "Encouraging customers to leave drinks unattended while they play golf"
      ],
      "answer": 2,
      "why": "Preparing drinks in front of the customer and handing them over directly, and never leaving drinks unattended, helps prevent spiking."
    },
    {
      "q": "A customer you think has been spiked is very distressed and seriously unwell. What should you do?",
      "options": [
        "Send them home in a taxi on their own",
        "Call 999 straight away and never leave them alone until help arrives",
        "Wait to see if they feel better before acting",
        "Ask them to leave so it doesn't upset other guests"
      ],
      "answer": 1,
      "why": "Serious symptoms or distress mean calling 999 immediately, and you never leave the customer alone until help arrives."
    }
  ],
  "drugs": [
    {
      "q": "Which of these does the module count as a 'legal drug' that can still impair a customer?",
      "options": [
        "Cocaine",
        "Ecstasy",
        "Heroin",
        "Alcohol, nicotine or prescription medication"
      ],
      "answer": 3,
      "why": "Legal drugs — alcohol, nicotine and prescription medication — can still impair behaviour, alongside illegal drugs."
    },
    {
      "q": "Why is combining alcohol with drugs especially dangerous?",
      "options": [
        "It can intensify the effects of both and cause far more severe impairment",
        "It has no extra effect at all",
        "It only affects illegal drugs, not legal ones",
        "It makes people sober up faster"
      ],
      "answer": 0,
      "why": "Mixing alcohol with drugs — legal or illegal — can intensify both and cause much more severe impairment."
    },
    {
      "q": "You find someone unconscious but breathing. What should you do?",
      "options": [
        "Sit them upright on a stool",
        "Give them water to wake them up",
        "Place them in the recovery position to keep their airway clear",
        "Leave them to sleep it off alone"
      ],
      "answer": 2,
      "why": "If someone is unconscious but breathing, put them in the recovery position to keep the airway clear while help comes."
    },
    {
      "q": "A customer is behaving oddly. What does the module say to keep in mind before you decide it's drugs?",
      "options": [
        "Always assume it's drugs and refuse service immediately",
        "Don't jump to conclusions — stress, anxiety or a medical issue can look similar",
        "Ignore it unless another customer complains",
        "Search their bag to be sure"
      ],
      "answer": 1,
      "why": "Not every change in behaviour is drugs — stress, anxiety or a medical issue can look the same, so assess thoughtfully."
    },
    {
      "q": "You've refused service to a customer who's under the influence. What else should you do?",
      "options": [
        "Nothing further is needed",
        "Keep it off the record to avoid embarrassing them",
        "Ban them permanently on the spot yourself",
        "Offer a safe exit (water, taxi/ride-share), tell your manager and record the refusal"
      ],
      "answer": 3,
      "why": "Alongside refusing, offer a safe exit, tell your manager and make sure the refusal is properly recorded."
    }
  ],
  "safeguarding": [
    {
      "q": "What is the rule on under-18s and alcohol at No Dice?",
      "options": [
        "They must never be served alcohol or allowed to drink it — no exceptions",
        "They may have one drink if a parent agrees",
        "They can drink at private events only",
        "They can drink in the beer garden but not at the bar"
      ],
      "answer": 0,
      "why": "Under-18s must never be served alcohol or allowed to drink it on the premises — full stop."
    },
    {
      "q": "You notice a child who seems distressed and is on their own. What should you do?",
      "options": [
        "Firmly tell them to find their parents themselves",
        "Ignore it — it's not your job",
        "Tell a manager straight away and approach the child calmly and warmly",
        "Escort them off the premises"
      ],
      "answer": 2,
      "why": "A child in distress or alone should be flagged to a manager immediately, and approached calmly and warmly, never aggressively."
    },
    {
      "q": "You're not sure whether a situation involving a child is serious. What's the right approach?",
      "options": [
        "Say nothing unless you're certain there's a problem",
        "If in doubt, report it — overreporting is fine, staying quiet isn't",
        "Wait until the end of your shift to mention it",
        "Deal with it yourself without telling anyone"
      ],
      "answer": 1,
      "why": "The guidance is clear: if in doubt, report it and let the professionals handle it — overreporting is fine."
    },
    {
      "q": "How do you handle age verification as part of safeguarding?",
      "options": [
        "Only check ID of people who look under 18",
        "Never ask adults for ID",
        "Rely on how customers say they feel",
        "Apply Challenge 25 — if someone looks under 25, ask for ID"
      ],
      "answer": 3,
      "why": "Safeguarding relies on applying Challenge 25 consistently: if anyone looks under 25, ask for ID before serving."
    },
    {
      "q": "A child appears to be in immediate danger. Who calls 999 or child protection services?",
      "options": [
        "You call and handle the whole thing yourself",
        "No one — you wait and watch",
        "A manager calls 999 / child protection; your job is to flag it fast",
        "The child's parent must call"
      ],
      "answer": 2,
      "why": "In immediate danger a manager calls 999 or child protection services — your role is to flag the concern quickly."
    }
  ],
  "fire-safety": [
    {
      "q": "A small electrical fire starts in a blender behind the bar. Which type of extinguisher must you NOT use on it?",
      "options": [
        "CO2",
        "Foam",
        "Powder",
        "Water"
      ],
      "answer": 3,
      "why": "Water is for Class A only (wood, paper, textiles) and must never be used on electrical fires or flammable liquids."
    },
    {
      "q": "You discover a fire in the venue. What is the correct first action?",
      "options": [
        "Raise the alarm — shout FIRE and set off the nearest fire alarm",
        "Grab an extinguisher and put it out yourself",
        "Finish serving your current customer first",
        "Phone your manager at home for instructions"
      ],
      "answer": 0,
      "why": "Raising the alarm to warn everyone comes first so people can start evacuating."
    },
    {
      "q": "While evacuating customers during a fire, you should:",
      "options": [
        "Use the lift to move people out faster",
        "Direct customers to the nearest fire exit and never use lifts",
        "Send everyone back for their belongings first",
        "Keep them waiting at the bar for an all-clear"
      ],
      "answer": 1,
      "why": "Guide people calmly to the nearest fire exit — lifts must never be used in a fire."
    },
    {
      "q": "When using a fire extinguisher, what does the PASS method stand for?",
      "options": [
        "Point, Alarm, Spray, Stop",
        "Push, Angle, Stand, Shout",
        "Pull, Aim, Squeeze, Sweep",
        "Prepare, Assess, Signal, Silence"
      ],
      "answer": 2,
      "why": "PASS = Pull the pin, Aim at the base of the fire, Squeeze the handle, Sweep side to side."
    },
    {
      "q": "Which of these is a recommended way to prevent fires at No Dice?",
      "options": [
        "Store high-proof spirits next to the cocktail torches for convenience",
        "Leave heating equipment switched on between uses to save time",
        "Pile waste paper and bins near the electrics",
        "Keep every fire exit clear and unobstructed at all times"
      ],
      "answer": 3,
      "why": "Keeping exits and work areas clear of clutter is a core fire-prevention step; flammables must be kept away from heat."
    },
    {
      "q": "Once everyone is safely outside after evacuating, you should:",
      "options": [
        "Go back inside to look for any stragglers",
        "Do a headcount and not re-enter until the fire service says it's safe",
        "Re-enter to grab the till and cash",
        "Let customers wander off from the assembly point"
      ],
      "answer": 1,
      "why": "Do a headcount to confirm everyone is out, and never re-enter until the fire service confirms it is safe."
    }
  ],
  "first-aid": [
    {
      "q": "For a burn or scald, how long should you cool it under running water?",
      "options": [
        "30 seconds",
        "2 minutes",
        "5 minutes",
        "At least 10 minutes"
      ],
      "answer": 3,
      "why": "Cool a burn or scald under running water for at least 10 minutes — no ice, creams or ointments."
    },
    {
      "q": "A conscious adult is choking and can no longer cough or speak. After encouraging coughing, what comes next?",
      "options": [
        "Give them a drink of water to wash it down",
        "5 sharp back blows between the shoulder blades",
        "Start CPR straight away",
        "Lay them down and raise their legs"
      ],
      "answer": 1,
      "why": "If they can't cough or speak, give 5 sharp back blows, then abdominal thrusts if it's still stuck."
    },
    {
      "q": "You are treating severe bleeding but there is an object embedded in the wound. You should:",
      "options": [
        "Pull the object out, then apply pressure",
        "Apply firm pressure directly on top of the object",
        "Press around the object and do not remove it",
        "Pour antiseptic into the open wound"
      ],
      "answer": 2,
      "why": "Never remove an embedded object — press around it while keeping firm pressure on the wound."
    },
    {
      "q": "When you call 999 for a serious emergency, what information should you give?",
      "options": [
        "The nature of the injury, the exact location in the venue, and how many people are hurt",
        "Only the injured customer's name",
        "Just ask them to send an ambulance quickly",
        "The venue's opening hours and address only"
      ],
      "answer": 0,
      "why": "Tell them the nature of the injury, the exact spot in the venue, and how many people are hurt."
    },
    {
      "q": "A guest develops swelling, hives and difficulty breathing after eating a snack. What should you do?",
      "options": [
        "Give them water and wait to see if it passes",
        "Move them outside into the fresh air",
        "Offer them an antihistamine from the first-aid kit",
        "Call 999 immediately and help them use their EpiPen if they have one"
      ],
      "answer": 3,
      "why": "Anaphylaxis can be life-threatening — call 999 now and help them use their EpiPen straight away."
    },
    {
      "q": "After dealing with any first-aid incident, what must always happen?",
      "options": [
        "Post about it on social media",
        "Fill in an Accident Report Form and tell a manager",
        "Nothing further, as long as the person recovered",
        "Send the injured guest straight home"
      ],
      "answer": 1,
      "why": "Every incident gets an Accident Report Form and a manager told — no exceptions."
    }
  ],
  "health-safety": [
    {
      "q": "Which hazard is described as the most common risk at No Dice?",
      "options": [
        "Fire",
        "Electrical faults",
        "Manual handling injuries",
        "Slips from spills and wet floors"
      ],
      "answer": 3,
      "why": "Slips are our most common risk — clean spills immediately and put out the wet-floor sign."
    },
    {
      "q": "You notice a spill on the floor during a busy shift. What should you do?",
      "options": [
        "Clean it immediately and put out the wet-floor sign",
        "Leave it — someone will clean it later",
        "Just tell customers to walk around it",
        "Wait until the end of the shift to deal with it"
      ],
      "answer": 0,
      "why": "Spills should be cleaned immediately and the wet-floor sign put out to prevent slips."
    },
    {
      "q": "How small does an incident have to be before you can skip reporting it?",
      "options": [
        "Minor cuts and near-misses don't need reporting",
        "Report every incident, however small, and fill in an accident report form",
        "Only report incidents that involve a customer",
        "Only report if a manager specifically asks you to"
      ],
      "answer": 1,
      "why": "Report every hazard and incident to a manager no matter how small, and fill in an accident report form."
    },
    {
      "q": "Which of these counts as PPE you would use at No Dice?",
      "options": [
        "A hard hat worn at all times",
        "Sunglasses behind the bar",
        "Gloves, non-slip shoes and an apron",
        "A hi-vis vest for normal bar work"
      ],
      "answer": 2,
      "why": "PPE at No Dice means gloves, non-slip shoes and aprons for the relevant tasks."
    },
    {
      "q": "You spot that a blender's power cable is frayed and damaged. What should you do?",
      "options": [
        "Use it carefully anyway to get through service",
        "Wrap the cable in tape and carry on",
        "Unplug it and plug it back in to reset it",
        "Don't use it and report it as faulty"
      ],
      "answer": 3,
      "why": "Never use damaged electrical kit — report anything faulty."
    },
    {
      "q": "When should a risk assessment be carried out?",
      "options": [
        "Never — they are optional",
        "Only once a year",
        "Before any new event or layout change, such as moving tables or adding kit",
        "Only after an accident has already happened"
      ],
      "answer": 2,
      "why": "Risk assessments are done before any new event or layout change like moving tables or adding kit."
    }
  ],
  "coshh": [
    {
      "q": "What does COSHH stand for?",
      "options": [
        "Control of Substances Hazardous to Health",
        "Cleaning of Safe Household Hygiene",
        "Care of Standard Health and Hazards",
        "Control of Safe Handling of Hazards"
      ],
      "answer": 0,
      "why": "COSHH stands for Control of Substances Hazardous to Health."
    },
    {
      "q": "Why must you never mix cleaning chemicals such as bleach with other products?",
      "options": [
        "It wastes product",
        "It makes them smell stronger",
        "It can create toxic gas",
        "It is fine as long as they're diluted"
      ],
      "answer": 2,
      "why": "Mixing chemicals (e.g. bleach with anything) can create toxic gas."
    },
    {
      "q": "You get a cleaning chemical splashed in your eye. What should you do?",
      "options": [
        "Rub the eye and carry on working",
        "Cover it with a plaster",
        "Rinse for about 30 seconds then return to work",
        "Rinse with water for at least 15 minutes and seek medical attention if irritation continues"
      ],
      "answer": 3,
      "why": "For chemicals in the eyes, rinse with water for at least 15 minutes and get medical attention if irritation continues."
    },
    {
      "q": "You need to move some surface cleaner into another container. What is the rule?",
      "options": [
        "Any clean bottle you have to hand is fine",
        "Never decant a chemical into an unlabelled bottle — keep it in its original, labelled container",
        "Use a spare drinks bottle so it's easy to grab",
        "Pour it over and add a label whenever you get a chance"
      ],
      "answer": 1,
      "why": "A chemical must stay in its original, labelled container — never decant it into an unlabelled bottle."
    },
    {
      "q": "Where should cleaning chemicals be stored at No Dice?",
      "options": [
        "Behind the bar next to the garnishes",
        "Anywhere convenient for quick access",
        "In a locked, labelled, well-ventilated spot away from food, drink and the public",
        "On the shelf next to the high-proof spirits"
      ],
      "answer": 2,
      "why": "Cleaning products should be kept labelled, secure, ventilated and locked away from food, drink and the public."
    },
    {
      "q": "What is a Safety Data Sheet (SDS)?",
      "options": [
        "The staff rota",
        "The daily cleaning schedule",
        "A list of drink prices",
        "A document for every chemical covering its hazards, safe handling and first-aid steps"
      ],
      "answer": 3,
      "why": "Every chemical has an SDS covering its hazards, safe handling and first-aid steps — read it before handling an unfamiliar substance."
    }
  ],
  "manual-handling": [
    {
      "q": "In the LIFT safe-lifting technique, what does the 'Force' step tell you to do?",
      "options": [
        "Grip the load as tightly as you can and pull it upward fast",
        "Bend your knees and lift with your legs, keeping your back straight",
        "Bend at the waist to get low over the load",
        "Twist your body to build momentum before you lift"
      ],
      "answer": 1,
      "why": "The 'Force' step means bending your knees, not your back — lift with your legs and keep your back straight."
    },
    {
      "q": "You are carrying a tray of stock and need to change direction. What is the correct thing to do?",
      "options": [
        "Twist your back to face the new way while your feet stay still",
        "Lean sideways to swing the load around",
        "Move your feet and pivot — never twist your back",
        "Drop the load, then pick it up facing the new direction"
      ],
      "answer": 2,
      "why": "The 'Turn' step says to change direction by moving your feet and pivoting; never twist your back while carrying a load."
    },
    {
      "q": "Where should a load be positioned while you lift it?",
      "options": [
        "Held out at arm's length so you can see your feet",
        "Balanced on one hip",
        "Raised up near your shoulders",
        "Close to your body"
      ],
      "answer": 3,
      "why": "Keeping the load close to your body protects your back and keeps you balanced."
    },
    {
      "q": "You go to move stock and notice a keg dolly has a damaged wheel. What should you do?",
      "options": [
        "Report it to your manager straight away and take it out of use",
        "Keep using it, but only for lighter loads",
        "Try to repair it yourself before your shift ends",
        "Leave it where it is for the next person to spot"
      ],
      "answer": 0,
      "why": "Damaged lifting equipment must be reported to your manager straight away and taken out of use."
    },
    {
      "q": "A box of stock is clearly too heavy for you to lift on your own. What is the right action?",
      "options": [
        "Lift it quickly using your back to get it over with",
        "Get help or use a trolley/cart",
        "Carry it in one go regardless, as long as you rush",
        "Leave it for the next shift to deal with"
      ],
      "answer": 1,
      "why": "If a load is too heavy or awkward to lift alone, get help or use a trolley/cart — don't be a hero."
    }
  ],
  "slips-trips": [
    {
      "q": "What is the number-one slip risk on the bar and floor at No Dice?",
      "options": [
        "Spills — spilt drinks, water, ice and cocktail ingredients",
        "Loud music from the arcade",
        "Too many customers at once",
        "Bright lighting near the course"
      ],
      "answer": 0,
      "why": "Spilt drinks, water and ice are the number-one slip risk and must be cleaned up immediately."
    },
    {
      "q": "During a busy shift you spot a spilt drink on the floor. What should you do?",
      "options": [
        "Wait until the shift is quieter, then clean it",
        "Clean it straight away and put out a wet-floor sign",
        "Walk around it and warn people as they pass",
        "Ask a nearby customer to avoid that spot"
      ],
      "answer": 1,
      "why": "Clean spills the moment you see them and put out a wet-floor sign — never walk past one."
    },
    {
      "q": "A group is about to start the mini-golf course. What footwear should you encourage?",
      "options": [
        "High heels for better grip on the obstacles",
        "Flip-flops because they're easy to move in",
        "Sensible shoes — no high heels or flip-flops",
        "No guidance is needed on footwear"
      ],
      "answer": 2,
      "why": "Sensible shoes are encouraged on the course; high heels and flip-flops raise the risk of slipping and tripping."
    },
    {
      "q": "A guest falls and is seriously injured. What is the correct response?",
      "options": [
        "Help them to a chair and give them a glass of water",
        "Ask them to walk it off and log it at the end of the shift",
        "Wait to see if they get better before calling anyone",
        "Call 999, secure the area, give first aid if trained, and stay with them"
      ],
      "answer": 3,
      "why": "For a serious injury: call 999, secure the area, give first aid if you're trained, and stay with the person until help arrives."
    },
    {
      "q": "Which slip, trip or fall incidents must be reported to a manager and recorded?",
      "options": [
        "Only injuries that need an ambulance",
        "Only incidents that happen on the mini-golf course",
        "Every incident, however minor",
        "Only incidents that involve members of staff"
      ],
      "answer": 2,
      "why": "Every incident, however minor, must be reported to a manager and recorded so patterns can be spotted."
    }
  ],
  "bar-manual": [
    {
      "q": "Under Challenge 25, which forms of ID are acceptable to prove a customer's age?",
      "options": [
        "Any photo ID, including a student card",
        "A passport, UK driving licence, or a card with the PASS hologram",
        "A bank card showing the customer's name",
        "A photo of their ID on their phone"
      ],
      "answer": 1,
      "why": "The only acceptable ID is a passport, UK driving licence, or a card carrying the PASS hologram."
    },
    {
      "q": "When is the very last order taken before closing?",
      "options": [
        "15 minutes before close, when the bell rings",
        "At closing time exactly",
        "1 minute before close, with no exceptions",
        "Up to 5 minutes after close"
      ],
      "answer": 2,
      "why": "Last orders is 15 minutes before close, but the very last order is 1 minute before close, no exceptions."
    },
    {
      "q": "What is the safety-critical rule for opening the cellar hatch?",
      "options": [
        "One trained member of staff can open it alone",
        "Only the duty manager may open it, on their own",
        "Anyone free can open it whenever a delivery arrives",
        "Two staff are needed — one at the hatch upstairs, one in the cellar — and the top person must not leave until it's shut"
      ],
      "answer": 3,
      "why": "The hatch may only be opened with two staff present, and the person at the hatch must not leave it until it's shut."
    },
    {
      "q": "How should ice be served at the bar?",
      "options": [
        "With a scoop or tongs — never scoop with a glass",
        "By scooping with the customer's glass to save time",
        "By hand if the scoop isn't to hand",
        "Poured straight from the ice bin into the glass"
      ],
      "answer": 0,
      "why": "Always use a scoop or tongs for ice and never scoop with a glass."
    },
    {
      "q": "A customer at the bar appears to have had too much to drink. What should you do?",
      "options": [
        "Serve them one more but water it down",
        "Refuse further alcohol, offer water or a soft drink, and ask them to leave if needed",
        "Keep serving as long as they aren't causing trouble",
        "Ignore it, as it's only the manager's responsibility"
      ],
      "answer": 1,
      "why": "Never serve someone who's had too much — offer water or a soft drink and ask them to leave if needed."
    },
    {
      "q": "You find an electrical appliance behind the bar is faulty. What is the correct procedure?",
      "options": [
        "Unplug or switch it off at the wall, add an 'out of order' sign, and report it to your manager",
        "Keep using it until it stops working completely",
        "Try to repair it yourself during a quiet spell",
        "Leave it plugged in but tell customers to keep away"
      ],
      "answer": 0,
      "why": "For faulty electricals: switch off at the wall, add an 'out of order' sign, tell staff not to use it, and report it to your manager."
    }
  ]
}

export const hasQuiz = (key) => Array.isArray(QUIZZES[key]) && QUIZZES[key].length > 0
export const getQuiz = (key) => (hasQuiz(key) ? QUIZZES[key] : [])
export const quizCount = (key) => (hasQuiz(key) ? QUIZZES[key].length : 0)
// Pick n questions (for the founder's on-shift spot-check). `offset` varies the pick
// (e.g. a "different questions" click) without Math.random.
export function sampleQuestions(key, n = 3, offset = 0) {
  const qs = getQuiz(key)
  if (qs.length <= n) return qs
  const out = []
  const used = new Set()
  let seed = (key.length * 7 + qs.length * 13 + offset * 3) % qs.length
  while (out.length < n && used.size < qs.length) {
    seed = (seed + 5) % qs.length
    if (!used.has(seed)) { used.add(seed); out.push(qs[seed]) }
  }
  return out
}
