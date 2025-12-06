#!/usr/bin/env node
// Simple model access probe script.
// Usage:
//   node scripts/checkModelAccess.mjs --models imagen-4.0-generate-001,imagen-4.1-pro-001,gemini-2.5-flash-image-preview
// Or list available models for your key:
//   node scripts/checkModelAccess.mjs --list
// Relies on API_KEY in env.

import { GoogleGenAI } from '@google/genai';

if (!process.env.API_KEY) {
  console.error('ERROR: API_KEY env var is required.');
  process.exit(1);
}

const argModels = process.argv.find(a => a.startsWith('--models='))?.split('=')[1];
const shouldList = process.argv.includes('--list');
const models = (argModels ? argModels.split(',').map(s => s.trim()).filter(Boolean) : [
  'imagen-4.0-generate-001',
  'gemini-2.5-flash-image',
  'gemini-2.0-flash'
]);

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function probe(name) {
  const started = Date.now();
  try {
    await ai.models.get({ name });
    return { name, ok: true, status: 200, ms: Date.now() - started };
  } catch (e) {
    return { name, ok: false, status: e?.status ?? null, error: e?.message || String(e), ms: Date.now() - started };
  }
}

(async () => {
  console.log('Model Access Probe');
  console.log('API Key: ******' );
  if (shouldList) {
    console.log('Listing models available to this API key...');
    console.log('--------------------------------------------');
    try {
      const listResp = await ai.models.list();
      const names = Array.isArray(listResp?.models) ? listResp.models.map(m => m.name) : [];
      if (!names.length) {
        console.log('No models returned. Your key may lack access to public generative models.');
      } else {
        for (const n of names) console.log(n);
      }
      return;
    } catch (e) {
      console.error('Failed to list models:', e?.message || String(e));
      process.exit(3);
    }
  }

  console.log('Models:', models.join(', '));
  console.log('--------------------------------------------');
  const results = [];
  for (const m of models) {
    // sequential to avoid rate spikes
    results.push(await probe(m));
  }
  // Print table
  console.log('\nResult Matrix:');
  console.log('Model'.padEnd(34), 'OK', 'Status'.padEnd(7), 'Latency(ms)'.padEnd(12), 'Error');
  for (const r of results) {
    console.log(r.name.padEnd(34), r.ok ? '✔' : '✕', String(r.status ?? '—').padEnd(7), String(r.ms).padEnd(12), r.error ? r.error.slice(0, 120) : '');
  }
  // Exit code: non-zero if any failures
  const anyFail = results.some(r => !r.ok);
  if (anyFail) {
    console.log('\nOne or more models not accessible.');
    process.exit(2);
  } else {
    console.log('\nAll models accessible.');
  }
})();
