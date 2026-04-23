/**
 * One-time setup script: initializes the Google Sheet with the Daily Log tab,
 * headers, and a Targets reference tab.
 *
 * Usage: node server/setup-sheets.js
 */
import 'dotenv/config';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TARGETS = [
  ['Section',       'Metric',                 'Target'],
  ['Kyle',          'Outbound Calls',          '15'],
  ['Kyle',          'Talk Time',               '45 min'],
  ['Kyle',          'Quotes (Qty)',             '4'],
  ['Kyle',          'Quotes ($)',               '$80,000'],
  ['Kyle',          'Client Meetings',          '4'],
  ['Kyle',          'BD Meetings',              '1'],
  ['Dov',           'Outbound Calls',           '15'],
  ['Dov',           'Talk Time',               '45 min'],
  ['Dov',           'Quotes (Qty)',             '4'],
  ['Dov',           'Quotes ($)',               '$80,000'],
  ['Dov',           'Client Meetings',          '4'],
  ['Dov',           'BD Meetings',              '1'],
  ['Brad',          'Outbound Calls',           '60'],
  ['Brad',          'Talk Time',               '180 min'],
  ['Brad',          'Quotes (Qty)',             '25'],
  ['Brad',          'Quotes ($)',               '$50,000'],
  ['Hardscape Crew','Revenue',                 '$6,000'],
  ['Hardscape Crew','Labor Hours',             '28'],
  ['Hardscape Crew','Labor Cost',              '$980'],
  ['Hardscape Crew','Labor %',                 '17%'],
  ['Hardscape Crew','Rev/Hr',                  '$210'],
  ['Enhancement',   'Revenue',                 '$3,000'],
  ['Enhancement',   'Labor Hours',             '24'],
  ['Enhancement',   'Labor Cost',              '$840'],
  ['Enhancement',   'Labor %',                 '28%'],
  ['Enhancement',   'Rev/Hr',                  '$123'],
  ['Maintenance',   'Revenue',                 '$1,800'],
  ['Maintenance',   'Labor Hours',             '16'],
  ['Maintenance',   'Labor Cost',              '$480'],
  ['Maintenance',   'Labor %',                 '27%'],
  ['Maintenance',   'Rev/Hr',                  '$110'],
];

async function getAuth() {
  const credPath = process.env.GOOGLE_CREDENTIALS_PATH;
  if (!credPath) throw new Error('GOOGLE_CREDENTIALS_PATH not set in .env');
  const resolved = path.isAbsolute(credPath) ? credPath : path.resolve(__dirname, '..', credPath);
  const auth = new google.auth.GoogleAuth({
    keyFile: resolved,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth.getClient();
}

async function main() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) {
    console.error('ERROR: GOOGLE_SPREADSHEET_ID not set in .env');
    process.exit(1);
  }

  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTitles = meta.data.sheets.map((s) => s.properties.title);

  const requests = [];

  // Create "Targets" sheet if missing
  if (!existingTitles.includes('Targets')) {
    requests.push({ addSheet: { properties: { title: 'Targets', index: 0 } } });
  }

  if (requests.length) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
    console.log('Created missing sheets.');
  }

  // Write Targets data
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Targets!A1',
    valueInputOption: 'RAW',
    requestBody: { values: TARGETS },
  });
  console.log('Targets tab populated.');

  // The Daily Log sheet is created automatically on first sync.
  console.log('\nSetup complete!');
  console.log(`Spreadsheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
  console.log('The "Daily Log" tab will be created automatically on your first sync.');
}

main().catch((err) => { console.error('Setup failed:', err.message); process.exit(1); });
