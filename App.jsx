import { useState, useEffect } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  black:   "#0A0A0A",
  card:    "#141414",
  surface: "#1C1C1C",
  border:  "#2A2A2A",
  yellow:  "#F5C518",
  yellowD: "#D4A90E",
  white:   "#FFFFFF",
  gray:    "#888888",
  grayL:   "#555555",
  red:     "#E05252",
  green:   "#4CAF7D",
  text:    "#E8E8E8",
  textDim: "#888888",
};

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "vil_scorecard_v2";
const API = "/api";

const loadAll = async () => {
  try {
    const res = await fetch(`${API}/data`);
    if (!res.ok) throw new Error("server unavailable");
    const data = await res.json();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
    return data;
  } catch {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  }
};

const saveAll = async (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  try {
    await fetch(`${API}/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {}
};
const todayKey = () => new Date().toISOString().slice(0, 10);
const fmtDate = (k) => { const [y,m,d] = k.split("-"); return `${m}/${d}/${y}`; };

// ─── TARGETS ──────────────────────────────────────────────────────────────────
const TARGETS = {
  sales_kyle: {
    outbound_calls: "15", avg_talk_time: "45 min", quotes_sent_qty: "4",
    quotes_sent_rev: "$80,000", client_meetings: "4", bd_meetings: "1",
  },
  sales_dov: {
    outbound_calls: "15", avg_talk_time: "45 min", quotes_sent_qty: "4",
    quotes_sent_rev: "$80,000", client_meetings: "4", bd_meetings: "1",
  },
  sales_brad: {
    outbound_calls: "60", avg_talk_time: "180 min", quotes_sent_qty: "25",
    quotes_sent_rev: "$50,000", client_meetings: "—", bd_meetings: "—",
  },
  hs_crew_0: { revenue: "$6,000", labor_hours: "28", labor_cost: "$980", labor_ratio: "17%", rev_per_hour: "$210", receipt_compliance: "2/2 + purchases" },
  hs_crew_1: { revenue: "$6,000", labor_hours: "28", labor_cost: "$980", labor_ratio: "17%", rev_per_hour: "$210", receipt_compliance: "2/2 + purchases" },
  en_crew_0: { revenue: "$3,000", labor_hours: "24", labor_cost: "$840", labor_ratio: "28%", rev_per_hour: "$123", receipt_compliance: "2/2 + purchases" },
  en_crew_1: { revenue: "$3,000", labor_hours: "24", labor_cost: "$840", labor_ratio: "28%", rev_per_hour: "$123", receipt_compliance: "2/2 + purchases" },
  en_crew_2: { revenue: "$3,000", labor_hours: "24", labor_cost: "$840", labor_ratio: "28%", rev_per_hour: "$123", receipt_compliance: "2/2 + purchases" },
  mn_crew_0: { revenue: "$1,800", labor_hours: "16", labor_cost: "$480", labor_ratio: "27%", rev_per_hour: "$110", receipt_compliance: "N/A" },
  mn_crew_1: { revenue: "$1,800", labor_hours: "16", labor_cost: "$480", labor_ratio: "27%", rev_per_hour: "$110", receipt_compliance: "N/A" },
  mn_crew_2: { revenue: "$1,800", labor_hours: "16", labor_cost: "$480", labor_ratio: "27%", rev_per_hour: "$110", receipt_compliance: "N/A" },
};

// ─── FIELD DEFINITIONS ────────────────────────────────────────────────────────
const mkSalesFields = (repId) => [
  { key: "outbound_calls",  label: "Outbound Calls",          hint: "GHL",                   type: "number", target: TARGETS[repId]?.outbound_calls },
  { key: "avg_talk_time",   label: "Total Talk Time",         hint: "GHL (mins)",             type: "text",   target: TARGETS[repId]?.avg_talk_time },
  { key: "deals_pre_quote", label: "Deals Moved — Pre-Quote", hint: "GHL pipeline",           type: "number", target: "—" },
  { key: "deals_post_quote",label: "Deals Moved — Post-Quote",hint: "GHL pipeline",           type: "number", target: "—" },
  { key: "quotes_sent_qty", label: "Quotes Sent (Qty)",       hint: "GHL opportunities",      type: "number", target: TARGETS[repId]?.quotes_sent_qty },
  { key: "quotes_sent_rev", label: "Quotes Sent ($)",         hint: "Sum of quote values",    type: "number", target: TARGETS[repId]?.quotes_sent_rev },
  { key: "client_meetings", label: "Client Meetings Taken",   hint: "GHL calendar",           type: "number", target: TARGETS[repId]?.client_meetings },
  { key: "bd_meetings",     label: "BD / Outreach Meetings",  hint: "Architects, builders…",  type: "number", target: TARGETS[repId]?.bd_meetings },
];

const mkCrewFields = (tKey) => [
  { key: "revenue",           label: "Revenue Produced ($)",      hint: "Billable revenue",      type: "number", target: TARGETS[tKey]?.revenue },
  { key: "labor_hours",       label: "Billable Labor Hours",       hint: "LMN — billable only",  type: "number", target: TARGETS[tKey]?.labor_hours },
  { key: "labor_cost",        label: "Labor Cost ($)",             hint: "LMN",                  type: "number", target: TARGETS[tKey]?.labor_cost },
  { key: "labor_ratio",       label: "Labor Cost % of Revenue",    hint: "Auto-calc",            calc: (v) => v.revenue && v.labor_cost ? ((parseFloat(v.labor_cost)/parseFloat(v.revenue))*100).toFixed(1)+"%" : "", target: TARGETS[tKey]?.labor_ratio },
  { key: "rev_per_hour",      label: "Revenue Per Billable Hour",  hint: "Auto-calc",            calc: (v) => v.revenue && v.labor_hours ? "$"+(parseFloat(v.revenue)/parseFloat(v.labor_hours)).toFixed(2) : "", target: TARGETS[tKey]?.rev_per_hour },
  { key: "lunch_checklist",   label: "Lunch Checklist",            hint: "Connect Team",         type: "yn" },
  { key: "eod_checklist",     label: "EOD Checklist",              hint: "Connect Team",         type: "yn" },
  { key: "receipt_compliance",label: "Receipt Compliance",         hint: "Submitted / Total",    type: "text",   target: TARGETS[tKey]?.receipt_compliance },
];

const HR_FIELDS = [
  { key: "show_rate",          label: "Crew Attendance / Show Rate", hint: "LMN / Greenius",  type: "text" },
  { key: "no_shows",           label: "No-Shows / Call-Outs",        hint: "List names",      type: "text" },
  { key: "late_arrivals",      label: "Late Arrivals",               hint: "List names",      type: "text" },
  { key: "new_apps",           label: "New Applications Received",   hint: "ATS / manual",    type: "number" },
  { key: "interviews_sched",   label: "Interviews Scheduled",        hint: "Calendar",        type: "number" },
  { key: "onboarding_tasks",   label: "Onboarding Tasks Completed",  hint: "Manual",          type: "number" },
  { key: "incidents",          label: "Incident / Safety Reports",   hint: "Count",           type: "number" },
];
const FINANCE_FIELDS = [
  { key: "invoices_count",  label: "Invoices Sent (Count)",      hint: "LMN",              type: "number" },
  { key: "invoices_value",  label: "Invoices Sent (Total $)",    hint: "LMN",              type: "number" },
  { key: "outstanding_ar",  label: "Outstanding AR 30+ Days",    hint: "Flag 60+",         type: "text" },
  { key: "tool_spend",      label: "Tool / Equipment Spend ($)", hint: "Bank — non-rental",type: "number" },
  { key: "receipt_comp",    label: "Receipt Compliance",         hint: "e.g. 7/10",        type: "text" },
];
const CX_FIELDS = [
  { key: "google_reviews",  label: "Google Reviews Received",    hint: "Count",            type: "number" },
  { key: "avg_rating",      label: "Avg Star Rating",            hint: "Note each rating", type: "text" },
  { key: "complaints",      label: "Complaints / Issues Logged", hint: "Count + summary",  type: "text" },
  { key: "callbacks",       label: "Warranty / Callback Requests",hint: "GHL / phone",     type: "number" },
];
const MKT_D2D_FIELDS = [
  { key: "doors_knocked",  label: "Doors Knocked",                  hint: "Knockio",        type: "number" },
  { key: "conversations",  label: "Conversations / Opened Doors",   hint: "Knockio",        type: "number" },
  { key: "leads",          label: "Leads Generated",                hint: "D2D Sheet",      type: "number" },
  { key: "appointments",   label: "Appointments / Greened Clients", hint: "D2D Sheet",      type: "number" },
];
const MKT_GOOGLE_PAID_FIELDS = [
  { key: "gpaid_spend",  label: "Daily Ad Spend ($)",    hint: "Google Ads",     type: "number" },
  { key: "gpaid_clicks", label: "Clicks",                hint: "Google Ads",     type: "number" },
  { key: "gpaid_leads",  label: "Leads / Conversions",   hint: "Google Ads",     type: "number" },
  { key: "gpaid_cpl",    label: "Cost Per Lead ($)",      hint: "Auto-calc",      calc: (v) => v.gpaid_spend && v.gpaid_leads ? "$"+(parseFloat(v.gpaid_spend)/parseFloat(v.gpaid_leads)).toFixed(2) : "" },
];
const MKT_SEO_FIELDS = [
  { key: "seo_leads",    label: "Organic Leads / Form Fills", hint: "GA / GHL",               type: "number" },
  { key: "seo_calls",    label: "Organic Calls",              hint: "Google Business / GHL",   type: "number" },
  { key: "seo_ranking",  label: "Notable Ranking Changes",    hint: "Any keyword movement",    type: "text" },
];
const MKT_META_FIELDS = [
  { key: "meta_spend",  label: "Daily Ad Spend ($)",  hint: "Meta Ads Manager",  type: "number" },
  { key: "meta_leads",  label: "Leads Generated",     hint: "Meta Ads Manager",  type: "number" },
  { key: "meta_cpl",    label: "Cost Per Lead ($)",    hint: "Auto-calc",         calc: (v) => v.meta_spend && v.meta_leads ? "$"+(parseFloat(v.meta_spend)/parseFloat(v.meta_leads)).toFixed(2) : "" },
];

const HS_CREWS  = ["Hardscape Crew 1", "Hardscape Crew 2"];
const EN_CREWS  = ["Enhancement Crew 1", "Enhancement Crew 2", "Enhancement Crew 3"];
const MN_CREWS  = ["Maintenance Crew 1", "Maintenance Crew 2", "Maintenance Crew 3"];

const TABS = [
  { id: "sales_kyle", label: "Kyle",       group: "Sales" },
  { id: "sales_dov",  label: "Dov",        group: "Sales" },
  { id: "sales_brad", label: "Brad",       group: "Sales" },
  { id: "hardscape",  label: "Hardscape Ops",       group: "Ops" },
  { id: "enhancement_maintenance", label: "Enhancement & Maint.", group: "Ops" },
  { id: "emily_hr",   label: "HR & Finance", group: "Emily" },
  { id: "cx",         label: "Client XP",   group: "Emily" },
  { id: "marketing",  label: "Marketing",   group: "Marketing" },
];

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────
const generatePDF = (dayData, dateKey) => {
  const date = fmtDate(dateKey);
  const Y = "#F5C518"; const BG = "#0A0A0A"; const CARD = "#141414"; const BORDER = "#2A2A2A";

  const cv = (f, vals) => f.calc ? (f.calc(vals)||"—") : (vals[f.key]||"—");

  const rows = (fields, vals, showTarget=false) => fields.map(f => {
    const actual = cv(f, vals);
    const target = f.target;
    return `<tr>
      <td style="padding:7px 12px;font-size:12px;color:#ccc;border-bottom:1px solid #222;width:45%">${f.label}</td>
      <td style="padding:7px 12px;font-size:12px;font-weight:700;color:${f.calc?Y:"#fff"};text-align:right;border-bottom:1px solid #222;width:${showTarget&&target?"27%":"55%"}">${actual}</td>
      ${showTarget && target ? `<td style="padding:7px 12px;font-size:11px;color:#666;text-align:right;border-bottom:1px solid #222;width:28%">${target}</td>` : ""}
    </tr>`;
  }).join("");

  const block = (title, sub, fields, vals, showTarget=false) => `
    <div style="margin-bottom:16px;break-inside:avoid;page-break-inside:avoid">
      <div style="background:#1C1C1C;padding:9px 14px;border-left:3px solid ${Y};border-radius:4px 4px 0 0">
        <span style="color:#fff;font-size:13px;font-weight:800">${title}</span>
        ${sub?`<span style="color:#555;font-size:11px;margin-left:10px">${sub}</span>`:""}
      </div>
      <table style="width:100%;border-collapse:collapse;background:${CARD};border-radius:0 0 4px 4px">
        ${showTarget ? `<tr style="background:#111"><td style="padding:5px 12px;font-size:10px;color:#444;text-transform:uppercase;letter-spacing:1px">Metric</td><td style="padding:5px 12px;font-size:10px;color:#444;text-transform:uppercase;letter-spacing:1px;text-align:right">Actual</td><td style="padding:5px 12px;font-size:10px;color:#444;text-transform:uppercase;letter-spacing:1px;text-align:right">Target</td></tr>` : ""}
        ${rows(fields, vals, showTarget)}
        ${vals.notes?`<tr><td colspan="3" style="padding:8px 12px;font-size:11px;color:#888;background:#111;border-top:1px solid #222"><b style="color:#666">Notes:</b> ${vals.notes}</td></tr>`:""}
      </table>
    </div>`;

  const crewBlock = (name, fields, vals, showTarget=true) => `
    <div style="margin-bottom:12px;break-inside:avoid;page-break-inside:avoid">
      <div style="background:#1a1a1a;padding:7px 12px;border-left:2px solid ${Y};border-radius:3px 3px 0 0">
        <span style="color:${Y};font-size:12px;font-weight:700">${name}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;background:${CARD};border-radius:0 0 3px 3px">
        ${showTarget ? `<tr style="background:#111"><td style="padding:4px 12px;font-size:10px;color:#333;text-transform:uppercase;letter-spacing:1px">Metric</td><td style="padding:4px 12px;font-size:10px;color:#333;text-transform:uppercase;letter-spacing:1px;text-align:right">Actual</td><td style="padding:4px 12px;font-size:10px;color:#333;text-transform:uppercase;letter-spacing:1px;text-align:right">Target</td></tr>` : ""}
        ${rows(fields, vals, showTarget)}
      </table>
    </div>`;

  const hdr = (title, sub="") => `
    <div style="border-left:4px solid ${Y};padding:12px 16px;margin-bottom:20px;background:#111;border-radius:4px">
      <div style="color:#fff;font-size:18px;font-weight:900;letter-spacing:-0.5px">${title}</div>
      ${sub?`<div style="color:#555;font-size:11px;margin-top:3px">${sub}</div>`:""}
      <div style="color:#333;font-size:11px;margin-top:4px">Daily Scorecard — ${date}</div>
    </div>`;

  const pg = (content) => `<div style="padding:24px;page-break-before:always;background:${BG};min-height:100vh">${content}</div>`;

  const salesPg = (name, id) => {
    const v = dayData[id]||{};
    return pg(`${hdr(name+" — Sales","Sales Representative")}${block("",null,mkSalesFields(id),v,true)}`);
  };

  const hsPg = () => {
    const crews = HS_CREWS.map((c,i)=>crewBlock(c, mkCrewFields(`hs_crew_${i}`), dayData[`hs_crew_${i}`]||{})).join("");
    const dv = dayData["ops_dylan"]||{};
    return pg(`${hdr("Hardscape Operations","Hardscape Crews 1 & 2")}${crews}
      <div style="margin-bottom:12px;break-inside:avoid">
        <div style="background:#1a1a1a;padding:7px 12px;border-left:2px solid #555;border-radius:3px 3px 0 0">
          <span style="color:#888;font-size:12px;font-weight:700">Dylan — Mechanic (EOD Shop Checklist)</span>
        </div>
        <table style="width:100%;border-collapse:collapse;background:${CARD}">
          <tr><td style="padding:7px 12px;font-size:12px;color:#ccc;border-bottom:1px solid #222">EOD Shop Checklist Submitted</td>
          <td style="padding:7px 12px;font-size:12px;font-weight:700;color:#fff;text-align:right">${dv.shop_checklist||"—"}</td></tr>
          ${dv.notes?`<tr><td colspan="2" style="padding:8px 12px;font-size:11px;color:#666;background:#111"><b>Notes:</b> ${dv.notes}</td></tr>`:""}
        </table>
      </div>`);
  };

  const enMnPg = () => {
    const en = EN_CREWS.map((c,i)=>crewBlock(c, mkCrewFields(`en_crew_${i}`), dayData[`en_crew_${i}`]||{})).join("");
    const mn = MN_CREWS.map((c,i)=>crewBlock(c, mkCrewFields(`mn_crew_${i}`), dayData[`mn_crew_${i}`]||{})).join("");
    return pg(`${hdr("Enhancement & Maintenance Operations")}
      <div style="color:${Y};font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;font-weight:700">Enhancement</div>${en}
      <div style="color:${Y};font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:16px 0 10px;font-weight:700">Maintenance</div>${mn}`);
  };

  const emilyPg = () => pg(`${hdr("Emily — HR & Finance")}
    ${block("Human Resources",null,HR_FIELDS,dayData["hr"]||{})}
    ${block("Finance",null,FINANCE_FIELDS,dayData["finance"]||{})}`);

  const cxPg = () => pg(`${hdr("Client Experience","Emily")}${block("",null,CX_FIELDS,dayData["cx"]||{})}`);

  const mktPg = () => pg(`${hdr("Marketing","D2D: Dov  |  Digital: Brodie")}
    ${block("D2D","Knockio + D2D Sheet",MKT_D2D_FIELDS,dayData["mkt_d2d"]||{})}
    ${block("Google Paid","Google Ads Manager",MKT_GOOGLE_PAID_FIELDS,dayData["mkt_gpaid"]||{})}
    ${block("Google SEO","Organic — GA / GHL",MKT_SEO_FIELDS,dayData["mkt_seo"]||{})}
    ${block("Facebook / Meta","Meta Ads Manager",MKT_META_FIELDS,dayData["mkt_meta"]||{})}`);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Daily Scorecards — ${date}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#0A0A0A}
@media print{body{background:#0A0A0A;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:.4in;size:letter}}</style>
</head><body>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#0A0A0A;text-align:center;padding:40px;page-break-after:always">
  <div style="width:60px;height:4px;background:${Y};margin:0 auto 28px"></div>
  <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#444;margin-bottom:16px">Leadership Performance Report</div>
  <div style="font-size:54px;font-weight:900;letter-spacing:-2px;color:#fff;margin-bottom:16px">Daily Scorecards</div>
  <div style="background:#141414;border:1px solid #2A2A2A;border-radius:6px;padding:14px 36px;font-size:20px;font-weight:700;color:${Y};margin-bottom:20px;letter-spacing:1px">${date}</div>
  <div style="font-size:11px;color:#333">Reporting on previous day's activity &nbsp;·&nbsp; Generated ${new Date().toLocaleTimeString()}</div>
  <div style="width:60px;height:4px;background:${Y};margin:28px auto 0"></div>
</div>
${salesPg("Kyle","sales_kyle")}
${salesPg("Dov","sales_dov")}
${salesPg("Brad","sales_brad")}
${hsPg()}
${enMnPg()}
${emilyPg()}
${cxPg()}
${mktPg()}
</body></html>`;

  const win = window.open("","_blank");
  if (!win) { alert("Please allow popups to export the PDF."); return; }
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); setTimeout(() => win.print(), 400); };
};

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
const Field = ({ field, value, onChange, sectionValues, showTarget }) => {
  const calcVal = field.calc ? field.calc(sectionValues||{}) : null;
  const target = field.target;

  if (field.calc) return (
    <div style={s.fieldRow}>
      <div style={s.fieldLabel}>
        <span style={s.labelText}>{field.label}</span>
        <span style={s.hintText}>{field.hint}</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {showTarget && target && <span style={s.targetBadge}>{target}</span>}
        <div style={{ ...s.calcVal }}>{calcVal || <span style={{ color:T.grayL, fontSize:12 }}>auto</span>}</div>
      </div>
    </div>
  );

  if (field.type === "yn") return (
    <div style={s.fieldRow}>
      <div style={s.fieldLabel}>
        <span style={s.labelText}>{field.label}</span>
        <span style={s.hintText}>{field.hint}</span>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        {["Y","N"].map(opt => (
          <button key={opt} onClick={() => onChange(opt===value?"":opt)}
            style={{ width:40, height:32, border:"none", borderRadius:6, cursor:"pointer", fontWeight:800, fontSize:13,
              background: value===opt ? (opt==="Y"?T.green:T.red) : T.surface,
              color: value===opt ? T.white : T.gray, transition:"all 0.15s" }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={s.fieldRow}>
      <div style={s.fieldLabel}>
        <span style={s.labelText}>{field.label}</span>
        <span style={s.hintText}>{field.hint}</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {showTarget && target && <span style={s.targetBadge}>{target}</span>}
        <input type={field.type==="number"?"number":"text"} value={value||""} onChange={e=>onChange(e.target.value)}
          placeholder="—" style={s.input} />
      </div>
    </div>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div style={{ borderLeft:`3px solid ${T.yellow}`, paddingLeft:14, marginBottom:16 }}>
    <div style={{ color:T.white, fontWeight:900, fontSize:20, letterSpacing:-0.5 }}>{title}</div>
    {subtitle && <div style={{ color:T.gray, fontSize:12, marginTop:3 }}>{subtitle}</div>}
  </div>
);

const Card = ({ children, style={} }) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, marginBottom:14, overflow:"hidden", ...style }}>
    {children}
  </div>
);

const CardLabel = ({ title, sub, accent=false }) => (
  <div style={{ background:T.surface, padding:"10px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
    <div style={{ width:3, height:18, background: accent ? T.yellow : T.grayL, borderRadius:2, flexShrink:0 }} />
    <span style={{ color: accent ? T.yellow : T.text, fontWeight:700, fontSize:14 }}>{title}</span>
    {sub && <span style={{ color:T.grayL, fontSize:11 }}>{sub}</span>}
  </div>
);

const TargetHeader = ({ showTarget }) => showTarget ? (
  <div style={{ display:"flex", justifyContent:"flex-end", padding:"5px 16px", borderBottom:`1px solid ${T.border}`, gap:12 }}>
    <span style={{ fontSize:10, color:T.grayL, textTransform:"uppercase", letterSpacing:1.5, width:140, textAlign:"right" }}>Actual</span>
    <span style={{ fontSize:10, color:"#444", textTransform:"uppercase", letterSpacing:1.5, width:100, textAlign:"right" }}>Target</span>
  </div>
) : null;

const NotesBox = ({ value, onChange, label="Notes / Flags" }) => (
  <div style={{ padding:"10px 16px 14px", borderTop:`1px solid ${T.border}` }}>
    <div style={{ fontSize:10, fontWeight:700, color:T.grayL, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>{label}</div>
    <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder="Flag anything unusual..."
      style={{ width:"100%", minHeight:56, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:"8px 12px", fontSize:13, resize:"vertical", outline:"none", color:T.text, boxSizing:"border-box", fontFamily:"inherit" }} />
  </div>
);

const SalesSection = ({ repId, repName, dayData, setField }) => {
  const vals = dayData[repId]||{};
  const fields = mkSalesFields(repId);
  return (
    <div>
      <SectionHeader title={repName} subtitle="Sales Representative" />
      <Card>
        <CardLabel title="Performance" sub="vs. Daily Target" accent />
        <TargetHeader showTarget />
        {fields.map(f => <Field key={f.key} field={f} value={vals[f.key]||""} onChange={v=>setField(repId,f.key,v)} sectionValues={vals} showTarget />)}
        <NotesBox value={vals.notes} onChange={v=>setField(repId,"notes",v)} />
      </Card>
    </div>
  );
};

const CrewBlock = ({ crewName, fields, values, onChange, accent=true }) => (
  <Card style={{ marginBottom:12 }}>
    <CardLabel title={crewName} accent={accent} />
    <TargetHeader showTarget />
    {fields.map(f => <Field key={f.key} field={f} value={values[f.key]||""} onChange={v=>onChange(f.key,v)} sectionValues={values} showTarget />)}
  </Card>
);

const SubLabel = ({ text }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0 10px" }}>
    <div style={{ width:20, height:2, background:T.yellow }} />
    <span style={{ color:T.yellow, fontSize:10, textTransform:"uppercase", letterSpacing:2.5, fontWeight:700 }}>{text}</span>
    <div style={{ flex:1, height:1, background:T.border }} />
  </div>
);

const HistoryView = ({ allData, onClose }) => {
  const dates = Object.keys(allData).sort((a,b)=>b.localeCompare(a));
  const [sel, setSel] = useState(dates[0]||null);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, width:"min(92vw,680px)", maxHeight:"85vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ background:T.surface, padding:"15px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:3, height:20, background:T.yellow, borderRadius:2 }} />
            <span style={{ color:T.white, fontWeight:800, fontSize:16 }}>History</span>
          </div>
          <button onClick={onClose} style={{ background:T.surface, border:`1px solid ${T.border}`, color:T.gray, borderRadius:7, padding:"6px 14px", cursor:"pointer", fontSize:13 }}>Close</button>
        </div>
        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          <div style={{ width:140, borderRight:`1px solid ${T.border}`, overflowY:"auto", background:T.black }}>
            {dates.length===0 && <div style={{ padding:16, color:T.grayL, fontSize:13 }}>No history yet</div>}
            {dates.map(d => (
              <div key={d} onClick={()=>setSel(d)}
                style={{ padding:"11px 14px", cursor:"pointer", background:sel===d?"#1C1C1C":"transparent",
                  borderLeft:sel===d?`3px solid ${T.yellow}`:"3px solid transparent",
                  fontSize:13, fontWeight:sel===d?700:400, color:sel===d?T.yellow:T.gray }}>
                {fmtDate(d)}
              </div>
            ))}
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:18, background:T.black }}>
            {sel && allData[sel] ? (
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:T.yellow, marginBottom:14 }}>{fmtDate(sel)}</div>
                {[{id:"sales_kyle",label:"Kyle"},{id:"sales_dov",label:"Dov"},{id:"sales_brad",label:"Brad"}].map(sec => {
                  const vals = allData[sel][sec.id]||{};
                  if (!Object.values(vals).some(v=>v)) return null;
                  return (
                    <div key={sec.id} style={{ marginBottom:14, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
                      <div style={{ background:T.surface, padding:"8px 12px", color:T.yellow, fontWeight:700, fontSize:13 }}>{sec.label}</div>
                      {mkSalesFields(sec.id).filter(f=>!f.calc&&vals[f.key]).map(f => (
                        <div key={f.key} style={{ display:"flex", justifyContent:"space-between", padding:"7px 12px", borderBottom:`1px solid ${T.border}`, fontSize:13 }}>
                          <span style={{ color:T.gray }}>{f.label}</span>
                          <span style={{ fontWeight:700, color:T.white }}>{vals[f.key]}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : <div style={{ color:T.grayL, fontSize:14 }}>Select a date</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [allData, setAllData] = useState({});
  const [dateKey, setDateKey] = useState(todayKey());
  const [activeTab, setActiveTab] = useState("sales_kyle");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sheetsEnabled, setSheetsEnabled] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  useEffect(() => {
    loadAll().then(d => { setAllData(d); setLoaded(true); });
    fetch(`${API}/status`).then(r => r.json()).then(s => {
      setSheetsEnabled(s.sheetsEnabled);
      setSpreadsheetId(s.spreadsheetId);
    }).catch(() => {});
  }, []);

  const dayData = allData[dateKey]||{};
  const setField = (sid, key, val) => {
    setAllData(prev => ({
      ...prev,
      [dateKey]: { ...(prev[dateKey]||{}), [sid]: { ...((prev[dateKey]||{})[sid]||{}), [key]: val } }
    }));
  };
  const getSection = (id) => (allData[dateKey]||{})[id]||{};

  const handleSync = async (dateToSync, data) => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch(`${API}/sync/${dateToSync}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");
      setSyncMsg({ ok: true, text: "Synced to Sheets" });
    } catch (err) {
      setSyncMsg({ ok: false, text: err.message });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 5000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await saveAll(allData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
    if (sheetsEnabled) handleSync(dateKey, dayData);
  };
  const handleExport = () => {
    setExporting(true);
    setTimeout(()=>{ generatePDF(dayData, dateKey); setExporting(false); }, 150);
  };

  const groups = [...new Set(TABS.map(t=>t.group))];

  const renderContent = () => {
    const tab = activeTab;
    if (tab === "sales_kyle") return <SalesSection repId="sales_kyle" repName="Kyle" dayData={dayData} setField={setField} />;
    if (tab === "sales_dov")  return <SalesSection repId="sales_dov"  repName="Dov"  dayData={dayData} setField={setField} />;
    if (tab === "sales_brad") return <SalesSection repId="sales_brad" repName="Brad" dayData={dayData} setField={setField} />;

    if (tab === "hardscape") return (
      <div>
        <SectionHeader title="Hardscape Ops" subtitle="Hardscape Crews 1 & 2" />
        {HS_CREWS.map((crew,i) => (
          <CrewBlock key={crew} crewName={crew} fields={mkCrewFields(`hs_crew_${i}`)}
            values={getSection(`hs_crew_${i}`)} onChange={(k,v)=>setField(`hs_crew_${i}`,k,v)} />
        ))}
        <Card>
          <CardLabel title="Dylan — Mechanic" sub="EOD Shop Checklist" />
          <Field field={{ key:"shop_checklist", label:"EOD Shop Checklist Submitted", hint:"Connect Team", type:"yn" }}
            value={getSection("ops_dylan").shop_checklist||""} onChange={v=>setField("ops_dylan","shop_checklist",v)} />
          <NotesBox value={getSection("ops_dylan").notes} onChange={v=>setField("ops_dylan","notes",v)} />
        </Card>
      </div>
    );

    if (tab === "enhancement_maintenance") return (
      <div>
        <SectionHeader title="Enhancement & Maintenance" subtitle="All field crews" />
        <SubLabel text="Enhancement" />
        {EN_CREWS.map((crew,i) => (
          <CrewBlock key={crew} crewName={crew} fields={mkCrewFields(`en_crew_${i}`)}
            values={getSection(`en_crew_${i}`)} onChange={(k,v)=>setField(`en_crew_${i}`,k,v)} />
        ))}
        <SubLabel text="Maintenance" />
        {MN_CREWS.map((crew,i) => (
          <CrewBlock key={crew} crewName={crew} fields={mkCrewFields(`mn_crew_${i}`)}
            values={getSection(`mn_crew_${i}`)} onChange={(k,v)=>setField(`mn_crew_${i}`,k,v)} />
        ))}
      </div>
    );

    if (tab === "emily_hr") {
      const hrV = getSection("hr"); const finV = getSection("finance");
      return (
        <div>
          <SectionHeader title="Emily" subtitle="HR & Finance" />
          <Card>
            <CardLabel title="Human Resources" accent />
            {HR_FIELDS.map(f=><Field key={f.key} field={f} value={hrV[f.key]||""} onChange={v=>setField("hr",f.key,v)} sectionValues={hrV} />)}
            <NotesBox value={hrV.notes} onChange={v=>setField("hr","notes",v)} />
          </Card>
          <Card>
            <CardLabel title="Finance" accent />
            {FINANCE_FIELDS.map(f=><Field key={f.key} field={f} value={finV[f.key]||""} onChange={v=>setField("finance",f.key,v)} sectionValues={finV} />)}
            <NotesBox value={finV.notes} onChange={v=>setField("finance","notes",v)} />
          </Card>
        </div>
      );
    }

    if (tab === "cx") {
      const vals = getSection("cx");
      return (
        <div>
          <SectionHeader title="Client Experience" subtitle="Emily" />
          <Card>
            <CardLabel title="Daily Satisfaction Tracker" accent />
            {CX_FIELDS.map(f=><Field key={f.key} field={f} value={vals[f.key]||""} onChange={v=>setField("cx",f.key,v)} sectionValues={vals} />)}
            <NotesBox value={vals.notes} onChange={v=>setField("cx","notes",v)} label="Issue / Review Summary" />
          </Card>
        </div>
      );
    }

    if (tab === "marketing") {
      const d2d=getSection("mkt_d2d"), gp=getSection("mkt_gpaid"), seo=getSection("mkt_seo"), m=getSection("mkt_meta");
      return (
        <div>
          <SectionHeader title="Marketing" subtitle="D2D: Dov  ·  Digital: Brodie" />
          <Card>
            <CardLabel title="D2D" sub="Knockio + D2D Sheet" accent />
            {MKT_D2D_FIELDS.map(f=><Field key={f.key} field={f} value={d2d[f.key]||""} onChange={v=>setField("mkt_d2d",f.key,v)} sectionValues={d2d} />)}
          </Card>
          <Card>
            <CardLabel title="Google Paid" sub="Google Ads Manager" accent />
            {MKT_GOOGLE_PAID_FIELDS.map(f=><Field key={f.key} field={f} value={gp[f.key]||""} onChange={v=>setField("mkt_gpaid",f.key,v)} sectionValues={gp} />)}
          </Card>
          <Card>
            <CardLabel title="Google SEO" sub="Organic — GA / GHL" accent />
            {MKT_SEO_FIELDS.map(f=><Field key={f.key} field={f} value={seo[f.key]||""} onChange={v=>setField("mkt_seo",f.key,v)} sectionValues={seo} />)}
          </Card>
          <Card>
            <CardLabel title="Facebook / Meta" sub="Meta Ads Manager" accent />
            {MKT_META_FIELDS.map(f=><Field key={f.key} field={f} value={m[f.key]||""} onChange={v=>setField("mkt_meta",f.key,v)} sectionValues={m} />)}
          </Card>
        </div>
      );
    }
  };

  if (!loaded) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:T.black }}>
      <div style={{ color:T.yellow, fontSize:15, letterSpacing:2, textTransform:"uppercase" }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:T.black, fontFamily:"'DM Sans','Segoe UI',sans-serif", color:T.text }}>
      {/* ── HEADER ── */}
      <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:"0 20px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          {/* Top bar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0 12px", gap:10, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:4, height:32, background:T.yellow, borderRadius:2 }} />
              <div>
                <div style={{ color:T.white, fontWeight:900, fontSize:18, letterSpacing:-0.5 }}>Daily Scorecards</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:2 }}>
                  <div style={{ color:T.grayL, fontSize:11 }}>Leadership Performance — Previous Day</div>
                  {sheetsEnabled ? (
                    <a href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`} target="_blank" rel="noreferrer"
                      style={{ fontSize:10, color:T.green, fontWeight:700, textDecoration:"none", background:"#4CAF7D18", border:`1px solid ${T.green}33`, borderRadius:4, padding:"1px 6px", letterSpacing:0.3 }}>
                      ● Sheets Connected
                    </a>
                  ) : (
                    <span style={{ fontSize:10, color:"#555", fontWeight:600, background:"#1C1C1C", border:"1px solid #2A2A2A", borderRadius:4, padding:"1px 6px" }}>
                      ○ Sheets: setup needed
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <input type="date" value={dateKey} onChange={e=>setDateKey(e.target.value)}
                style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:7, color:T.text, padding:"6px 10px", fontSize:13, outline:"none", fontFamily:"inherit" }} />
              <button onClick={()=>setShowHistory(true)}
                style={{ background:T.surface, border:`1px solid ${T.border}`, color:T.text, borderRadius:7, padding:"7px 13px", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>
                History
              </button>
              <button onClick={handleExport} disabled={exporting}
                style={{ background:T.surface, border:`1px solid ${T.yellow}44`, color:T.yellow, borderRadius:7, padding:"7px 13px", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", opacity:exporting?0.6:1 }}>
                {exporting?"Building…":"⬇ Export PDF"}
              </button>
              {sheetsEnabled && (
                <button onClick={()=>handleSync(dateKey, dayData)} disabled={syncing}
                  style={{ background:T.surface, border:`1px solid ${T.green}44`, color:T.green, borderRadius:7, padding:"7px 13px", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", opacity:syncing?0.6:1 }}>
                  {syncing?"Syncing…":"⬆ Sync to Sheets"}
                </button>
              )}
              {syncMsg && (
                <span style={{ fontSize:12, color:syncMsg.ok?T.green:T.red, fontWeight:700, whiteSpace:"nowrap" }}>
                  {syncMsg.ok?"✓":"✗"} {syncMsg.text}
                </span>
              )}
              <button onClick={handleSave}
                style={{ background:saved?T.green:T.yellow, border:"none", color:saved?T.white:T.black, borderRadius:7, padding:"7px 20px", cursor:"pointer", fontSize:13, fontWeight:900, fontFamily:"inherit", transition:"all 0.2s", minWidth:76 }}>
                {saving?"Saving…":saved?"✓ Saved":"Save"}
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display:"flex", overflowX:"auto", borderTop:`1px solid ${T.border}`, marginTop:0 }}>
            {groups.map(group => (
              <div key={group} style={{ display:"flex", flexDirection:"column" }}>
                <div style={{ color:"#333", fontSize:9, textTransform:"uppercase", letterSpacing:2, paddingLeft:14, paddingTop:8, marginBottom:4 }}>{group}</div>
                <div style={{ display:"flex" }}>
                  {TABS.filter(t=>t.group===group).map(tab => (
                    <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                      style={{ background:"transparent", border:"none", borderBottom: activeTab===tab.id?`2px solid ${T.yellow}`:"2px solid transparent",
                        color: activeTab===tab.id?T.yellow:T.gray,
                        padding:"8px 14px 10px", cursor:"pointer", fontSize:13, fontWeight:activeTab===tab.id?800:500,
                        whiteSpace:"nowrap", transition:"all 0.15s", fontFamily:"inherit" }}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 20px 100px" }}>
        {renderContent()}
      </div>

      {showHistory && <HistoryView allData={allData} onClose={()=>setShowHistory(false)} />}
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = {
  fieldRow:   { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 16px", borderBottom:`1px solid ${T.border}`, gap:12 },
  fieldLabel: { flex:1, display:"flex", flexDirection:"column", gap:2 },
  labelText:  { fontSize:13.5, color:T.text, fontWeight:500 },
  hintText:   { fontSize:11, color:T.grayL, fontWeight:400 },
  input:      { width:130, border:`1px solid ${T.border}`, borderRadius:6, padding:"7px 10px", fontSize:13, outline:"none", fontFamily:"inherit", color:T.white, textAlign:"right", background:T.surface, flexShrink:0 },
  calcVal:    { width:130, height:34, background:"#1a1a0a", border:`1px solid ${T.yellow}33`, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:10, fontSize:13, fontWeight:700, color:T.yellow, flexShrink:0 },
  targetBadge:{ fontSize:11, color:"#444", background:T.surface, border:`1px solid ${T.border}`, borderRadius:4, padding:"3px 8px", whiteSpace:"nowrap", minWidth:80, textAlign:"center" },
};
