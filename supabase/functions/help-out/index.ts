// Supabase Edge Function: help-out
// Powers the /help-out volunteer portal. Deploy with --no-verify-jwt.
//
// POST { action, ... }
//   signup {name, phone, email, categories, days, time_blocks, note}
//           → creates/updates the helper, AUTO-ASSIGNS unassigned tasks from the
//             categories they picked (sized to their availability at ~30 min/task),
//             emails them the list (Resend), returns { ok, assigned, emailed }.
//   admin  {secret}              → { helpers, tasks (with assignedTo), stats }  (gated)
//   release{secret, taskId}      → put a task back in the pool                  (gated)
//
// Single source of truth for the task list lives HERE (TASKS below). The admin
// board reads it back via the `admin` action, so there's only one list to edit.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

// ─── Assignment sizing (keep in sync with src/help/data.js) ──────────────────
// A shift of N minutes is worth N/30 jobs. Capped so the pool spreads.
const MAX_TASKS = 20;
const TASK_MIN = 30;
const MAX_CONCURRENT = 2;   // no more than this many helpers booked at once
const PORTAL_URL = "https://team.nodice.bar/operations?tab=helpout";
const HELP_BASE = "https://team.nodice.bar/helpout";
const ELLIOT_EMAIL = "elliot@nodice.bar";
const toMin = (hhmm: string) => { const [h, m] = String(hhmm).split(":").map(Number); return h * 60 + (m || 0); };
const shiftSlots = (s: any) => Math.max(0, Math.round((toMin(s.end) - toMin(s.start)) / TASK_MIN));
const slotsForShifts = (shifts: any[]) => {
  const sum = (shifts || []).reduce((n, s) => n + shiftSlots(s), 0);
  return Math.max(1, Math.min(MAX_TASKS, sum));
};
const PW: Record<string, number> = { p1: 0, p2: 1, p3: 2 };

// Skill levels + per-category default difficulty (admin can override per job).
const SKILL_RANK: Record<string, number> = { novice: 0, intermediate: 1, experienced: 2 };
const CAT_DIFFICULTY: Record<string, string> = {
  cleaning: "novice", tidying: "novice", gardening: "novice", admin: "novice", marketing: "novice", errands: "novice", serving: "novice",
  handyman: "intermediate", painting: "intermediate", tech: "intermediate", design: "intermediate", media: "intermediate", bartending: "intermediate",
  carpentry: "experienced", electrics: "experienced", plumbing: "experienced",
};

