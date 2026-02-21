const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Reggie, a helpful assistant for finding local activity programs.
You have access to a database of programs scraped from parks & recreation websites.
Use the available tools to answer questions about programs. Be concise.`;

const tools = [
  {
    name: 'search_programs',
    description: 'Search programs in the database. All parameters are optional filters.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Activity type, e.g. soccer, swim, basketball' },
        age_group: { type: 'string', description: 'Age group, e.g. youth, adult, senior' },
        status: { type: 'string', description: 'Registration status, e.g. open, closed' },
        site_id: { type: 'number', description: 'Filter by site ID' },
      },
    },
  },
  {
    name: 'get_sites',
    description: 'List all configured sites in the database.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
];

function runTool(name, input) {
  if (name === 'get_sites') {
    const rows = db.prepare('SELECT id, name, url, type, scrape_interval, created_at FROM sites').all();
    return rows;
  }

  if (name === 'search_programs') {
    const conditions = [];
    const params = [];

    if (input.type) {
      conditions.push("LOWER(type) LIKE LOWER(?)");
      params.push(`%${input.type}%`);
    }
    if (input.age_group) {
      conditions.push("LOWER(age_group) LIKE LOWER(?)");
      params.push(`%${input.age_group}%`);
    }
    if (input.status) {
      conditions.push("LOWER(registration_status) LIKE LOWER(?)");
      params.push(`%${input.status}%`);
    }
    if (input.site_id) {
      conditions.push("site_id = ?");
      params.push(input.site_id);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db.prepare(`
      SELECT p.id, p.name, p.type, p.age_group, p.registration_status,
             p.registration_deadline, p.start_date, p.end_date,
             p.day_of_week, p.start_time, p.end_time,
             p.location, p.cost, p.spots_available, p.source_url,
             s.name AS site_name
      FROM programs p
      LEFT JOIN sites s ON p.site_id = s.id
      ${where}
      ORDER BY p.updated_at DESC
      LIMIT 50
    `).all(...params);
    return rows;
  }

  throw new Error(`Unknown tool: ${name}`);
}

router.post('/', async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const history = [...messages];
  const MAX_ITERATIONS = 5;

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages: history,
      });

      if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find(b => b.type === 'text');
        return res.json({ message: textBlock ? textBlock.text : '' });
      }

      if (response.stop_reason === 'tool_use') {
        history.push({ role: 'assistant', content: response.content });

        const toolResults = response.content
          .filter(b => b.type === 'tool_use')
          .map(toolUse => {
            let result;
            try {
              result = runTool(toolUse.name, toolUse.input);
            } catch (err) {
              result = { error: err.message };
            }
            return {
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(result),
            };
          });

        history.push({ role: 'user', content: toolResults });
        continue;
      }

      // Unexpected stop reason — return whatever text we have
      const textBlock = response.content.find(b => b.type === 'text');
      return res.json({ message: textBlock ? textBlock.text : 'No response.' });
    }

    return res.json({ message: 'I reached my response limit. Please try a more specific question.' });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat request failed' });
  }
});

module.exports = router;
