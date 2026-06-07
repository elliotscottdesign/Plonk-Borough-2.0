// ─── Windsor.ai feed config ──────────────────────────────────────────────
// Windsor.ai pulls GA4 / Google Ads / Search Console / Meta and pushes to a
// destination this static site can read. Paste the feed URL here once it's set
// up — a Windsor.ai "data feed" URL, a published Google Sheet (JSON), or an
// Apps Script /exec endpoint (the pattern this site already uses for notes &
// lock-sync). Until set, the Marketing section shows the scaffold + connect
// steps; once set, useWindsorFeed() fetches it and the cards fill in.
export const WINDSOR_FEED_URL = ''                     // ← paste when connected
export const WINDSOR_CONNECTED = !!WINDSOR_FEED_URL

// Connectors we'll switch on in Windsor as the Google pages/campaigns go live.
export const WINDSOR_SOURCES = [
  { name: 'GA4',            note: 'website traffic, channels, behaviour, conversions' },
  { name: 'Google Ads',    note: 'campaign spend, clicks, conversions, ROAS' },
  { name: 'Search Console', note: 'organic queries, clicks, impressions, position' },
  { name: 'Instagram / Meta', note: 'reach, engagement, followers' },
]

// Sub-divided categories. Each is data-driven so the scaffold renders now and
// fills in once the feed is live (metric `key` maps to the Windsor field).
export const MARKETING_SECTIONS = [
  {
    key: 'overview', label: 'Overview', icon: '📊', source: 'All sources',
    intro: 'Top-line marketing health across the website, ads, search and social — one screen.',
    groups: [
      { title: 'This period', metrics: [
        { key: 'sessions', label: 'Sessions', unit: '' },
        { key: 'users', label: 'Users', unit: '' },
        { key: 'conversions', label: 'Bookings / conversions', unit: '' },
        { key: 'adSpend', label: 'Ad spend', unit: '£' },
        { key: 'roas', label: 'ROAS', unit: '×' },
        { key: 'cpa', label: 'Cost / booking', unit: '£' },
      ] },
    ],
  },
  {
    key: 'website', label: 'Website (GA4)', icon: '🌐', source: 'GA4',
    intro: 'How people reach and move through the site — and how many book.',
    groups: [
      { title: 'Traffic', metrics: [
        { key: 'sessions', label: 'Sessions', unit: '' },
        { key: 'users', label: 'Users', unit: '' },
        { key: 'newUsers', label: 'New users', unit: '' },
        { key: 'engRate', label: 'Engagement rate', unit: '%' },
        { key: 'avgEngTime', label: 'Avg engagement time', unit: 's' },
      ] },
      { title: 'Acquisition — by channel', metrics: [
        { key: 'chOrganic', label: 'Organic search', unit: '' },
        { key: 'chPaid', label: 'Paid search', unit: '' },
        { key: 'chSocial', label: 'Organic social', unit: '' },
        { key: 'chDirect', label: 'Direct', unit: '' },
        { key: 'chReferral', label: 'Referral', unit: '' },
      ] },
      { title: 'Behaviour & conversions', metrics: [
        { key: 'topPages', label: 'Top pages', unit: 'list' },
        { key: 'bookings', label: 'Bookings', unit: '' },
        { key: 'convRate', label: 'Conversion rate', unit: '%' },
      ] },
    ],
  },
  {
    key: 'campaigns', label: 'Campaigns (Google Ads)', icon: '🎯', source: 'Google Ads',
    intro: 'Paid performance — what each campaign costs and returns.',
    groups: [
      { title: 'Spend & delivery', metrics: [
        { key: 'spend', label: 'Spend', unit: '£' },
        { key: 'impressions', label: 'Impressions', unit: '' },
        { key: 'clicks', label: 'Clicks', unit: '' },
        { key: 'ctr', label: 'CTR', unit: '%' },
        { key: 'cpc', label: 'Avg CPC', unit: '£' },
      ] },
      { title: 'Return', metrics: [
        { key: 'adConversions', label: 'Conversions', unit: '' },
        { key: 'adConvRate', label: 'Conv. rate', unit: '%' },
        { key: 'roas', label: 'ROAS', unit: '×' },
        { key: 'byCampaign', label: 'By campaign', unit: 'list' },
      ] },
    ],
  },
  {
    key: 'seo', label: 'SEO / Search', icon: '🔎', source: 'Search Console',
    intro: 'Organic visibility — what you rank for and what gets clicked.',
    groups: [
      { title: 'Performance', metrics: [
        { key: 'scClicks', label: 'Clicks', unit: '' },
        { key: 'scImpr', label: 'Impressions', unit: '' },
        { key: 'scCtr', label: 'CTR', unit: '%' },
        { key: 'scPos', label: 'Avg position', unit: '' },
      ] },
      { title: 'What ranks', metrics: [
        { key: 'topQueries', label: 'Top queries', unit: 'list' },
        { key: 'topLanding', label: 'Top landing pages', unit: 'list' },
      ] },
    ],
  },
  {
    key: 'social', label: 'Social', icon: '📸', source: 'Instagram / Meta',
    intro: 'Instagram & Meta — audience growth and what lands.',
    groups: [
      { title: 'Audience', metrics: [
        { key: 'followers', label: 'Followers', unit: '' },
        { key: 'reach', label: 'Reach', unit: '' },
        { key: 'impressions', label: 'Impressions', unit: '' },
        { key: 'engRate', label: 'Engagement rate', unit: '%' },
        { key: 'profileVisits', label: 'Profile visits', unit: '' },
      ] },
      { title: 'Content', metrics: [
        { key: 'linkClicks', label: 'Link clicks', unit: '' },
        { key: 'topPosts', label: 'Top posts', unit: 'list' },
      ] },
    ],
  },
  {
    key: 'goals', label: 'Goals & spend', icon: '💰', source: 'All sources',
    intro: 'Budget vs actual, and what it costs to win a booking.',
    groups: [
      { title: 'Budget', metrics: [
        { key: 'budget', label: 'Monthly budget', unit: '£' },
        { key: 'spentMonth', label: 'Spent this month', unit: '£' },
        { key: 'budgetLeft', label: 'Remaining', unit: '£' },
      ] },
      { title: 'Efficiency', metrics: [
        { key: 'cpa', label: 'Cost per booking', unit: '£' },
        { key: 'cac', label: 'Cost per acquisition', unit: '£' },
        { key: 'spendByChannel', label: 'Spend by channel', unit: 'list' },
      ] },
    ],
  },
]