// ─── The jobs (Elliot's venue walk-around) ───────────────────────────────────
const RAW: { title: string; cat: string; area: string; priority: string; detail?: string }[] = [
  { title: "Build a wooden frame around the dartboard cupboard", cat: "carpentry", area: "Inside", priority: "p2" },
  { title: "Secure the dartboard to the wall so it can’t fall off", cat: "handyman", area: "Inside", priority: "p1" },
  { title: "Bolt the dartboard coin/token mechanism to the wall", cat: "handyman", area: "Inside", priority: "p2", detail: "So it doesn’t come away from the wall." },
  { title: "Set the dartboard game time longer", cat: "tech", area: "Inside", priority: "p3", detail: "Technical settings job." },
  { title: "Re-seat the metal fence around the Point Blank machine", cat: "carpentry", area: "Inside", priority: "p2", detail: "Back into the ground with a new foot, exactly where it was before." },
  { title: "Replace the posters in all the pinball machines", cat: "design", area: "Inside", priority: "p3", detail: "Up-to-date posters with the right attributes for the new start." },
  { title: "Re-weight & reposition the Proton sign", cat: "handyman", area: "Inside", priority: "p3", detail: "Better bottom weight/handle, set into position." },
  { title: "Straighten the ski-board machine & cable-tie the front cage", cat: "handyman", area: "Inside", priority: "p3" },
  { title: "Remove the two Subzero speakers from the walls", cat: "handyman", area: "Inside", priority: "p2", detail: "Two bolts each — they come straight down." },
  { title: "Remove the Martin Audio speakers", cat: "tech", area: "Inside", priority: "p2", detail: "Too big — taking them out to fit a smaller system. Keeping the amps." },
  { title: "List the Martin Audio speakers on eBay", cat: "admin", area: "Offsite", priority: "p3" },
  { title: "Get the limiter working with the current sound system", cat: "tech", area: "Inside", priority: "p2", detail: "Most cables believed in place — needs a musical/technical person." },
  { title: "Tidy & route the DJ-booth cables", cat: "tech", area: "Inside", priority: "p2", detail: "A job for someone musical/technical." },
  { title: "Wooden trim around the DJ booth (Rocco wood)", cat: "carpentry", area: "Inside", priority: "p2", detail: "Same Rocco wood from across the road — clean, sand, stain & fit so drinks can’t be knocked into the DJ area." },
  { title: "Re-hang the 3 wall/ceiling fans along the length", cat: "electrics", area: "Inside", priority: "p1", detail: "Old wiring taken out — getting warm, need them up." },
  { title: "Fix the PIR & the extractor fans in the toilets", cat: "electrics", area: "Toilets", priority: "p1", detail: "Electrician booked in today." },
  { title: "Put the freezer on its own ring", cat: "electrics", area: "Cellar", priority: "p2", detail: "So if it blows it doesn’t take anything else with it." },
  { title: "Level all the tables", cat: "handyman", area: "Inside", priority: "p2", detail: "May need little metal feet ordered & screwed in. Reorganise & sort while we’re at it." },
  { title: "Put rubber feet back on the chairs", cat: "handyman", area: "Inside", priority: "p3", detail: "Count how many we need and make a quick Amazon order." },
  { title: "Take down the 5 old Plonk-days pictures", cat: "handyman", area: "Inside", priority: "p2" },
  { title: "Hang the replacement pictures (from Elliot’s house)", cat: "handyman", area: "Inside", priority: "p2" },
  { title: "Coat of varnish on the walls to darken the wood", cat: "painting", area: "Inside", priority: "p3", detail: "Brings the wood in line with the rest of the bar. Bottom of the list." },
  { title: "Order the World Cup AV kit — antenna, Freeview, cables", cat: "admin", area: "Offsite", priority: "p1", detail: "Must arrive by Thursday — order today." },
  { title: "Research the right Freeview box", cat: "admin", area: "Offsite", priority: "p1", detail: "Good box to launch the football on — needs to arrive by Thursday." },
  { title: "Swap the old broken TV for the new one", cat: "tech", area: "Inside", priority: "p1" },
  { title: "Put the projector & screen up", cat: "tech", area: "Inside", priority: "p2", detail: "Find the projector screen, mount the projector." },
  { title: "Take down last season’s old posters", cat: "handyman", area: "Inside", priority: "p3" },
  { title: "Bring the alcohol back from Elliot’s flat & restock shelves", cat: "errands", area: "Stock", priority: "p1", detail: "Back to the bar, shelves cleaned, arranged ready for reopening." },
  { title: "Prepare the snack station", cat: "tidying", area: "Stock", priority: "p2", detail: "Snacks for now until the coffee machine arrives." },
  { title: "Set up the new snacks contract/order (nuts & crisps)", cat: "admin", area: "Offsite", priority: "p2" },
  { title: "Add more hanging glass racks (cider/half glasses)", cat: "handyman", area: "Stock", priority: "p3", detail: "Cider will fly this summer — borrow racks from Borough." },
  { title: "Order more BOC gas", cat: "admin", area: "Offsite", priority: "p1" },
  { title: "Put the pour/beer order in", cat: "admin", area: "Offsite", priority: "p1", detail: "Needs to be in by Thursday for the weekend." },
  { title: "Get lager in for Thursday", cat: "errands", area: "Offsite", priority: "p1", detail: "Buy, or borrow any cask left at Borough." },
  { title: "More painting in the toilets", cat: "painting", area: "Toilets", priority: "p1", detail: "Top priority for helpers today — electrician will be in too." },
  { title: "Extra coat of paint on the ladies doors & walls", cat: "painting", area: "Toilets", priority: "p1", detail: "Never finished properly — do after the shelf is out and the light holes are filled." },
  { title: "Latch on the men’s under-sink cupboard", cat: "handyman", area: "Toilets", priority: "p3", detail: "A simple thumb-turn — pick one up." },
  { title: "Re-oil the raw-wood sinks in the men’s", cat: "painting", area: "Toilets", priority: "p2", detail: "Raw wood under the hand dryers needs sorting." },
  { title: "Soap holder up", cat: "handyman", area: "Toilets", priority: "p3" },
  { title: "Remove the old shelving in the women’s toilet", cat: "handyman", area: "Toilets", priority: "p2", detail: "Then patch & fill the old light holes (no longer have lights)." },
  { title: "Tidy the cables above the ladies toilets", cat: "tech", area: "Toilets", priority: "p3" },
  { title: "Wooden trim (12mm) around the ladies toilet lights", cat: "carpentry", area: "Toilets", priority: "p3", detail: "Add a lining sheet and repaint where the orange paint chips from outdoors." },
  { title: "Wheel for the red mop & set the bucket colour rule", cat: "cleaning", area: "Toilets", priority: "p3", detail: "Red = toilet, yellow = back of house, blue = floor." },
  { title: "Sort the ladies-bin solution", cat: "admin", area: "Toilets", priority: "p2", detail: "Cancelling the current contract — find smaller bins / a better answer." },
  { title: "Slim wood under the glasswasher sink to block the mouse gap", cat: "carpentry", area: "Inside", priority: "p2" },
  { title: "Prime & brown-floor-paint under the glasswasher sink", cat: "painting", area: "Inside", priority: "p2", detail: "Previous paint isn’t holding against the water — redo with brown floor paint." },
  { title: "Tidy the paintwork on equipment (sand + spray)", cat: "painting", area: "Inside", priority: "p3", detail: "Light sand; may need matching spray paint for grey plastic electrical elements." },
  { title: "Seal/varnish the metal pillar by the cellar door", cat: "painting", area: "Cellar", priority: "p3", detail: "Plus a small green touch-up on the metal pillar." },
  { title: "Rust-treat & seal the garden metal cabinet", cat: "painting", area: "Garden", priority: "p2", detail: "Sand back, rust-seal, oil/grease the doors. Dry-day priority so the cabinet works." },
  { title: "Rust-treat & seal all the chairs", cat: "painting", area: "Garden", priority: "p2", detail: "Sand down, treat rust, seal so it doesn’t rub off on clothes." },
  { title: "Ventilate the cellar (fan hole in the door)", cat: "carpentry", area: "Cellar", priority: "p1", detail: "No airflow since the ceiling went in. Quickest is a fan hole through the door. Carpenter job — heavy, needed before we open so the beer doesn’t cook." },
  { title: "Chase ABI re: a small cellar chiller unit", cat: "admin", area: "Offsite", priority: "p2", detail: "Keep the beer cold through summer — sign a contract with ABI if it stacks up." },
  { title: "Check the irrigation feeds are all in the right place", cat: "gardening", area: "Garden", priority: "p3", detail: "Set up last year but things have moved — spare parts are in the shipping container across the road." },
  { title: "New doormat, secured to the floor", cat: "handyman", area: "Front", priority: "p2", detail: "Current one is rancid — hardcore glue / Velcro it down." },
  { title: "Seal the outside hose end", cat: "plumbing", area: "Front", priority: "p3", detail: "Superglue / tape the end — it sprays everywhere." },
  { title: "New front sign + light fitting", cat: "electrics", area: "Signage", priority: "p1", detail: "Wood cut, logo done; electrician to source & fit the light today." },
  { title: "Fix the irrigation system line", cat: "plumbing", area: "Garden", priority: "p3", detail: "Pipe in the way of the sign; a break in the line. Low priority — can do while open." },
  { title: "Fix the food-trailer tap drip / water leak", cat: "plumbing", area: "Trailer", priority: "p2", detail: "Overnight leak — find the issue, make the water trade ready to roll." },
  { title: "Deep-clean the food trailer", cat: "cleaning", area: "Trailer", priority: "p2", detail: "Plates & equipment cleaned, degreased, mopped, ready to go. Dry day is good for it." },
  { title: "Check all the food-trailer lights work", cat: "electrics", area: "Trailer", priority: "p2", detail: "Electrician can check today." },
  { title: "Wheelbarrow the dead plants back to Elliot’s house", cat: "gardening", area: "Garden", priority: "p3", detail: "Quick job — Leonie’s helping, good for a dry day." },
  { title: "Cut down & prune the dead plants across the road", cat: "gardening", area: "Offsite", priority: "p3", detail: "Save the soil; take dead plants back to the house." },
  { title: "Order 6–7 plants for the bath side", cat: "gardening", area: "Garden", priority: "p3", detail: "Geraniums / bits & pieces — schedule the gardeners once we have the capital." },
  { title: "Refresh the park games (sand, clean, varnish)", cat: "carpentry", area: "Garden", priority: "p3", detail: "Pull them all out, sand, clean, varnish, lay out on the tables — a fun sunshine job, anyone can do it." },
  { title: "Re-do the garden lighting (ambient, not festoon)", cat: "electrics", area: "Garden", priority: "p2", detail: "Take down the festoon; low strings in the bushes + uplighters from across the road. Electrician to sort the outdoor socket spurred from inside. Keep the trailer lights." },
  { title: "Hang the beer curtain to screen off the staff area", cat: "handyman", area: "Garden", priority: "p2", detail: "Two curtains can come back from the golf course." },
  { title: "Timber the front bench to make it stable", cat: "carpentry", area: "Garden", priority: "p3", detail: "Wheels broken — flip it up, make it stationary with timber from Elliot’s house." },
  { title: "Check the bamboo & tighten any loose screws", cat: "carpentry", area: "Garden", priority: "p3", detail: "Patches that have fallen out; tighten the bamboo." },
  { title: "Move the plant blocking access", cat: "gardening", area: "Garden", priority: "p3", detail: "On its last legs — trim down or take to the house." },
  { title: "Remove the bamboo + bead curtain (re-hang as dressing)", cat: "handyman", area: "Garden", priority: "p2", detail: "Priority — comes out to be re-hung elsewhere as decoration." },
  { title: "Remove the camera bamboo + planter (south of ping-pong)", cat: "handyman", area: "Garden", priority: "p3", detail: "Reuse as dressing on the bar side." },
  { title: "Remove the old lean-to \"drink stand\" & hang the Crooked Yard sign", cat: "handyman", area: "Garden", priority: "p3", detail: "Cable-tied south of ping-pong. Hang the sign on the wall, peel the \"I love global warming\" sticker, keep the metalwork for reuse." },
  { title: "Make the ping-pong ball pockets easy to reach", cat: "tidying", area: "Garden", priority: "p3", detail: "May mean moving barrels around." },
  { title: "Re-band the loose barrels (coach screws)", cat: "carpentry", area: "Garden", priority: "p3", detail: "Some bands are dropping — pilot the metalwork & coach-screw them back, nice and robust." },
  { title: "Sort the green curtains (and source a third)", cat: "handyman", area: "Garden", priority: "p3", detail: "Two green curtains one side of the pillar behind the DJ; find a third (another corner / Wayfair / Borough)." },
  { title: "Build the chained gas-canister store", cat: "carpentry", area: "Garden", priority: "p2", detail: "Two battens chained to the exterior brick wall so canisters line up & can’t fall on anyone — chained from the top." },
  { title: "Clean the ping-pong table & equipment", cat: "cleaning", area: "Garden", priority: "p3" },
  { title: "Main \"No Dice\" sign above the front door", cat: "design", area: "Signage", priority: "p1", detail: "Top priority — vinyl in a day, wood needs cutting (CNC list)." },
  { title: "Hanging front sign", cat: "design", area: "Signage", priority: "p1", detail: "Top priority — vinyl + wood cut." },
  { title: "Snack-bar menu board (aluminium + 18mm timber, magnetic)", cat: "design", area: "Signage", priority: "p2", detail: "Magnetic menu over the top — CNC job." },
  { title: "New snack-bar name — wood-cut logo", cat: "design", area: "Signage", priority: "p2" },
  { title: "Rear overhang sign 60×60", cat: "design", area: "Signage", priority: "p2" },
  { title: "Front overhang sign 60×60", cat: "design", area: "Signage", priority: "p2" },
  { title: "Hay’s food-menu board (aluminium + 18mm bat, magnetic)", cat: "design", area: "Signage", priority: "p2", detail: "Daily specials written on; magnetise the menu over it." },
  { title: "CNC the par/play-track markers (varnished)", cat: "design", area: "Signage", priority: "p2", detail: "Get them done ready for the weekend opening." },
  { title: "Optional: CNC a base plate/cage for the gas canisters", cat: "design", area: "Signage", priority: "p3", detail: "Timber base for the gas store to sit in — add to the CNC sheet." },
  { title: "New A4 poster-frame artwork (no Plonk branding)", cat: "design", area: "Signage", priority: "p2", detail: "Basic redesigned A4s for the front frames — print at the printers." },
  { title: "A4 ping-pong tournament poster with the new dates", cat: "design", area: "Signage", priority: "p3" },
  { title: "Insurance call to get the first policy in place", cat: "admin", area: "Offsite", priority: "p1", detail: "With Guy & Paul — first policy fee to get us open." },
  { title: "Add the daily mop/bucket clean-down rule for cleaners", cat: "admin", area: "Offsite", priority: "p3", detail: "Hose down & clean mops/buckets every single day — Guy to note for the cleaners." },
  { title: "Source the chest freezers", cat: "errands", area: "Offsite", priority: "p2", detail: "Second-hand on eBay, or bring the Borough one up & get it working; maybe fix the dead one here." },
  { title: "Bring spare bits over from the golf course", cat: "errands", area: "Offsite", priority: "p3", detail: "Rubber toilet brushes & anything unused." },
  { title: "Get Mathieu Clark’s barrels collected", cat: "errands", area: "Offsite", priority: "p1", detail: "Elliot priority — chase the wholesale pickup." },
  { title: "Chase Cask/Cake to collect their barrels", cat: "errands", area: "Offsite", priority: "p1", detail: "Elliot priority." },
  { title: "Meet 5 Points to get their barrels gone", cat: "errands", area: "Offsite", priority: "p1", detail: "Elliot priority." },
  { title: "Speak to the liquidator re: Borough stock & equipment", cat: "admin", area: "Offsite", priority: "p1", detail: "Deal price on stock + equipment; make a Borough shopping list (glass racks, chest freezer, green curtains) to grab rather than re-buy." },
  { title: "Pick up the trolley from Andy at Mare Street Market", cat: "errands", area: "Offsite", priority: "p3", detail: "Really useful — for the gas canisters or storing the pool/ping-pong table covers." },

  // ── Cleaning — reopening deep-clean ───────────────────────────────────────
  { title: "Clean the front bar fridges", cat: "cleaning", area: "Inside", priority: "p2" },
  { title: "Clean the drink shelves", cat: "cleaning", area: "Inside", priority: "p2" },
  { title: "Run all the glasses through the machine", cat: "cleaning", area: "Inside", priority: "p2" },
  { title: "Clean down all the surfaces", cat: "cleaning", area: "Inside", priority: "p2" },
  { title: "Help deep-clean the dishwasher", cat: "cleaning", area: "Inside", priority: "p2" },
  { title: "Clean the sinks", cat: "cleaning", area: "Inside", priority: "p2" },
  { title: "Wipe down the shelves", cat: "cleaning", area: "Inside", priority: "p2" },
  { title: "Clean the shelves above the bar", cat: "cleaning", area: "Inside", priority: "p2" },
  { title: "Clean down the games machines", cat: "cleaning", area: "Inside", priority: "p3" },
  { title: "Clean the arcade machines", cat: "cleaning", area: "Inside", priority: "p3" },
  { title: "Clean the pool tables", cat: "cleaning", area: "Inside", priority: "p3" },
  { title: "Clean up in the garden", cat: "cleaning", area: "Garden", priority: "p3" },
  { title: "Help pressure-wash the garden", cat: "cleaning", area: "Garden", priority: "p3" },
  { title: "Clean underneath the food trailer", cat: "cleaning", area: "Trailer", priority: "p3" },
  { title: "Pressure-wash the metal fence", cat: "cleaning", area: "Garden", priority: "p3", detail: "Clear off any feathers and leaves so it's spotless." },
  { title: "Wipe down all the indoor furniture", cat: "cleaning", area: "Inside", priority: "p3" },

  // ── More handyman / painting / varnishing (venue) ─────────────────────────
  { title: "Re-varnish the garden tables", cat: "painting", area: "Garden", priority: "p3" },
  { title: "Re-varnish the garden chairs", cat: "painting", area: "Garden", priority: "p3" },
  { title: "Tidy up the barrels", cat: "tidying", area: "Garden", priority: "p3" },
  { title: "Touch up any bad paintwork", cat: "painting", area: "Inside", priority: "p3", detail: "Handyman paint touch-ups wherever it's scuffed." },
  { title: "Repaint the wooden box behind the CO2 cans (green → brown)", cat: "painting", area: "Inside", priority: "p3" },

  // ── Women's toilets (handyman) ────────────────────────────────────────────
  { title: "Fit a door closer on the women's toilet", cat: "handyman", area: "Toilets", priority: "p2" },
  { title: "Fit round cover discs to seal the holes in the women's toilets", cat: "handyman", area: "Toilets", priority: "p3" },
  { title: "Add a lampshade to the women's toilet light", cat: "handyman", area: "Toilets", priority: "p3" },
  { title: "Hang a curtain (on string) in the women's toilets to hide the sanitary bins", cat: "handyman", area: "Toilets", priority: "p3" },

  // ── Golf course — across the road ─────────────────────────────────────────
  { title: "Re-varnish the stools at the golf course", cat: "painting", area: "Golf course", priority: "p3" },
  { title: "Repaint the barrel tops at the golf course", cat: "painting", area: "Golf course", priority: "p3" },
  { title: "Clean & sweep up the golf course", cat: "cleaning", area: "Golf course", priority: "p3" },
  { title: "Pressure-wash the golf course", cat: "cleaning", area: "Golf course", priority: "p3" },
  { title: "Hoover the astroturf at the golf course", cat: "cleaning", area: "Golf course", priority: "p3" },
  { title: "Clean the fence at the golf course", cat: "cleaning", area: "Golf course", priority: "p3" },
  { title: "Clean the staff hut", cat: "cleaning", area: "Golf course", priority: "p3" },
  { title: "Spray down the golf equipment", cat: "cleaning", area: "Golf course", priority: "p3" },
  { title: "Clean the golf balls", cat: "cleaning", area: "Golf course", priority: "p3" },
  { title: "Clean the golf clubs", cat: "cleaning", area: "Golf course", priority: "p3" },
  { title: "Get scorecards & pencils ready", cat: "tidying", area: "Golf course", priority: "p3" },

  // ── Ads & media creation ──────────────────────────────────────────────────
  { title: "Shoot a reopening promo reel for Instagram", cat: "media", area: "Inside", priority: "p2" },
  { title: "Create content for the launch ads (drinks, games, the space)", cat: "media", area: "Inside", priority: "p2" },
  { title: "Photograph the bar, garden & games for the website & listings", cat: "media", area: "Inside", priority: "p3" },
  { title: "Film & photo the works for socials (the reopening story)", cat: "media", area: "Inside", priority: "p3" },
  { title: "Edit the promo video & reels", cat: "media", area: "Online", priority: "p3" },
];

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 44);
const seen: Record<string, number> = {};
const TASKS = RAW.map((t) => {
  let id = slug(t.title);
  if (seen[id] != null) { seen[id]++; id = `${id}-${seen[id]}`; } else { seen[id] = 0; }
  return { ...t, id };
});
const TASK_BY_ID: Record<string, typeof TASKS[number]> = Object.fromEntries(TASKS.map((t) => [t.id, t]));

