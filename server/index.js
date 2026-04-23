import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { readData, writeData } from './data.js';
import { syncToSheets, syncAllToSheets, isConfigured } from './sheets.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Status ───────────────────────────────────────────────────────────────────
app.get('/api/status', (_req, res) => {
  res.json({
    ok: true,
    sheetsEnabled: isConfigured(),
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || null,
  });
});

// ─── Data CRUD ────────────────────────────────────────────────────────────────
app.get('/api/data', async (_req, res) => {
  try {
    res.json(await readData());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    await writeData(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/data/:date', async (req, res) => {
  try {
    const allData = await readData();
    allData[req.params.date] = req.body;
    await writeData(allData);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Google Sheets Sync ───────────────────────────────────────────────────────
app.post('/api/sync/:date', async (req, res) => {
  if (!isConfigured()) {
    return res.status(400).json({
      error: 'Google Sheets not configured. Set GOOGLE_SPREADSHEET_ID and GOOGLE_CREDENTIALS_PATH in your .env file.',
    });
  }
  try {
    const { date } = req.params;
    const allData = await readData();
    const dayData = allData[date] || req.body || {};
    await syncToSheets(date, dayData);
    res.json({ ok: true, synced: date });
  } catch (err) {
    console.error('[sync] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sync-all', async (_req, res) => {
  if (!isConfigured()) {
    return res.status(400).json({ error: 'Google Sheets not configured.' });
  }
  try {
    const allData = await readData();
    const count = await syncAllToSheets(allData);
    res.json({ ok: true, synced: count });
  } catch (err) {
    console.error('[sync-all] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Cron: auto-sync yesterday's data at 7:00 AM daily ───────────────────────
if (isConfigured()) {
  cron.schedule('0 7 * * *', async () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const dateKey = d.toISOString().slice(0, 10);
    try {
      const allData = await readData();
      if (allData[dateKey]) {
        await syncToSheets(dateKey, allData[dateKey]);
        console.log(`[cron] Auto-synced ${dateKey} to Google Sheets`);
      } else {
        console.log(`[cron] No data found for ${dateKey}, skipping`);
      }
    } catch (err) {
      console.error('[cron] Auto-sync failed:', err.message);
    }
  });
  console.log('[cron] Daily auto-sync scheduled at 7:00 AM');
}

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`VIL Scorecard API running on http://localhost:${PORT}`);
  console.log(`Google Sheets: ${isConfigured() ? `ENABLED — ${process.env.GOOGLE_SPREADSHEET_ID}` : 'Not configured (see .env.example)'}`);
});
