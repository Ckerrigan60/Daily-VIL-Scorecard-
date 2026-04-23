import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_NAME = 'Daily Log';

// ─── Column headers matching App.jsx field definitions ────────────────────────
const HEADERS = [
  'Date',
  // Sales — Kyle
  'Kyle | Outbound Calls', 'Kyle | Talk Time', 'Kyle | Pre-Quote Deals', 'Kyle | Post-Quote Deals',
  'Kyle | Quotes #', 'Kyle | Quotes $', 'Kyle | Client Meetings', 'Kyle | BD Meetings', 'Kyle | Notes',
  // Sales — Dov
  'Dov | Outbound Calls', 'Dov | Talk Time', 'Dov | Pre-Quote Deals', 'Dov | Post-Quote Deals',
  'Dov | Quotes #', 'Dov | Quotes $', 'Dov | Client Meetings', 'Dov | BD Meetings', 'Dov | Notes',
  // Sales — Brad
  'Brad | Outbound Calls', 'Brad | Talk Time', 'Brad | Pre-Quote Deals', 'Brad | Post-Quote Deals',
  'Brad | Quotes #', 'Brad | Quotes $', 'Brad | Notes',
  // Hardscape Crew 1
  'HS1 | Revenue', 'HS1 | Labor Hrs', 'HS1 | Labor Cost', 'HS1 | Labor %', 'HS1 | Rev/Hr',
  'HS1 | Lunch Checklist', 'HS1 | EOD Checklist', 'HS1 | Receipts',
  // Hardscape Crew 2
  'HS2 | Revenue', 'HS2 | Labor Hrs', 'HS2 | Labor Cost', 'HS2 | Labor %', 'HS2 | Rev/Hr',
  'HS2 | Lunch Checklist', 'HS2 | EOD Checklist', 'HS2 | Receipts',
  // Dylan — Mechanic
  'Dylan | Shop Checklist', 'Dylan | Notes',
  // Enhancement Crew 1
  'EN1 | Revenue', 'EN1 | Labor Hrs', 'EN1 | Labor Cost', 'EN1 | Labor %', 'EN1 | Rev/Hr',
  'EN1 | Lunch Checklist', 'EN1 | EOD Checklist', 'EN1 | Receipts',
  // Enhancement Crew 2
  'EN2 | Revenue', 'EN2 | Labor Hrs', 'EN2 | Labor Cost', 'EN2 | Labor %', 'EN2 | Rev/Hr',
  'EN2 | Lunch Checklist', 'EN2 | EOD Checklist', 'EN2 | Receipts',
  // Enhancement Crew 3
  'EN3 | Revenue', 'EN3 | Labor Hrs', 'EN3 | Labor Cost', 'EN3 | Labor %', 'EN3 | Rev/Hr',
  'EN3 | Lunch Checklist', 'EN3 | EOD Checklist', 'EN3 | Receipts',
  // Maintenance Crew 1
  'MN1 | Revenue', 'MN1 | Labor Hrs', 'MN1 | Labor Cost', 'MN1 | Labor %', 'MN1 | Rev/Hr', 'MN1 | Receipts',
  // Maintenance Crew 2
  'MN2 | Revenue', 'MN2 | Labor Hrs', 'MN2 | Labor Cost', 'MN2 | Labor %', 'MN2 | Rev/Hr', 'MN2 | Receipts',
  // Maintenance Crew 3
  'MN3 | Revenue', 'MN3 | Labor Hrs', 'MN3 | Labor Cost', 'MN3 | Labor %', 'MN3 | Rev/Hr', 'MN3 | Receipts',
  // HR
  'HR | Show Rate', 'HR | No-Shows', 'HR | Late Arrivals', 'HR | New Apps',
  'HR | Interviews Scheduled', 'HR | Onboarding Tasks', 'HR | Incidents', 'HR | Notes',
  // Finance
  'Finance | Invoices #', 'Finance | Invoices $', 'Finance | AR 30+',
  'Finance | Tool Spend', 'Finance | Receipt Compliance', 'Finance | Notes',
  // Client Experience
  'CX | Google Reviews', 'CX | Avg Rating', 'CX | Complaints', 'CX | Callbacks', 'CX | Notes',
  // D2D Marketing
  'D2D | Doors Knocked', 'D2D | Conversations', 'D2D | Leads', 'D2D | Appointments',
  // Google Paid
  'G.Paid | Spend', 'G.Paid | Clicks', 'G.Paid | Leads', 'G.Paid | CPL',
  // SEO
  'SEO | Leads', 'SEO | Calls', 'SEO | Ranking Notes',
  // Meta / Facebook
  'Meta | Spend', 'Meta | Leads', 'Meta | CPL',
];

// ─── Build row array from day data ───────────────────────────────────────────
function calcLaborRatio(section) {
  const rev = parseFloat(section?.revenue);
  const cost = parseFloat(section?.labor_cost);
  return rev && cost ? ((cost / rev) * 100).toFixed(1) + '%' : '';
}

function calcRevPerHr(section) {
  const rev = parseFloat(section?.revenue);
  const hrs = parseFloat(section?.labor_hours);
  return rev && hrs ? '$' + (rev / hrs).toFixed(2) : '';
}