const CAT_LABEL: Record<string, string> = {
  bartending: "Bartending", serving: "Serving / front of house", cleaning: "Cleaning",
  tidying: "Venue tidying", carpentry: "Carpentry & joinery", handyman: "Handyman / general",
  painting: "Painting & finishing", electrics: "Electrics & wiring", plumbing: "Plumbing",
  tech: "Tech, AV & sound", gardening: "Gardening & outdoors", admin: "Admin & online help",
  marketing: "Marketing", media: "Ads & media creation", errands: "Errands & collections", design: "Design & signage",
};

const fmtDay = (d: string) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const fmtTime = (min: number) => {
  if (min >= 1440) return "midnight";
  const h = Math.floor(min / 60), m = min % 60, h12 = ((h + 11) % 12) + 1;
  return `${h12}${m ? ":" + String(m).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`;
};
const shiftLabel = (s: any) => `${fmtTime(toMin(s.start))}–${fmtTime(toMin(s.end))}`;
const esc = (s: string) => String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
const RED = "#DA1B33";

const shiftRows = (shifts: any[]) =>
  (shifts || []).map((s) => `<div style="font-size:13px;color:#333"><strong>${esc(fmtDay(s.date))}</strong> · ${esc(shiftLabel(s))}</div>`).join("");

const taskTable = (assigned: typeof TASKS) => {
  const byCat: Record<string, typeof TASKS> = {};
  for (const t of assigned) (byCat[t.cat] ||= []).push(t);
  const sections = Object.entries(byCat).map(([cat, items]) => `
    <tr><td style="padding:16px 0 6px"><div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${RED};font-weight:700">${esc(CAT_LABEL[cat] || cat)}</div></td></tr>
    ${items.map((t) => `
      <tr><td style="padding:6px 0;border-bottom:1px solid #eee">
        <div style="font-size:15px;color:#111;font-weight:600">${esc(t.title)}</div>
        ${t.detail ? `<div style="font-size:13px;color:#555;line-height:1.5;margin-top:3px">${esc(t.detail)}</div>` : ""}
        <div style="font-size:11px;color:#999;letter-spacing:0.08em;text-transform:uppercase;margin-top:4px">${esc(t.area)} · ~30 min</div>
      </td></tr>`).join("")}`).join("");
  return `<table style="width:100%;border-collapse:collapse">${sections}</table>`;
};

