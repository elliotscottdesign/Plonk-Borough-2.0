import React from 'react'

// "How it works" tab for the DJ portal — plain-English explainer of the booking
// rules. Branded No Dice (red on black). Mirrors the logic enforced server-side
// in supabase/functions/dj-portal (claim/edit) so DJs know the rules up front.

const RED = '#DA1B33', CARD = '#0A0A0A', LINE = 'rgba(255,255,255,0.12)'

const Section = ({ tag, title, accent = RED, children }) => (
  <div style={{ background: CARD, border: `1px solid ${LINE}`, borderLeft: `3px solid ${accent}`, borderRadius: 12, padding: '16px 16px', marginBottom: 14 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 18 }}>{tag}</span>
      <div className="serif" style={{ fontSize: 17, color: '#fff' }}>{title}</div>
    </div>
    <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.78)' }}>{children}</div>
  </div>
)
const B = ({ children }) => <strong style={{ color: '#fff' }}>{children}</strong>
const R = ({ children }) => <strong style={{ color: RED }}>{children}</strong>
const Li = ({ children }) => (
  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
    <span style={{ color: RED, flexShrink: 0 }}>›</span><span>{children}</span>
  </div>
)

export default function DJRules() {
  return (
    <div>
      <div className="serif" style={{ fontSize: 22, color: '#fff', marginBottom: 4 }}>How it works</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 18, lineHeight: 1.6 }}>
        Everything you need to know before you book a night at No Dice, London Fields.
      </div>

      <Section tag="🎚️" title="Open Decks — Mon · Tue · Wed" accent="#34D399">
        Midweek is <B>Open Decks</B>: relaxed, <B>unpaid</B>, and yours to play how you like.
        <Li>Play <B>anything</B> — no genre rules at all.</Li>
        <Li>Book <B>as many</B> Mon/Tue/Wed nights as you want.</Li>
        <Li>Pick a vibe: <B>full DJ set</B>, <B>record selections</B>, or an <B>album listening party</B>.</Li>
      </Section>

      <Section tag="💷" title="Sessions — Thu · Fri · Sat">
        Weekends are paid <B>Sessions</B>. A few rules keep the line-ups fresh:
        <Li><R>One paid session per calendar month</R> per DJ. (Open Decks don't count — those are unlimited.)</Li>
        <Li>Pick <B>up to 4 sub-genres</B> you'll play on the night.</Li>
        <Li>These go out on the flyer and the listings, so choose what really represents the set.</Li>
      </Section>

      <Section tag="🔀" title="The adjacent-night rule">
        So two nights in a row don't sound the same, a <B>sub-genre</B> can't be booked on the day
        <B> before or after</B> one that's already taken.
        <Li><B>Same day is fine</B> — two DJs can share a night with the same sub-genre.</Li>
        <Li><B>Same broad genre is fine</B> back-to-back — e.g. House one night, House the next.</Li>
        <Li>It's only the exact <B>sub-genre</B> on <B>consecutive</B> days that's blocked.</Li>
        <Li>If something's locked when you pick a date, you'll see it crossed out — just choose another sub-genre or another night.</Li>
      </Section>

      <Section tag="🎵" title="Promo track — required every night">
        Every booking needs a <R>track to promote it</R> — a name or a link (SoundCloud / YouTube etc.).
        <Li>We use it for the <B>Instagram post</B> for your night.</Li>
        <Li>Tick to confirm it's <B>your own mix/edit</B> or you have the <B>rights</B> to use it for promo.</Li>
        <Li>No track, no booking — it's how we shout about you.</Li>
      </Section>

      <Section tag="✏️" title="Changed your mind? Edit any time">
        Your nights aren't locked in.
        <Li>Hit <R>edit</R> on any of your dates — even ones we've already <B>confirmed</B>.</Li>
        <Li>Change the night name, sub-genres, set type or promo track and save. Confirmed nights update <B>live</B>.</Li>
        <Li>Still <B>Requested</B>? You can release it back with <B>cancel</B>.</Li>
      </Section>

      <Section tag="👤" title="Your profile">
        Keep it sharp — it'll go live on the No Dice site so guests can find you.
        <Li>Everything's required except <B>SoundCloud / Spotify / YouTube</B>, plus a photo and at least <B>5 genres</B>.</Li>
        <Li>You can <B>change your genres any time</B> — they're not fixed when you sign up.</Li>
        <Li>We'll add RA / DICE links and more later.</Li>
      </Section>

      <Section tag="✅" title="What happens after you book" accent="#34D399">
        <Li>You <B>request</B> a date from the calendar.</Li>
        <Li>No Dice <B>confirms</B> it (you'll see it turn green under <B>Your dates</B>).</Li>
        <Li>Once confirmed it goes on the <B>events calendar</B> and into the <B>Instagram</B> line-up automatically.</Li>
      </Section>

      <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 18, lineHeight: 1.6 }}>
        Questions? Just message No Dice — we're here to help you put on a great night.
      </div>
    </div>
  )
}
