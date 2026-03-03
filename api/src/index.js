/**
 * WCC Carbon Calculator API
 *
 * POST /api/calculate  — accepts a JSON-LD project payload, returns carbon
 *                         capture results.
 * GET  /api/reference/:name — returns reference data by name.
 * GET  /api/health     — health check.
 */

import express from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { calculateCarbonCapture } from './calculator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REF_DIR = join(__dirname, '..', 'reference-data');
const CONTEXT_DIR = join(__dirname, '..', 'context');

const app = express();
app.use(express.json({ limit: '10mb' }));

// ---------------------------------------------------------------------------
// POST /api/calculate
// ---------------------------------------------------------------------------
app.post('/api/calculate', (req, res) => {
  try {
    const project = req.body;

    if (!project || typeof project !== 'object') {
      return res.status(400).json({ error: 'Request body must be a JSON-LD project object.' });
    }

    const result = calculateCarbonCapture(project);

    if (result.errors && result.errors.length > 0 && !result.summary) {
      return res.status(422).json({
        error: 'Validation failed',
        details: result.errors,
      });
    }

    return res.json(result);
  } catch (err) {
    console.error('Calculation error:', err);
    return res.status(500).json({ error: 'Internal calculation error', message: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/reference/:name
// ---------------------------------------------------------------------------
app.get('/api/reference/:name', (req, res) => {
  const name = req.params.name.replace(/\.jsonld$/, '');
  const filePath = join(REF_DIR, `${name}.jsonld`);

  try {
    const data = readFileSync(filePath, 'utf-8');
    res.type('application/ld+json').send(data);
  } catch {
    return res.status(404).json({ error: `Reference data "${name}" not found.` });
  }
});

// ---------------------------------------------------------------------------
// GET /api/context
// ---------------------------------------------------------------------------
app.get('/api/context', (_req, res) => {
  try {
    const data = readFileSync(join(CONTEXT_DIR, 'project.jsonld'), 'utf-8');
    res.type('application/ld+json').send(data);
  } catch {
    return res.status(500).json({ error: 'Context file not found.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WCC Carbon Calculator API listening on port ${PORT}`);
});

export default app;