// Helper email — sent when Elliot CONFIRMS their jobs. Includes their private
// link so they can tick jobs off as they finish them.
function buildHelperEmail(name: string, assigned: typeof TASKS, shifts: any[], token: string) {
  const link = `${HELP_BASE}?t=${encodeURIComponent(token)}`;
  const body = assigned.length
    ? `<p style="font-size:15px;color:#333;line-height:1.6">Here are your jobs — each is about <strong>30 minutes</strong> (~<strong>${(assigned.length * 0.5).toFixed(1)} hours</strong> total). Do them in any order during your shift. Tick each one off as you go using your link below.</p>${taskTable(assigned)}
       <p style="margin:20px 0 0"><a href="${link}" style="display:inline-block;background:${RED};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:8px">Open &amp; tick off your jobs →</a></p>
       <p style="font-size:12px;color:#999;margin-top:8px">Keep this link — it’s your personal job list: ${link}</p>`
    : `<p style="font-size:15px;color:#333;line-height:1.6">You’re confirmed and on the list — thank you! Elliot will point you at jobs on the day.</p>`;
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:8px">
    <h1 style="font-size:24px;color:${RED};margin:0 0 4px">You’re confirmed — thanks for helping, ${esc(name || "friend")}! 🍻</h1>
    <p style="font-size:13px;color:#888;margin:0 0 16px">No Dice · 407 Mentmore Terrace, London Fields, E8 3PH</p>
    ${shifts && shifts.length ? `<div style="margin:0 0 14px"><div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:4px">Your shift${shifts.length > 1 ? "s" : ""}</div>${shiftRows(shifts)}</div>` : ""}
    ${body}
    <p style="font-size:13px;color:#777;line-height:1.6;margin-top:22px">See you there. Can’t make a job? Hand it back from your link and we’ll re-home it. Every hand gets us closer. 🙏</p>
  </div>`;
}

// Alert to Elliot — sent on every new sign-up so he can review + confirm.
function buildAlertEmail(h: any, assigned: typeof TASKS, helperId: string) {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:8px">
    <h1 style="font-size:22px;color:${RED};margin:0 0 6px">New Help Out sign-up: ${esc(h.name)}</h1>
    <p style="font-size:14px;color:#333;margin:0 0 12px">
      ${h.phone ? `📱 ${esc(h.phone)}` : ""}${h.phone && h.email ? " · " : ""}${h.email ? `✉️ ${esc(h.email)}` : ""}
    </p>
    <div style="margin:0 0 14px"><div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:4px">Shifts</div>${shiftRows(h.shifts) || "<div style='font-size:13px;color:#999'>—</div>"}</div>
    ${h.note ? `<p style="font-size:13px;color:#555;margin:0 0 14px"><strong>Note:</strong> ${esc(h.note)}</p>` : ""}
    <div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:4px">Proposed jobs (${assigned.length})</div>
    ${assigned.length ? taskTable(assigned) : "<p style='font-size:13px;color:#999'>No matching jobs free — assign manually.</p>"}
    <p style="margin:24px 0 0"><a href="${PORTAL_URL}" style="display:inline-block;background:${RED};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:8px">Review &amp; confirm →</a></p>
    <p style="font-size:12px;color:#999;margin-top:10px">${PORTAL_URL}</p>
  </div>`;
}

