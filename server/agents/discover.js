const Anthropic = require('@anthropic-ai/sdk');
const { FirecrawlAppV1: FirecrawlApp } = require('@mendable/firecrawl-js');
const fs = require('fs');
const path = require('path');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PARSER_PROMPT = fs.readFileSync(
  path.join(__dirname, '../../agents/parser.md'),
  'utf-8'
);

const PROGRAM_KEYWORDS = [
  'program', 'class', 'activity', 'activities', 'recreation', 'register',
  'youth', 'adult', 'senior', 'sports', 'swim', 'soccer', 'basketball',
  'fitness', 'camp', 'league', 'course', 'workshop', 'aquatic',
];

function normalizeHost(host) {
  return host.replace(/^www\./, '');
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.protocol = 'https:';
    u.hostname = u.hostname.replace(/^www\./, '');
    return u.href;
  } catch {
    return url;
  }
}

function isProgramUrl(url, baseUrl) {
  try {
    const parsed = new URL(url);
    const base = new URL(baseUrl);
    if (normalizeHost(parsed.hostname) !== normalizeHost(base.hostname)) return false;
    const pathname = parsed.pathname.toLowerCase();
    return PROGRAM_KEYWORDS.some(kw => pathname.includes(kw));
  } catch {
    return false;
  }
}

function extractJson(text) {
  const codeBlock = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (codeBlock) return JSON.parse(codeBlock[1]);
  const obj = text.match(/(\{[\s\S]*\})/);
  if (obj) return JSON.parse(obj[1]);
  return JSON.parse(text);
}

async function discoverSite(site) {
  const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  const baseUrl = site.url.startsWith('http') ? site.url : `https://${site.url}`;

  // Step 1: Map the site
  const mapResult = await firecrawl.mapUrl(baseUrl, {});
  const allUrls = mapResult.links || [];

  // Step 2: Filter for program pages, deduplicate, cap at 15
  const seen = new Set();
  let programUrls = allUrls.filter(u => {
    if (!isProgramUrl(u, baseUrl)) return false;
    const key = normalizeUrl(u);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 15);
  if (programUrls.length === 0) programUrls = [baseUrl];

  // Step 3: Scrape each page
  const rawScrapes = [];
  for (const url of programUrls) {
    try {
      const result = await firecrawl.scrapeUrl(url, { formats: ['markdown'] });
      rawScrapes.push({ url, content: result.markdown || '' });
    } catch (err) {
      rawScrapes.push({ url, content: '', error: err.message });
    }
  }

  // Step 4: Call Claude to parse (falls back gracefully if API unavailable)
  const combinedContent = rawScrapes
    .filter(s => s.content)
    .map(s => `\n\n--- Page: ${s.url} ---\n${s.content}`)
    .join('\n')
    .slice(0, 50000);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: [{ type: 'text', text: PARSER_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `Parse programs from this scraped content from ${site.url}. Return only valid JSON matching the parse-programs output format.\n\n${combinedContent}`,
      }],
    });

    const parsed = extractJson(response.content[0].text);

    return {
      rawScrapes,
      programs: parsed.programs || [],
      errors: parsed.errors || [],
    };
  } catch (err) {
    console.warn('Claude parse step skipped:', err.message);
    return {
      rawScrapes,
      programs: [],
      errors: [{ reason: 'Parse step unavailable: ' + err.message }],
      parseSkipped: true,
    };
  }
}

const PORTAL_SIGNALS = [
  'activenet', 'perfectmind', 'recdesk', 'civicrec', 'myrec',
  'recreationlink', 'vermont systems', 'daxko', 'rec1',
];

async function detectSiteType(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (PORTAL_SIGNALS.some(signal => hostname.includes(signal))) return 'portal';
  } catch {}
  return 'direct';
}

module.exports = { discoverSite, detectSiteType };