function buildRow(date, dayData) {
  const d = dayData || {};
  const g = (sec, key) => d[sec]?.[key] ?? '';

  const crewCols = (sec) => [
    g(sec, 'revenue'), g(sec, 'labor_hours'), g(sec, 'labor_cost'),
    calcLaborRatio(d[sec]), calcRevPerHr(d[sec]),
    g(sec, 'lunch_checklist'), g(sec, 'eod_checklist'), g(sec, 'receipt_compliance'),
  ];
  const mnCrew = (sec) => [
    g(sec, 'revenue'), g(sec, 'labor_hours'), g(sec, 'labor_cost'),
    calcLaborRatio(d[sec]), calcRevPerHr(d[sec]), g(sec, 'receipt_compliance'),
  ];

  return [
    date,
    // Kyle
    g('sales_kyle','outbound_calls'), g('sales_kyle','avg_talk_time'),
    g('sales_kyle','deals_pre_quote'), g('sales_kyle','deals_post_quote'),
    g('sales_kyle','quotes_sent_qty'), g('sales_kyle','quotes_sent_rev'),
    g('sales_kyle','client_meetings'), g('sales_kyle','bd_meetings'), g('sales_kyle','notes'),
    // Dov
    g('sales_dov','outbound_calls'), g('sales_dov','avg_talk_time'),
    g('sales_dov','deals_pre_quote'), g('sales_dov','deals_post_quote'),
    g('sales_dov','quotes_sent_qty'), g('sales_dov','quotes_sent_rev'),
    g('sales_dov','client_meetings'), g('sales_dov','bd_meetings'), g('sales_dov','notes'),
    // Brad
    g('sales_brad','outbound_calls'), g('sales_brad','avg_talk_time'),
    g('sales_brad','deals_pre_quote'), g('sales_brad','deals_post_quote'),
    g('sales_brad','quotes_sent_qty'), g('sales_brad','quotes_sent_rev'), g('sales_brad','notes'),
    // Hardscape crews
    ...crewCols('hs_crew_0'),
    ...crewCols('hs_crew_1'),
    // Dylan
    g('ops_dylan','shop_checklist'), g('ops_dylan','notes'),
    // Enhancement crews
    ...crewCols('en_crew_0'),
    ...crewCols('en_crew_1'),
    ...crewCols('en_crew_2'),
    // Maintenance crews
    ...mnCrew('mn_crew_0'),
    ...mnCrew('mn_crew_1'),
    ...mnCrew('mn_crew_2'),
    // HR
    g('hr','show_rate'), g('hr','no_shows'), g('hr','late_arrivals'), g('hr','new_apps'),
    g('hr','interviews_sched'), g('hr','onboarding_tasks'), g('hr','incidents'), g('hr','notes'),
    // Finance
    g('finance','invoices_count'), g('finance','invoices_value'), g('finance','outstanding_ar'),
    g('finance','tool_spend'), g('finance','receipt_comp'), g('finance','notes'),
    // CX
    g('cx','google_reviews'), g('cx','avg_rating'), g('cx','complaints'), g('cx','callbacks'), g('cx','notes'),
    // D2D
    g('mkt_d2d','doors_knocked'), g('mkt_d2d','conversations'), g('mkt_d2d','leads'), g('mkt_d2d','appointments'),
    // Google Paid
    g('mkt_gpaid','gpaid_spend'), g('mkt_gpaid','gpaid_clicks'), g('mkt_gpaid','gpaid_leads'),
    (() => { const s = parseFloat(g('mkt_gpaid','gpaid_spend')); const l = parseFloat(g('mkt_gpaid','gpaid_leads')); return s && l ? '$'+(s/l).toFixed(2) : ''; })(),
    // SEO
    g('mkt_seo','seo_leads'), g('mkt_seo','seo_calls'), g('mkt_seo','seo_ranking'),
    // Meta
    g('mkt_meta','meta_spend'), g('mkt_meta','meta_leads'),
    (() => { const s = parseFloat(g('mkt_meta','meta_spend')); const l = parseFloat(g('mkt_meta','meta_leads')); return s && l ? '$'+(s/l).toFixed(2) : ''; })(),
  ];
}

// ─── Auth ────────────────────────────────────────────────────────────────────
async function getAuth() {
  const credPath = process.env.GOOGLE_CREDENTIALS_PATH;
  if (!credPath) throw new Error('GOOGLE_CREDENTIALS_PATH not set in .env');

  const resolvedPath = path.isAbsolute(credPath)
    ? credPath
    : path.resolve(__dirname, '..', credPath);

  const auth = new google.auth.GoogleAuth({
    keyFile: resolvedPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth.getClient();
}

// ─── Ensure the Daily Log sheet exists with headers ──────────────────────────
async function ensureSheetAndHeaders(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets.map((s) => s.properties.title);

  if (!existing.includes(SHEET_NAME)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_NAME}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
    return;
  }

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${SHEET_NAME}'!A1:1`,
  });
  if (!headerRes.data.values?.[0]?.[0]) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_NAME}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────
export function isConfigured() {
  return !!(process.env.GOOGLE_SPREADSHEET_ID && process.env.GOOGLE_CREDENTIALS_PATH);
}

export async function syncToSheets(date, dayData) {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('GOOGLE_SPREADSHEET_ID not set in .env');

  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await ensureSheetAndHeaders(sheets, spreadsheetId);

  const colARes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${SHEET_NAME}'!A:A`,
  });
  const dates = (colARes.data.values || []).map((r) => r[0]);
  const rowIndex = dates.indexOf(date);

  const row = buildRow(date, dayData);

  if (rowIndex < 1) {
    // Append (skip header at index 0)
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEET_NAME}'!A:A`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });
  } else {
    // Update existing row (1-indexed)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_NAME}'!A${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  }
}

export async function syncAllToSheets(allData) {
  const dates = Object.keys(allData).sort();
  for (const date of dates) {
    await syncToSheets(date, allData[date]);
  }
  return dates.length;
}
