// No Dice — the jobs board. Elliot's venue walk-around, turned into concrete
// tasks and tagged with the same category keys friends pick on the form, so a
// volunteer sees exactly what they'd be doing. Edit freely as jobs get done.
//
//   cat      — category key (see src/help/data.js CATEGORIES)
//   area     — where in/around the venue
//   priority — 'p1' before we open (urgent) · 'p2' important · 'p3' nice-to-have / can do while open
//   detail   — optional extra context

export const PRIORITY = {
  p1: { label: 'Before we open', tone: '#DA1B33' },
  p2: { label: 'Important',      tone: '#FCD34D' },
  p3: { label: 'When we can',    tone: '#34D399' },
}

export const TASKS = [
  // ── Games corner · dartboard / machines ──────────────────────────────────
  { title: 'Build a wooden frame around the dartboard cupboard', cat: 'carpentry', area: 'Inside', priority: 'p2' },
  { title: 'Secure the dartboard to the wall so it can’t fall off', cat: 'handyman', area: 'Inside', priority: 'p1' },
  { title: 'Bolt the dartboard coin/token mechanism to the wall', cat: 'handyman', area: 'Inside', priority: 'p2', detail: 'So it doesn’t come away from the wall.' },
  { title: 'Set the dartboard game time longer', cat: 'tech', area: 'Inside', priority: 'p3', detail: 'Technical settings job.' },
  { title: 'Re-seat the metal fence around the Point Blank machine', cat: 'carpentry', area: 'Inside', priority: 'p2', detail: 'Back into the ground with a new foot, exactly where it was before.' },
  { title: 'Replace the posters in all the pinball machines', cat: 'design', area: 'Inside', priority: 'p3', detail: 'Up-to-date posters with the right attributes for the new start.' },
  { title: 'Re-weight & reposition the Proton sign', cat: 'handyman', area: 'Inside', priority: 'p3', detail: 'Better bottom weight/handle, set into position.' },
  { title: 'Straighten the ski-board machine & cable-tie the front cage', cat: 'handyman', area: 'Inside', priority: 'p3' },

  // ── Sound / DJ booth ──────────────────────────────────────────────────────
  { title: 'Remove the two Subzero speakers from the walls', cat: 'handyman', area: 'Inside', priority: 'p2', detail: 'Two bolts each — they come straight down.' },
  { title: 'Remove the Martin Audio speakers', cat: 'tech', area: 'Inside', priority: 'p2', detail: 'Too big — taking them out to fit a smaller system. Keeping the amps.' },
  { title: 'List the Martin Audio speakers on eBay', cat: 'admin', area: 'Offsite', priority: 'p3' },
  { title: 'Get the limiter working with the current sound system', cat: 'tech', area: 'Inside', priority: 'p2', detail: 'Most cables believed in place — needs a musical/technical person.' },
  { title: 'Tidy & route the DJ-booth cables', cat: 'tech', area: 'Inside', priority: 'p2', detail: 'A job for someone musical/technical.' },
  { title: 'Wooden trim around the DJ booth (Rocco wood)', cat: 'carpentry', area: 'Inside', priority: 'p2', detail: 'Same Rocco wood from across the road — clean, sand, stain & fit so drinks can’t be knocked into the DJ area.' },

  // ── Fans / climate ────────────────────────────────────────────────────────
  { title: 'Re-hang the 3 wall/ceiling fans along the length', cat: 'electrics', area: 'Inside', priority: 'p1', detail: 'Old wiring taken out — getting warm, need them up.' },
  { title: 'Fix the PIR & the extractor fans in the toilets', cat: 'electrics', area: 'Toilets', priority: 'p1', detail: 'Electrician booked in today.' },
  { title: 'Put the freezer on its own ring', cat: 'electrics', area: 'Cellar', priority: 'p2', detail: 'So if it blows it doesn’t take anything else with it.' },

  // ── Tables / furniture / artwork ──────────────────────────────────────────
  { title: 'Level all the tables', cat: 'handyman', area: 'Inside', priority: 'p2', detail: 'May need little metal feet ordered & screwed in. Reorganise & sort while we’re at it.' },
  { title: 'Put rubber feet back on the chairs', cat: 'handyman', area: 'Inside', priority: 'p3', detail: 'Count how many we need and make a quick Amazon order.' },
  { title: 'Take down the 5 old Plonk-days pictures', cat: 'handyman', area: 'Inside', priority: 'p2' },
  { title: 'Hang the replacement pictures (from Elliot’s house)', cat: 'handyman', area: 'Inside', priority: 'p2' },
  { title: 'Coat of varnish on the walls to darken the wood', cat: 'painting', area: 'Inside', priority: 'p3', detail: 'Brings the wood in line with the rest of the bar. Bottom of the list.' },

  // ── World Cup / screens ───────────────────────────────────────────────────
  { title: 'Order the World Cup AV kit — antenna, Freeview, cables', cat: 'admin', area: 'Offsite', priority: 'p1', detail: 'Must arrive by Thursday — order today.' },
  { title: 'Research the right Freeview box', cat: 'admin', area: 'Offsite', priority: 'p1', detail: 'Good box to launch the football on — needs to arrive by Thursday.' },
  { title: 'Swap the old broken TV for the new one', cat: 'tech', area: 'Inside', priority: 'p1' },
  { title: 'Put the projector & screen up', cat: 'tech', area: 'Inside', priority: 'p2', detail: 'Find the projector screen, mount the projector.' },
  { title: 'Take down last season’s old posters', cat: 'handyman', area: 'Inside', priority: 'p3' },

  // ── Bar setup / stock ─────────────────────────────────────────────────────
  { title: 'Bring the alcohol back from Elliot’s flat & restock shelves', cat: 'errands', area: 'Stock', priority: 'p1', detail: 'Back to the bar, shelves cleaned, arranged ready for reopening.' },
  { title: 'Prepare the snack station', cat: 'tidying', area: 'Stock', priority: 'p2', detail: 'Snacks for now until the coffee machine arrives.' },
  { title: 'Set up the new snacks contract/order (nuts & crisps)', cat: 'admin', area: 'Offsite', priority: 'p2' },
  { title: 'Add more hanging glass racks (cider/half glasses)', cat: 'handyman', area: 'Stock', priority: 'p3', detail: 'Cider will fly this summer — borrow racks from Borough.' },
  { title: 'Order more BOC gas', cat: 'admin', area: 'Offsite', priority: 'p1' },
  { title: 'Put the pour/beer order in', cat: 'admin', area: 'Offsite', priority: 'p1', detail: 'Needs to be in by Thursday for the weekend.' },
  { title: 'Get lager in for Thursday', cat: 'errands', area: 'Offsite', priority: 'p1', detail: 'Buy, or borrow any cask left at Borough.' },

  // ── Toilets ───────────────────────────────────────────────────────────────
  { title: 'More painting in the toilets', cat: 'painting', area: 'Toilets', priority: 'p1', detail: 'Top priority for helpers today — electrician will be in too.' },
  { title: 'Extra coat of paint on the ladies doors & walls', cat: 'painting', area: 'Toilets', priority: 'p1', detail: 'Never finished properly — do after the shelf is out and the light holes are filled.' },
  { title: 'Latch on the men’s under-sink cupboard', cat: 'handyman', area: 'Toilets', priority: 'p3', detail: 'A simple thumb-turn — pick one up.' },
  { title: 'Re-oil the raw-wood sinks in the men’s', cat: 'painting', area: 'Toilets', priority: 'p2', detail: 'Raw wood under the hand dryers needs sorting.' },
  { title: 'Soap holder up', cat: 'handyman', area: 'Toilets', priority: 'p3' },
  { title: 'Remove the old shelving in the women’s toilet', cat: 'handyman', area: 'Toilets', priority: 'p2', detail: 'Then patch & fill the old light holes (no longer have lights).' },
  { title: 'Tidy the cables above the ladies toilets', cat: 'tech', area: 'Toilets', priority: 'p3' },
  { title: 'Wooden trim (12mm) around the ladies toilet lights', cat: 'carpentry', area: 'Toilets', priority: 'p3', detail: 'Add a lining sheet and repaint where the orange paint chips from outdoors.' },
  { title: 'Wheel for the red mop & set the bucket colour rule', cat: 'cleaning', area: 'Toilets', priority: 'p3', detail: 'Red = toilet, yellow = back of house, blue = floor.' },
  { title: 'Sort the ladies-bin solution', cat: 'admin', area: 'Toilets', priority: 'p2', detail: 'Cancelling the current contract — find smaller bins / a better answer.' },

  // ── Glasswash / wet area ──────────────────────────────────────────────────
  { title: 'Slim wood under the glasswasher sink to block the mouse gap', cat: 'carpentry', area: 'Inside', priority: 'p2' },
  { title: 'Prime & brown-floor-paint under the glasswasher sink', cat: 'painting', area: 'Inside', priority: 'p2', detail: 'Previous paint isn’t holding against the water — redo with brown floor paint.' },

  // ── Equipment paintwork / rust ────────────────────────────────────────────
  { title: 'Tidy the paintwork on equipment (sand + spray)', cat: 'painting', area: 'Inside', priority: 'p3', detail: 'Light sand; may need matching spray paint for grey plastic electrical elements.' },
  { title: 'Seal/varnish the metal pillar by the cellar door', cat: 'painting', area: 'Cellar', priority: 'p3', detail: 'Plus a small green touch-up on the metal pillar.' },
  { title: 'Rust-treat & seal the garden metal cabinet', cat: 'painting', area: 'Garden', priority: 'p2', detail: 'Sand back, rust-seal, oil/grease the doors. Dry-day priority so the cabinet works.' },
  { title: 'Rust-treat & seal all the chairs', cat: 'painting', area: 'Garden', priority: 'p2', detail: 'Sand down, treat rust, seal so it doesn’t rub off on clothes.' },

  // ── Cellar ────────────────────────────────────────────────────────────────
  { title: 'Ventilate the cellar (fan hole in the door)', cat: 'carpentry', area: 'Cellar', priority: 'p1', detail: 'No airflow since the ceiling went in. Quickest is a fan hole through the door. Carpenter job — heavy, needed before we open so the beer doesn’t cook.' },
  { title: 'Chase ABI re: a small cellar chiller unit', cat: 'admin', area: 'Offsite', priority: 'p2', detail: 'Keep the beer cold through summer — sign a contract with ABI if it stacks up.' },
  { title: 'Check the irrigation feeds are all in the right place', cat: 'gardening', area: 'Garden', priority: 'p3', detail: 'Set up last year but things have moved — spare parts are in the shipping container across the road.' },

  // ── Front / entrance / sign ───────────────────────────────────────────────
  { title: 'New doormat, secured to the floor', cat: 'handyman', area: 'Front', priority: 'p2', detail: 'Current one is rancid — hardcore glue / Velcro it down.' },
  { title: 'Seal the outside hose end', cat: 'plumbing', area: 'Front', priority: 'p3', detail: 'Superglue / tape the end — it sprays everywhere.' },
  { title: 'New front sign + light fitting', cat: 'electrics', area: 'Signage', priority: 'p1', detail: 'Wood cut, logo done; electrician to source & fit the light today.' },
  { title: 'Fix the irrigation system line', cat: 'plumbing', area: 'Garden', priority: 'p3', detail: 'Pipe in the way of the sign; a break in the line. Low priority — can do while open.' },

  // ── Food trailer ──────────────────────────────────────────────────────────
  { title: 'Fix the food-trailer tap drip / water leak', cat: 'plumbing', area: 'Trailer', priority: 'p2', detail: 'Overnight leak — find the issue, make the water trade ready to roll.' },
  { title: 'Deep-clean the food trailer', cat: 'cleaning', area: 'Trailer', priority: 'p2', detail: 'Plates & equipment cleaned, degreased, mopped, ready to go. Dry day is good for it.' },
  { title: 'Check all the food-trailer lights work', cat: 'electrics', area: 'Trailer', priority: 'p2', detail: 'Electrician can check today.' },

  // ── Garden / outdoors ─────────────────────────────────────────────────────
  { title: 'Wheelbarrow the dead plants back to Elliot’s house', cat: 'gardening', area: 'Garden', priority: 'p3', detail: 'Quick job — Leonie’s helping, good for a dry day.' },
  { title: 'Cut down & prune the dead plants across the road', cat: 'gardening', area: 'Offsite', priority: 'p3', detail: 'Save the soil; take dead plants back to the house.' },
  { title: 'Order 6–7 plants for the bath side', cat: 'gardening', area: 'Garden', priority: 'p3', detail: 'Geraniums / bits & pieces — schedule the gardeners once we have the capital.' },
  { title: 'Refresh the park games (sand, clean, varnish)', cat: 'carpentry', area: 'Garden', priority: 'p3', detail: 'Pull them all out, sand, clean, varnish, lay out on the tables — a fun sunshine job, anyone can do it.' },
  { title: 'Re-do the garden lighting (ambient, not festoon)', cat: 'electrics', area: 'Garden', priority: 'p2', detail: 'Take down the festoon; low strings in the bushes + uplighters from across the road. Electrician to sort the outdoor socket spurred from inside. Keep the trailer lights.' },
  { title: 'Hang the beer curtain to screen off the staff area', cat: 'handyman', area: 'Garden', priority: 'p2', detail: 'Two curtains can come back from the golf course.' },
  { title: 'Timber the front bench to make it stable', cat: 'carpentry', area: 'Garden', priority: 'p3', detail: 'Wheels broken — flip it up, make it stationary with timber from Elliot’s house.' },
  { title: 'Check the bamboo & tighten any loose screws', cat: 'carpentry', area: 'Garden', priority: 'p3', detail: 'Patches that have fallen out; tighten the bamboo.' },
  { title: 'Move the plant blocking access', cat: 'gardening', area: 'Garden', priority: 'p3', detail: 'On its last legs — trim down or take to the house.' },
  { title: 'Remove the bamboo + bead curtain (re-hang as dressing)', cat: 'handyman', area: 'Garden', priority: 'p2', detail: 'Priority — comes out to be re-hung elsewhere as decoration.' },
  { title: 'Remove the camera bamboo + planter (south of ping-pong)', cat: 'handyman', area: 'Garden', priority: 'p3', detail: 'Reuse as dressing on the bar side.' },
  { title: 'Remove the old lean-to "drink stand" & hang the Crooked Yard sign', cat: 'handyman', area: 'Garden', priority: 'p3', detail: 'Cable-tied south of ping-pong. Hang the sign on the wall, peel the "I love global warming" sticker, keep the metalwork for reuse.' },
  { title: 'Make the ping-pong ball pockets easy to reach', cat: 'tidying', area: 'Garden', priority: 'p3', detail: 'May mean moving barrels around.' },
  { title: 'Re-band the loose barrels (coach screws)', cat: 'carpentry', area: 'Garden', priority: 'p3', detail: 'Some bands are dropping — pilot the metalwork & coach-screw them back, nice and robust.' },
  { title: 'Sort the green curtains (and source a third)', cat: 'handyman', area: 'Garden', priority: 'p3', detail: 'Two green curtains one side of the pillar behind the DJ; find a third (another corner / Wayfair / Borough).' },
  { title: 'Build the chained gas-canister store', cat: 'carpentry', area: 'Garden', priority: 'p2', detail: 'Two battens chained to the exterior brick wall so canisters line up & can’t fall on anyone — chained from the top.' },
  { title: 'Clean the ping-pong table & equipment', cat: 'cleaning', area: 'Garden', priority: 'p3' },

  // ── Design & signage (CNC) ────────────────────────────────────────────────
  { title: 'Main "No Dice" sign above the front door', cat: 'design', area: 'Signage', priority: 'p1', detail: 'Top priority — vinyl in a day, wood needs cutting (CNC list).' },
  { title: 'Hanging front sign', cat: 'design', area: 'Signage', priority: 'p1', detail: 'Top priority — vinyl + wood cut.' },
  { title: 'Snack-bar menu board (aluminium + 18mm timber, magnetic)', cat: 'design', area: 'Signage', priority: 'p2', detail: 'Magnetic menu over the top — CNC job.' },
  { title: 'New snack-bar name — wood-cut logo', cat: 'design', area: 'Signage', priority: 'p2' },
  { title: 'Rear overhang sign 60×60', cat: 'design', area: 'Signage', priority: 'p2' },
  { title: 'Front overhang sign 60×60', cat: 'design', area: 'Signage', priority: 'p2' },
  { title: 'Hay’s food-menu board (aluminium + 18mm bat, magnetic)', cat: 'design', area: 'Signage', priority: 'p2', detail: 'Daily specials written on; magnetise the menu over it.' },
  { title: 'CNC the par/play-track markers (varnished)', cat: 'design', area: 'Signage', priority: 'p2', detail: 'Get them done ready for the weekend opening.' },
  { title: 'Optional: CNC a base plate/cage for the gas canisters', cat: 'design', area: 'Signage', priority: 'p3', detail: 'Timber base for the gas store to sit in — add to the CNC sheet.' },
  { title: 'New A4 poster-frame artwork (no Plonk branding)', cat: 'design', area: 'Signage', priority: 'p2', detail: 'Basic redesigned A4s for the front frames — print at the printers.' },
  { title: 'A4 ping-pong tournament poster with the new dates', cat: 'design', area: 'Signage', priority: 'p3' },

  // ── Admin / online ────────────────────────────────────────────────────────
  { title: 'Insurance call to get the first policy in place', cat: 'admin', area: 'Offsite', priority: 'p1', detail: 'With Guy & Paul — first policy fee to get us open.' },
  { title: 'Add the daily mop/bucket clean-down rule for cleaners', cat: 'admin', area: 'Offsite', priority: 'p3', detail: 'Hose down & clean mops/buckets every single day — Guy to note for the cleaners.' },
  { title: 'Source the chest freezers', cat: 'errands', area: 'Offsite', priority: 'p2', detail: 'Second-hand on eBay, or bring the Borough one up & get it working; maybe fix the dead one here.' },
  { title: 'Bring spare bits over from the golf course', cat: 'errands', area: 'Offsite', priority: 'p3', detail: 'Rubber toilet brushes & anything unused.' },

  // ── Errands / Borough & collections (Elliot-led) ──────────────────────────
  { title: 'Get Mathieu Clark’s barrels collected', cat: 'errands', area: 'Offsite', priority: 'p1', detail: 'Elliot priority — chase the wholesale pickup.' },
  { title: 'Chase Cask/Cake to collect their barrels', cat: 'errands', area: 'Offsite', priority: 'p1', detail: 'Elliot priority.' },
  { title: 'Meet 5 Points to get their barrels gone', cat: 'errands', area: 'Offsite', priority: 'p1', detail: 'Elliot priority.' },
  { title: 'Speak to the liquidator re: Borough stock & equipment', cat: 'admin', area: 'Offsite', priority: 'p1', detail: 'Deal price on stock + equipment; make a Borough shopping list (glass racks, chest freezer, green curtains) to grab rather than re-buy.' },
  { title: 'Pick up the trolley from Andy at Mare Street Market', cat: 'errands', area: 'Offsite', priority: 'p3', detail: 'Really useful — for the gas canisters or storing the pool/ping-pong table covers.' },
]