async function sendResend(to: string, subject: string, html: string) {
  const RESEND = Deno.env.get("RESEND_API_KEY");
  if (!RESEND || !to) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "No Dice <hello@nodice.bar>", to, subject, html }),
  });
  return r.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const b = await req.json().catch(() => ({}));
  const action = b.action;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Cap config: a global default plus per-day overrides ("bump to 3 on busy days").
  const { data: cfgRow } = await sb.from("help_settings").select("default_cap,day_caps,task_meta,custom_tasks,done_jobs").eq("id", 1).maybeSingle();
  const cfg: any = cfgRow || { default_cap: MAX_CONCURRENT, day_caps: {}, task_meta: {}, custom_tasks: [], done_jobs: [] };
  const capFor = (d: string) => (cfg.day_caps || {})[d] ?? cfg.default_cap ?? MAX_CONCURRENT;
  const meta = cfg.task_meta || {};
  const customTasks: any[] = Array.isArray(cfg.custom_tasks) ? cfg.custom_tasks : [];
  const effCat = (t: any) => (meta[t.id] && typeof meta[t.id].cat === "string" && meta[t.id].cat) ? meta[t.id].cat : t.cat;
  const effDiff = (t: any) => meta[t.id]?.difficulty || t.difficulty || CAT_DIFFICULTY[effCat(t)] || "intermediate";
  const effRec = (t: any) => meta[t.id]?.recurring !== undefined ? !!meta[t.id].recurring : !!t.recurring;
  // A task with the admin's edits applied (category/title/detail/difficulty/recurring).
  const effTask = (t: any) => {
    const m = meta[t.id] || {};
    return {
      ...t,
      cat: effCat(t),
      title: (typeof m.title === "string" && m.title.length) ? m.title : t.title,
      detail: (m.detail !== undefined ? m.detail : t.detail),
      difficulty: effDiff(t), recurring: effRec(t),
    };
  };
  // Built-in tasks + admin-created ones, minus any marked deleted.
  const allTasks = [...TASKS, ...customTasks].filter((t: any) => !(meta[t.id] && meta[t.id].deleted));
  const byId: Record<string, any> = Object.fromEntries(allTasks.map((t: any) => [t.id, t]));
  // Completed jobs log {id, taskId, title, cat, area, by, at}. A one-off job
  // that's been logged done leaves the active board (recurring ones stay).
  const doneJobs: any[] = Array.isArray(cfg.done_jobs) ? cfg.done_jobs : [];
  const doneSet = new Set(doneJobs.map((d: any) => d.taskId));
  const boardTasks = allTasks.filter((t: any) => !(doneSet.has(t.id) && !effRec(t)));
  const logDone = async (t: any, by: string) => {
    const et = effTask(t);
    const entry = { id: `${t.id}-${Date.now()}`, taskId: t.id, title: et.title, cat: et.cat, area: et.area, by: String(by || "Team").trim() || "Team", at: new Date().toISOString() };
    await sb.from("help_settings").update({ done_jobs: [...doneJobs, entry] }).eq("id", 1);
  };

  const isAdmin = () => b.secret === Deno.env.get("SEND_SECRET");

  // ── public: anonymised claimed shifts so the sign-up popup shows free slots ──
  if (action === "availability") {
    const { data: helpers } = await sb.from("bar_helpers").select("id,shifts");
    const claims: any[] = [];
    (helpers || []).forEach((h: any, i: number) =>
      (h.shifts || []).forEach((s: any) => claims.push({ hid: i, date: s.date, start: s.start, end: s.end })));
    return json({ claims, defaultCap: cfg.default_cap ?? MAX_CONCURRENT, dayCaps: cfg.day_caps || {} });
  }

  // ── helper portal (authed by the helper's private token) ────────────────────
  // myload  → their jobs + state. markdone/undone → flag a job done / undo.
  // handback → give a job back to the pool (can't do it).
  if (action === "myload" || action === "markdone" || action === "undone" || action === "handback") {
    const token = String(b.token || "");
    if (!token) return json({ error: "missing link" }, 400);
    const { data: me } = await sb.from("bar_helpers").select("*").eq("token", token).maybeSingle();
    if (!me) return json({ error: "That link isn't valid — ask Elliot for a fresh one." }, 401);
    const states: Record<string, string> = { ...(me.task_states || {}) };
    let assigned: string[] = me.assigned || [];
    const taskId = String(b.taskId || "");

    if (action === "markdone" || action === "undone") {
      if (!assigned.includes(taskId)) return json({ error: "That job isn't on your list." }, 400);
      if (states[taskId] === "completed") return json({ error: "That one's already signed off — nice work." }, 400);
      if (action === "markdone") states[taskId] = "done"; else delete states[taskId];
      await sb.from("bar_helpers").update({ task_states: states }).eq("id", me.id);
    }
    if (action === "handback") {
      if (states[taskId] === "completed") return json({ error: "That one's already signed off." }, 400);
      assigned = assigned.filter((x) => x !== taskId);
      delete states[taskId];
      await sb.from("bar_helpers").update({ assigned, task_states: states }).eq("id", me.id);
    }

    // The helper only sees their jobs once the founder has confirmed them.
    const confirmed = (me.status || "pending") === "confirmed";
    const tasks = confirmed
      ? assigned.map((id) => { const t = byId[id]; return t ? { ...effTask(t), state: states[id] || "todo", shift: (me.task_shift || {})[id] || null } : null; }).filter(Boolean)
      : [];
    return json({ name: me.name, shifts: me.shifts || [], status: me.status || "pending", tasks, pending: !confirmed });
  }

  // ── public: sign up → propose jobs to fill each shift, alert Elliot ──────────
  if (action === "signup") {
    const name = String(b.name || "").trim();
    const email = String(b.email || "").trim().toLowerCase() || null;
    const phone = String(b.phone || "").trim() || null;
    const categories: string[] = Array.isArray(b.categories) ? b.categories : [];
    const note = String(b.note || "").trim() || null;
    // shifts = [{date, start:"HH:MM", end:"HH:MM"}] within 9am–midnight.
    const shifts = (Array.isArray(b.shifts) ? b.shifts : [])
      .filter((s: any) => s && s.date && s.start && s.end && toMin(s.end) > toMin(s.start))
      .map((s: any) => ({ date: String(s.date), start: String(s.start), end: String(s.end) }));
    if (!name || (!email && !phone) || !categories.length || !shifts.length)
      return json({ error: "Please add your name, a phone or email, at least one thing you’re up for, and a date with your hours." }, 400);
    const days = [...new Set(shifts.map((s: any) => s.date))].sort();

    const { data: helpers, error: hErr } = await sb.from("bar_helpers").select("id,email,assigned,shifts,token");
    if (hErr) return json({ error: hErr.message }, 500);
    const existing = email ? (helpers || []).find((h: any) => (h.email || "").toLowerCase() === email) : null;

    // Cap: no more than MAX_CONCURRENT helpers booked at any one moment. Check the
    // new shifts against everyone else's (the signer's own existing shifts don't count).
    const others: any[] = [];
    for (const h of helpers || []) {
      if (existing && h.id === existing.id) continue;
      for (const s of (h.shifts || [])) others.push({ hid: h.id, date: s.date, start: s.start, end: s.end });
    }
    for (const ns of shifts) {
      const od = others.filter((o) => o.date === ns.date);
      const cap = capFor(ns.date);
      for (let t = toMin(ns.start); t < toMin(ns.end); t += TASK_MIN) {
        const hids = new Set<string>();
        for (const o of od) if (toMin(o.start) <= t && t < toMin(o.end)) hids.add(o.hid);
        if (hids.size >= cap)
          return json({ error: `${fmtDay(ns.date)} around ${fmtTime(t)} already has ${cap} ${cap === 1 ? "person" : "people"} booked — we keep it to ${cap} at once so it stays manageable. Please pick another time or day.` }, 409);
      }
    }

    // Auto-assign jobs that match their categories AND skill level, sized to
    // their shift hours (~30 min each), priority-first, skipping one-off jobs
    // already taken by others. These stay hidden from the helper until the
    // founder confirms — the founder can tweak the list before that.
    const skill = ["novice", "intermediate", "experienced"].includes(String(b.skill)) ? String(b.skill) : "intermediate";
    const skillRank = SKILL_RANK[skill] ?? 1;
    const taken = new Set<string>();
    for (const h of helpers || []) {
      if (existing && h.id === existing.id) continue;
      for (const id of (h.assigned || [])) { const tt = byId[id]; if (tt && !effRec(tt)) taken.add(id); }
    }
    const cap = slotsForShifts(shifts);
    const picked = boardTasks
      .filter((t: any) => categories.includes(effCat(t)) && (SKILL_RANK[effDiff(t)] ?? 1) <= skillRank && !taken.has(t.id))
      .sort((a: any, b2: any) => (PW[a.priority] ?? 9) - (PW[b2.priority] ?? 9))
      .slice(0, cap);
    const assignedIds: string[] = existing ? (existing.assigned || []) : picked.map((t: any) => t.id);
    const assigned = assignedIds.map((id: string) => byId[id]).filter(Boolean).map((t: any) => effTask(t));   // for the alert email
    const row: Record<string, unknown> = {
      name, phone, email, categories, days, time_blocks: [], shifts, note, skill, status: "pending",
    };
    if (!existing) { row.assigned = assignedIds; row.task_shift = {}; }
    let helperId = existing?.id || "";
    let token = existing?.token || "";
    if (existing) {
      const { error } = await sb.from("bar_helpers").update(row).eq("id", existing.id);
      if (error) return json({ error: error.message }, 500);
    } else {
      const { data: ins, error } = await sb.from("bar_helpers").insert(row).select("id,token").single();
      if (error) return json({ error: error.message }, 500);
      helperId = ins.id; token = ins.token;
    }

    // Alert Elliot to review + confirm. The helper is emailed on confirm, not now.
    await sendResend(ELLIOT_EMAIL, `New Help Out sign-up: ${name}`, buildAlertEmail({ name, phone, email, shifts, note }, assigned, helperId));
    return json({ ok: true, assigned, pending: true, token });
  }

  // ── admin (secret-gated) ────────────────────────────────────────────────────
  if (action === "admin") {
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);
    const { data: helpers, error } = await sb.from("bar_helpers").select("*").order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    const owner: Record<string, { id: string; name: string; status: string; state: string }> = {};
    for (const h of helpers || []) for (const id of (h.assigned || [])) owner[id] = { id: h.id, name: h.name, status: h.status || "pending", state: (h.task_states || {})[id] || "todo" };
    const tasks = boardTasks.map((t) => ({ ...effTask(t), assignedTo: owner[t.id] || null }));
    const enrichedHelpers = (helpers || []).map((h: any) => ({
      ...h, status: h.status || "pending", skill: h.skill || "intermediate", shifts: h.shifts || [],
      assignedTasks: (h.assigned || []).map((id: string) => { const t = byId[id]; return t ? { ...effTask(t), state: (h.task_states || {})[id] || "todo", shift: (h.task_shift || {})[id] || null } : null; }).filter(Boolean),
    }));
    const done = [...doneJobs].sort((a: any, b2: any) => String(b2.at).localeCompare(String(a.at)));   // newest first
    const stats = {
      helpers: (helpers || []).length,
      confirmed: (helpers || []).filter((h: any) => (h.status || "pending") === "confirmed").length,
      tasks: boardTasks.length,
      assigned: tasks.filter((t) => t.assignedTo).length,
      completed: tasks.filter((t) => t.assignedTo?.state === "completed").length,
      awaiting: tasks.filter((t) => t.assignedTo?.state === "done").length,
      done: doneJobs.length,
      p1: boardTasks.filter((t) => t.priority === "p1").length,
      p1Assigned: tasks.filter((t) => t.priority === "p1" && t.assignedTo).length,
    };
    return json({ tasks, helpers: enrichedHelpers, done, stats, settings: { defaultCap: cfg.default_cap ?? MAX_CONCURRENT, dayCaps: cfg.day_caps || {} } });
  }

  // ── set the cap (global default if no date, else a per-day override) ────────
  if (action === "setcap") {
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);
    const cap = Math.max(1, Math.min(6, Number(b.cap) || MAX_CONCURRENT));
    if (b.date) {
      const day_caps: Record<string, number> = { ...(cfg.day_caps || {}) };
      if (cap === (cfg.default_cap ?? MAX_CONCURRENT)) delete day_caps[b.date];   // same as default → no override
      else day_caps[b.date] = cap;
      await sb.from("help_settings").update({ day_caps }).eq("id", 1);
    } else {
      await sb.from("help_settings").update({ default_cap: cap }).eq("id", 1);
    }
    return json({ ok: true });
  }

  // ── confirm a helper → email them their final jobs (secret-gated) ───────────
  if (action === "confirm") {
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);
    const { data: h } = await sb.from("bar_helpers").select("*").eq("id", b.helperId).maybeSingle();
    if (!h) return json({ error: "helper not found" }, 404);
    await sb.from("bar_helpers").update({ status: "confirmed" }).eq("id", h.id);
    const assigned = (h.assigned || []).map((id: string) => { const t = byId[id]; return t ? effTask(t) : null; }).filter(Boolean);
    const emailed = h.email
      ? await sendResend(h.email, assigned.length ? "Your No Dice jobs — thanks for helping! 🍻" : "You’re confirmed — thanks for helping! 🍻", buildHelperEmail(h.name, assigned, h.shifts || [], h.token))
      : false;
    return json({ ok: true, emailed });
  }

  // ── admin sign-off: approve a helper-completed job → completed on the board.
  // reopen puts it back to in-progress.
  if (action === "approve" || action === "reopen") {
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);
    const { data: h } = await sb.from("bar_helpers").select("name,assigned,task_states").eq("id", b.helperId).maybeSingle();
    if (!h) return json({ error: "helper not found" }, 404);
    const taskId = String(b.taskId || "");
    if (!(h.assigned || []).includes(taskId)) return json({ error: "not on their list" }, 400);
    const ts: Record<string, string> = { ...(h.task_states || {}) };
    if (action === "approve") {
      ts[taskId] = "completed";
      const t = byId[taskId]; if (t) await logDone(t, h.name);   // → done jobs log
    } else {
      delete ts[taskId];
      const dj = doneJobs.filter((d: any) => d.taskId !== taskId);
      if (dj.length !== doneJobs.length) await sb.from("help_settings").update({ done_jobs: dj }).eq("id", 1);
    }
    await sb.from("bar_helpers").update({ task_states: ts }).eq("id", b.helperId);
    return json({ ok: true });
  }

  // ── log a job done directly from the board (admin), tagged who + when ───────
  if (action === "logdone") {
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);
    const taskId = String(b.taskId || "");
    const t = byId[taskId];
    if (!t) return json({ error: "unknown job" }, 400);
    let by = String(b.by || "").trim();
    const { data: helpers } = await sb.from("bar_helpers").select("id,name,assigned,task_states");
    const ownerH = (helpers || []).find((h: any) => (h.assigned || []).includes(taskId));
    if (!by) by = ownerH?.name || "Team";
    await logDone(t, by);
    if (ownerH) { const ts = { ...(ownerH.task_states || {}) }; ts[taskId] = "completed"; await sb.from("bar_helpers").update({ task_states: ts }).eq("id", ownerH.id); }
    return json({ ok: true });
  }

  // ── undo a done-log entry (admin) → the job returns to the board ────────────
  if (action === "removedone") {
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);
    const logId = String(b.logId || "");
    const entry = doneJobs.find((d: any) => d.id === logId);
    await sb.from("help_settings").update({ done_jobs: doneJobs.filter((d: any) => d.id !== logId) }).eq("id", 1);
    if (entry) {
      const { data: helpers } = await sb.from("bar_helpers").select("id,assigned,task_states");
      for (const h of helpers || []) if ((h.assigned || []).includes(entry.taskId) && (h.task_states || {})[entry.taskId] === "completed") {
        const ts = { ...(h.task_states || {}) }; delete ts[entry.taskId]; await sb.from("bar_helpers").update({ task_states: ts }).eq("id", h.id);
      }
    }
    return json({ ok: true });
  }

  // ── allocate a job to a helper for a shift (secret-gated) ───────────────────
  if (action === "assign") {
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);
    const taskId = String(b.taskId || "");
    const t = byId[taskId];
    if (!t) return json({ error: "unknown task" }, 400);
    const recurring = effRec(t);
    const { data: helpers } = await sb.from("bar_helpers").select("id,assigned,task_shift");
    if (!recurring) {
      for (const h of helpers || []) if (h.id !== b.helperId && (h.assigned || []).includes(taskId))
        return json({ error: "That job is already allocated — release it, or mark it recurring to allow repeats." }, 409);
    }
    const me = (helpers || []).find((h: any) => h.id === b.helperId);
    if (!me) return json({ error: "helper not found" }, 404);
    const next = [...new Set([...(me.assigned || []), taskId])];
    const ts: Record<string, string> = { ...(me.task_shift || {}) };
    if (b.shift) ts[taskId] = String(b.shift);
    const { error } = await sb.from("bar_helpers").update({ assigned: next, task_shift: ts }).eq("id", b.helperId);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ── set a job's difficulty / recurring flag (secret-gated) ──────────────────
  if (action === "taskmeta") {
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);
    const taskId = String(b.taskId || "");
    if (!byId[taskId]) return json({ error: "unknown task" }, 400);
    const tm: Record<string, any> = { ...(cfg.task_meta || {}) };
    const cur: any = { ...(tm[taskId] || {}) };
    if (b.difficulty && ["novice", "intermediate", "experienced"].includes(String(b.difficulty))) cur.difficulty = String(b.difficulty);
    if (b.cat && CAT_DIFFICULTY[String(b.cat)] !== undefined) cur.cat = String(b.cat);   // recategorise a job
    if (typeof b.recurring === "boolean") cur.recurring = b.recurring;
    if (typeof b.title === "string") { const v = b.title.trim(); if (v) cur.title = v; else delete cur.title; }
    if (typeof b.detail === "string") cur.detail = b.detail;   // "" clears the description
    tm[taskId] = cur;
    await sb.from("help_settings").update({ task_meta: tm }).eq("id", 1);
    return json({ ok: true });
  }

  // ── cancel / delete a sign-up entirely (e.g. clear a test request) ──────────
  if (action === "deletehelper") {
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);
    if (!b.helperId) return json({ error: "missing helper" }, 400);
    const { error } = await sb.from("bar_helpers").delete().eq("id", b.helperId);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ── create a new job on the board (admin) ───────────────────────────────────
  if (action === "createjob") {
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);
    const title = String(b.title || "").trim();
    const cat = String(b.cat || "").trim();
    if (!title || !cat) return json({ error: "Give the job a title and a category." }, 400);
    const difficulty = ["novice", "intermediate", "experienced"].includes(String(b.difficulty)) ? String(b.difficulty) : "intermediate";
    const priority = ["p1", "p2", "p3"].includes(String(b.priority)) ? String(b.priority) : "p2";
    let id = "c-" + slug(title);
    if (byId[id]) id = `${id}-${customTasks.length + 1}`;
    const task = { id, title, cat, area: String(b.area || "").trim() || "Custom", priority, detail: String(b.detail || "").trim(), difficulty, recurring: !!b.recurring };
    await sb.from("help_settings").update({ custom_tasks: [...customTasks, task] }).eq("id", 1);
    return json({ ok: true, id });
  }

  // ── delete a job from the board (admin) ─────────────────────────────────────
  // Custom job → drop it; built-in → flag deleted in task_meta. Also frees it
  // from anyone it was allocated to.
  if (action === "deletejob") {
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);
    const taskId = String(b.taskId || "");
    if (!byId[taskId]) return json({ error: "unknown job" }, 400);
    const { data: hs } = await sb.from("bar_helpers").select("id,assigned,task_states,task_shift");
    for (const h of hs || []) {
      if ((h.assigned || []).includes(taskId)) {
        const ts: Record<string, string> = { ...(h.task_states || {}) }; delete ts[taskId];
        const tsh: Record<string, string> = { ...(h.task_shift || {}) }; delete tsh[taskId];
        await sb.from("bar_helpers").update({ assigned: (h.assigned || []).filter((x: string) => x !== taskId), task_states: ts, task_shift: tsh }).eq("id", h.id);
      }
    }
    if (customTasks.some((t: any) => t.id === taskId)) {
      await sb.from("help_settings").update({ custom_tasks: customTasks.filter((t: any) => t.id !== taskId) }).eq("id", 1);
    } else {
      const tm: Record<string, any> = { ...meta }; tm[taskId] = { ...(tm[taskId] || {}), deleted: true };
      await sb.from("help_settings").update({ task_meta: tm }).eq("id", 1);
    }
    return json({ ok: true });
  }

  // ── release a task back to the pool (secret-gated) ──────────────────────────
  if (action === "release") {
    if (!isAdmin()) return json({ error: "unauthorized" }, 401);
    const taskId = String(b.taskId || "");
    const onlyHelper = b.helperId ? String(b.helperId) : null;   // remove from one person, else everyone
    const { data: helpers } = await sb.from("bar_helpers").select("id,assigned,task_states,task_shift");
    for (const h of helpers || []) {
      if (onlyHelper && h.id !== onlyHelper) continue;
      if ((h.assigned || []).includes(taskId)) {
        const ts: Record<string, string> = { ...(h.task_states || {}) }; delete ts[taskId];
        const tsh: Record<string, string> = { ...(h.task_shift || {}) }; delete tsh[taskId];
        await sb.from("bar_helpers").update({ assigned: (h.assigned || []).filter((x: string) => x !== taskId), task_states: ts, task_shift: tsh }).eq("id", h.id);
      }
    }
    return json({ ok: true });
  }

  return json({ error: "unknown action" }, 400);
});
