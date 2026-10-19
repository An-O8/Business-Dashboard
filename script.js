/*
   Business Performance & Revenue Analytics Dashboard
   - All data is dummy data generated in the browser (no backend)
   - Relationships: lead -> quotations -> deals -> orders + payments
   */

// Small helpers
const DAY = 864e5;
const TODAY = Date.UTC(2026, 9, 19); // 19 Oct 2026
const byId = (id) => document.getElementById(id);
const rupee = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const kilo = (n) => "₹" + (n / 1000).toFixed(1) + "K";
const isoDate = (t) => new Date(t).toISOString().slice(0, 10);
const sum = (list, fn) => list.reduce((total, x) => total + fn(x), 0);
const pct = (a, b) => (b ? (a / b) * 100 : 0);
const initials = (name) => name.split(" ").map((w) => w[0]).join("");

let seed = 21;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const randInt = (a, b) => a + Math.floor(random() * (b - a + 1));
const pick = (list) => list[Math.floor(random() * list.length)];
function weighted(weights) {
  let r = random() * Object.values(weights).reduce((a, b) => a + b, 0);
  for (const key in weights) {
    r -= weights[key];
    if (r < 0) return key;
  }
}

// Static lists
const COLORS = ["#2563eb", "#06b6d4", "#10b981", "#f59e0b", "#f97316", "#8b5cf6", "#ef4444", "#64748b"];
const MONTHLY_TARGET = 8500000;
const SALES_USERS = ["Nancy Singh", "Sneha Choudhary", "Tannu Kumari", "Priya Nair"];
const OPS_USERS = ["Gaurav Pant", "Srishti Upadhyay", "Azam Afaroz"];
const SOURCES = ["Google Ads", "Website", "Other", "Just Dial"];
// service name -> [min quote, max quote, how often it is quoted]
const SERVICES = {
  "Private Limited Company": [12000, 26000, 30],
  "LLP Registration": [8000, 18000, 12],
  "GST Registration": [5000, 14000, 10],
  Trademark: [4000, 12000, 9],
  "FSSAI License": [3000, 11000, 8],
  "Annual Compliance": [6000, 15000, 8],
  "Startup India Registration": [2000, 6000, 6],
  "ISO Certification": [7000, 20000, 6],
  "Website Development": [6000, 20000, 5],
};
const SERVICE_NAMES = Object.keys(SERVICES);
const serviceWeights = Object.fromEntries(SERVICE_NAMES.map((s) => [s, SERVICES[s][2]]));
const CLIENTS = ["Aarav Mehta", "Diya Kapoor", "Rohan Verma", "Meera Iyer", "Kabir Khan", "Isha Gupta", "Vikram Rao", "Ananya Das", "Nikhil Jain", "Pooja Shah"];

// Dummy data (90 days)
const leads = [], quotations = [], deals = [], orders = [], payments = [];

for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
  const day = TODAY - daysAgo * DAY;
  const leadsToday = randInt(0, daysAgo < 30 ? 5 : 3);

  for (let n = 0; n < leadsToday; n++) {
    const lead = {
      id: "L-" + (209000 + leads.length),
      date: day,
      ts: day + randInt(9, 19) * 36e5 + randInt(0, 59) * 6e4,
      client: pick(CLIENTS),
      owner: pick(SALES_USERS),
      source: weighted({ "Google Ads": 70, Website: 21, Other: 6, "Just Dial": 3 }),
      status: weighted({ unqualified: 50, qualified: 30, converted: 20 }),
    };
    leads.push(lead);
    if (lead.status === "unqualified") continue;

    // a qualified/converted lead can have several quotations
    for (let i = 0; i < randInt(1, 3); i++) {
      const service = weighted(serviceWeights);
      const quoteDay = Math.min(TODAY, day + randInt(0, 3) * DAY);
      let status = weighted({ pending: 65, rejected: 25, accepted: 10 });
      if (lead.status === "converted" && i === 0) status = "accepted";
      if (lead.status === "qualified" && status === "accepted") status = "pending";

      const quote = {
        id: "Q-" + (10000 + quotations.length),
        lead: lead.id, owner: lead.owner, service, status,
        date: quoteDay,
        ts: quoteDay + randInt(9, 19) * 36e5,
        amount: Math.round(randInt(SERVICES[service][0], SERVICES[service][1]) / 100) * 100,
      };
      quotations.push(quote);
      if (status !== "accepted") continue;

      // accepted quotation -> deal -> orders + payments
      const dealDay = Math.min(TODAY, quoteDay + randInt(0, 2) * DAY);
      const deal = {
        id: "D-" + (800 + deals.length),
        lead: lead.id, quote: quote.id, owner: lead.owner, service,
        date: dealDay,
        ts: dealDay + randInt(9, 19) * 36e5,
        priority: weighted({ High: 50, Medium: 40, Low: 10 }),
        value: Math.round((quote.amount * 0.85) / 100) * 100,
        progress: randInt(10, 100),
        ops: pick(OPS_USERS),
      };
      deals.push(deal);

      for (let k = 0; k < randInt(1, 2); k++) {
        const orderStatus = weighted({ pending: 25, progress: 35, completed: 28, hold: 12 });
        const stages = randInt(3, 6);
        orders.push({
          id: "O-" + (2100 + orders.length),
          deal: deal.id, service, owner: deal.owner, ops: deal.ops,
          date: Math.min(TODAY, dealDay + randInt(0, 3) * DAY),
          ts: dealDay + randInt(9, 19) * 36e5,
          status: orderStatus, stages,
          stagesDone: orderStatus === "completed" ? stages : orderStatus === "pending" ? 0 : randInt(1, stages - 1),
          overdue: orderStatus !== "completed" && random() < 0.15,
        });
      }

      let remaining = Math.round(deal.value * (0.4 + random() * 0.6));
      for (let k = randInt(1, 3); k > 0 && remaining > 0; k--) {
        const amount = k === 1 ? remaining : Math.round((remaining * (0.3 + random() * 0.4)) / 100) * 100;
        remaining -= amount;
        const payDay = Math.min(TODAY, dealDay + randInt(0, 12) * DAY);
        payments.push({
          id: "P-" + (1000 + payments.length),
          deal: deal.id, owner: deal.owner, ops: deal.ops, amount,
          date: payDay, ts: payDay + randInt(9, 19) * 36e5,
          mode: pick(["UPI", "Bank Transfer", "Card"]),
        });
      }
    }
  }
}

const leadsById = Object.fromEntries(leads.map((x) => [x.id, x]));
const dealsById = Object.fromEntries(deals.map((x) => [x.id, x]));
const paidForDeal = (dealId) => sum(payments.filter((p) => p.deal === dealId), (p) => p.amount);

// Filter state
const state = { range: [TODAY - 29 * DAY, TODAY], user: "all", dept: "all" };
const inRange = (item, range) => item.date >= range[0] && item.date < range[1] + DAY;

// Applies the "All Users" filter. A sales user filters everything they own,
// an operations user only filters orders / payments they handle.
function applyUser(list, kind) {
  const user = state.user;
  if (user === "all") return list;
  if (OPS_USERS.includes(user)) return kind === "orders" || kind === "payments" ? list.filter((x) => x.ops === user) : list;
  return list.filter((x) => x.owner === user);
}

// Returns the records that fall in a date range (and match the user filter)
function sliceData(range) {
  const pickRange = (list, kind) => applyUser(list, kind).filter((x) => inRange(x, range));
  return {
    leads: pickRange(leads, "leads"),
    quotes: pickRange(quotations, "quotes"),
    deals: pickRange(deals, "deals"),
    orders: pickRange(orders, "orders"),
    payments: pickRange(payments, "payments"),
  };
}

function calcStats(data) {
  const revenue = sum(data.deals, (d) => d.value);
  const converted = data.leads.filter((l) => l.status === "converted").length;
  const qualified = data.leads.filter((l) => l.status !== "unqualified").length;
  return {
    leads: data.leads.length,
    qualified,
    converted,
    unqualified: data.leads.length - qualified,
    rate: pct(converted, data.leads.length),
    quotes: data.quotes.length,
    deals: data.deals.length,
    invoices: data.orders.length,
    revenue,
    collected: sum(data.payments, (p) => p.amount),
    outstanding: revenue - sum(data.deals, (d) => paidForDeal(d.id)),
  };
}

// Chart + table helpers
Chart.defaults.font.family = "Inter, system-ui, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = "#94a3b8";

// Small plugin: writes the value above each bar when a chart asks for it
Chart.register({
  id: "valueLabels",
  afterDatasetsDraw(chart, args, opts) {
    if (!opts || !opts.format) return;
    const ctx = chart.ctx;
    ctx.save();
    ctx.font = "600 9px Inter, sans-serif";
    ctx.fillStyle = "#334155";
    ctx.textAlign = "center";
    chart.data.datasets.forEach((set, i) => {
      chart.getDatasetMeta(i).data.forEach((bar, j) => {
        if (set.data[j]) ctx.fillText(opts.format(set.data[j], i), bar.x, bar.y - 4);
      });
    });
    ctx.restore();
  },
});
// Writes the % share inside each donut slice (like the reference Lead Sources chart)
Chart.register({
  id: "arcLabels",
  afterDatasetsDraw(chart, args, opts) {
    if (!opts || !opts.on) return;
    const ctx = chart.ctx, set = chart.data.datasets[0];
    const total = set.data.reduce((x, y) => x + y, 0);
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.font = "700 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    chart.getDatasetMeta(0).data.forEach((arc, i) => {
      const share = total ? (set.data[i] / total) * 100 : 0;
      if (share < 6) return;
      const point = arc.getCenterPoint();
      ctx.fillText(Math.round(share) + "%", point.x, point.y);
    });
    ctx.restore();
  },
});
const charts = {};
function drawChart(id, type, data, options = {}) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(byId(id), {
    type, data,
    options: { responsive: true, maintainAspectRatio: false, ...options },
  });
}
const quietLegend = { legend: { display: false } };
const lightGrid = { grid: { color: "#f1f5f9" }, border: { display: false } };

// rows = [{ cells: [...], open: "deal:D-1" }]
function buildTable(headers, rows) {
  if (!rows.length) return '<p class="muted center">No data for this filter</p>';
  const head = headers.map((h) => `<th>${h}</th>`).join("");
  const body = rows
    .map((r) => `<tr${r.open ? ` data-open="${r.open}"` : ""}>${r.cells.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("");
  return `<table><tr>${head}</tr>${body}</table>`;
}
const dayList = (range) => {
  const days = [];
  for (let t = range[0]; t <= range[1]; t += DAY) days.push(t);
  return days;
};
const shortDay = (t) => new Date(t).getUTCDate() + " " + new Date(t).toLocaleString("en-US", { month: "short", timeZone: "UTC" });

// Rendering
function render() {
  const range = state.range;
  const days = (range[1] - range[0]) / DAY + 1;
  const prevRange = [range[0] - days * DAY, range[0] - DAY];
  const cur = sliceData(range);
  const a = calcStats(cur);
  const b = calcStats(sliceData(prevRange));

  const nice = (t) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  byId("rangeText").textContent = `${nice(range[0])} - ${nice(range[1])}, ${new Date(range[1]).getUTCFullYear()}`;
  byId("rangeNote").textContent =
    `${isoDate(range[0])} to ${isoDate(range[1])}  ·  compared with ${isoDate(prevRange[0])} to ${isoDate(prevRange[1])}`;

  renderKpis(a, b, days);
  renderTarget(a);
  renderLeadFunnel(a);
  renderLeadTrend(cur, range);
  renderSources(cur);
  renderQuotations(cur, a);
  renderDeals(cur, a, range);
  renderTeams(cur);
  renderStages(cur);
  renderActivity(cur);
  renderExtras(cur, range);

  byId("salesCard").hidden = state.dept === "ops";
  byId("opsCard").hidden = state.dept === "sales";
}

function renderKpis(a, b, days) {
  const delta = (now, before) => {
    const change = before ? ((now - before) / before) * 100 : now ? 100 : 0;
    const up = change >= 0;
    return `<div class="delta"><b class="${up ? "up" : "down"}">${up ? "↗" : "↘"} ${Math.abs(change).toFixed(1)}%</b> vs. previous ${days} day${days > 1 ? "s" : ""}</div>`;
  };
  const cards = [
    ["New Leads", a.leads, "leads", "👥", "#e0e7ff"],
    ["Qualified Leads", a.qualified, "qualified", "✔", "#d1fae5", pct(a.qualified, a.leads), "Qualified %"],
    ["Converted Leads", a.converted, "converted", "◎", "#ede9fe", pct(a.converted, a.leads), "Conversion %"],
    ["Unqualified Leads", a.unqualified, "unqualified", "✖", "#fee2e2", pct(a.unqualified, a.leads), "Unqualified %"],
    ["Conversion Rate", a.rate.toFixed(1) + "%", "rate", "▽", "#cffafe"],
    ["Quotations Created", a.quotes, "quotes", "🗎", "#d1fae5"],
    ["Deals Created", a.deals, "deals", "▣", "#ede9fe"],
    ["Invoices Generated", a.invoices, "invoices", "₹", "#d1fae5"],
  ];
  byId("kpis").innerHTML = cards
    .map(([label, value, key, icon, bg, sub, subLabel]) => `
      <div class="card kpi">
        <div class="kpi-head"><span class="kpi-icon" style="background:${bg}">${icon}</span>${label}</div>
        <div class="kpi-body">
          <div class="kpi-value">${value}</div>
          ${sub !== undefined ? `<div class="kpi-sub">${sub.toFixed(1)}%<small>${subLabel}</small></div>` : ""}
        </div>
        ${delta(a[key], b[key])}
      </div>`)
    .join("");
}

function renderTarget(a) {
  const achievedPct = Math.min(100, pct(a.revenue, MONTHLY_TARGET));
  byId("targetValue").textContent = rupee(MONTHLY_TARGET);
  byId("achieved").textContent = rupee(a.revenue);
  byId("achievedPct").textContent = achievedPct.toFixed(1) + "%";
  byId("remaining").textContent = rupee(Math.max(0, MONTHLY_TARGET - a.revenue));
  byId("remainingPct").textContent = (100 - achievedPct).toFixed(1) + "%";
  byId("targetBar").style.width = achievedPct + "%";
  byId("targetFunnel").innerHTML = `
    <svg viewBox="0 0 170 100" width="100%" style="max-width:170px">
      <polygon points="8,4 88,4 80,46 16,46" fill="#a5b4fc"/>
      <polygon points="20,52 76,52 62,94 34,94" fill="#2563eb"/>
      <text x="92" y="22" font-size="7" fill="#64748b">Remaining</text>
      <text x="92" y="31" font-size="7" fill="#64748b">${(100 - achievedPct).toFixed(1)}%</text>
      <text x="84" y="70" font-size="7" fill="#64748b">Achieved</text>
      <text x="84" y="79" font-size="7" fill="#64748b">${achievedPct.toFixed(1)}%</text>
    </svg>`;
}

function renderLeadFunnel(a) {
  const text = (y, label, value, share) =>
    `<text x="100" y="${y}" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">${label}</text>
     <text x="100" y="${y + 10}" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">${value}</text>
     <text x="100" y="${y + 18}" text-anchor="middle" fill="#fff" font-size="7">${share}</text>`;
  byId("leadFunnel").innerHTML = `
    <svg viewBox="0 0 200 160" width="200" height="160">
      <polygon points="10,4 190,4 148,54 52,54" fill="#2563eb"/>
      <polygon points="54,58 146,58 126,102 74,102" fill="#10b981"/>
      <polygon points="72,106 128,106 112,156 88,156" fill="#f59e0b"/>
      ${text(14, "New Leads", a.leads, "(100%)")}
      ${text(66, "Qualified", a.qualified, "(" + pct(a.qualified, a.leads).toFixed(1) + "%)")}
      ${text(116, "Converted", a.converted, "(" + pct(a.converted, a.leads).toFixed(1) + "%)")}
    </svg>
    <div class="unq-box">Unqualified<b>${a.unqualified}</b>(${pct(a.unqualified, a.leads).toFixed(1)}%)</div>`;
}

function renderLeadTrend(cur, range) {
  const days = dayList(range);
  const count = (fn) => days.map((t) => cur.leads.filter((l) => l.date === t && fn(l)).length);
  const line = (label, color, data) => ({ label, data, borderColor: color, backgroundColor: color, tension: 0.35, pointRadius: 3, borderWidth: 2 });
  drawChart("leadTrend", "line", {
    labels: days.map(shortDay),
    datasets: [
      line("New Leads", COLORS[0], count(() => true)),
      line("Qualified", COLORS[2], count((l) => l.status !== "unqualified")),
      line("Converted", COLORS[3], count((l) => l.status === "converted")),
    ],
  }, {
    plugins: { legend: { align: "end", labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8 } } },
    scales: { y: { beginAtZero: true, ...lightGrid }, x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } } },
  });
}

function renderSources(cur) {
  const counts = SOURCES.map((s) => cur.leads.filter((l) => l.source === s).length);
  const total = sum(counts, (n) => n);
  const palette = [COLORS[0], COLORS[2], COLORS[3], COLORS[5]];
  drawChart("sourceChart", "doughnut",
    { labels: SOURCES, datasets: [{ data: counts, backgroundColor: palette, borderWidth: 0 }] },
    { cutout: "68%", plugins: { ...quietLegend, arcLabels: { on: true } } });
  byId("sourceCenter").innerHTML = `<b>${total}</b>TOTAL LEADS`;
  byId("sourceLegend").innerHTML = SOURCES.map((s, i) =>
    `<div><i class="dot" style="background:${palette[i]}"></i>${s}<span>${counts[i]} (${pct(counts[i], total).toFixed(1)}%)</span></div>`).join("");
}

function renderQuotations(cur, a) {
  const byService = (fn) => SERVICE_NAMES.map((s) => fn(cur.quotes.filter((q) => q.service === s)));
  const short = SERVICE_NAMES.map((s) => (s.length > 11 ? s.slice(0, 10) + "…" : s));

  drawChart("quoteByService", "bar",
    { labels: short, datasets: [{ data: byService((z) => z.length), backgroundColor: COLORS[0], borderRadius: 3 }] },
    { plugins: { ...quietLegend, valueLabels: { format: (v) => v } }, scales: { y: { beginAtZero: true, ...lightGrid }, x: { grid: { display: false } } } });

  // value funnel: services sorted by quoted amount
  const ranked = SERVICE_NAMES
    .map((s) => ({ name: s, value: sum(cur.quotes.filter((q) => q.service === s), (q) => q.amount) }))
    .sort((x, y) => y.value - x.value).slice(0, 6);
  const total = sum(ranked, (r) => r.value);
  const rowH = 26, full = rowH * ranked.length;
  const halfWidth = (y) => 90 * (1 - (y / full) * 0.92);
  const segments = ranked.map((r, i) => {
    const y1 = i * rowH, y2 = y1 + rowH - 2;
    return `<polygon fill="${COLORS[i]}" points="${100 - halfWidth(y1)},${y1} ${100 + halfWidth(y1)},${y1} ${100 + halfWidth(y2)},${y2} ${100 - halfWidth(y2)},${y2}"/>`;
  }).join("");
  byId("valueFunnel").innerHTML = `
    <svg viewBox="0 0 200 ${full}" width="130" height="${full}">${segments}</svg>
    <div class="legend-rows">${ranked.map((r, i) =>
      `<div><i class="dot" style="background:${COLORS[i]}"></i>${r.name}<span>${rupee(r.value)} (${pct(r.value, total).toFixed(0)}%)</span></div>`).join("")}</div>`;

  byId("serviceTable").innerHTML = buildTable(
    ["Service / Order", "Quotations", "Quoted Amount", "Accepted", "Pending", "Rejected", "Conv. Rate"],
    SERVICE_NAMES.map((s) => {
      const z = cur.quotes.filter((q) => q.service === s);
      const n = (status) => z.filter((q) => q.status === status).length;
      return { open: "service:" + s, cells: [s, z.length, rupee(sum(z, (q) => q.amount)), n("accepted"), n("pending"), n("rejected"), pct(n("accepted"), z.length).toFixed(1) + "%"] };
    }));

  const accepted = cur.quotes.filter((q) => q.status === "accepted").length;
  const rate = pct(accepted, cur.quotes.length);
  drawChart("gauge", "doughnut",
    { datasets: [{ data: [rate, 100 - rate], backgroundColor: [COLORS[0], "#eef2f7"], borderWidth: 0 }] },
    { cutout: "86%", plugins: { ...quietLegend, tooltip: { enabled: false } } });
  byId("gaugeCenter").textContent = rate.toFixed(1) + "%";
  byId("gaugeCaption").textContent = `${accepted} Deals / ${cur.quotes.length} Quotations`;
}

function renderDeals(cur, a, range) {
  drawChart("dealsByService", "bar", {
    labels: SERVICE_NAMES.map((s) => s.split(" ")[0]), // first word keeps every label visible
    datasets: [
      { label: "Deals Created", data: SERVICE_NAMES.map((s) => cur.deals.filter((d) => d.service === s).length), backgroundColor: COLORS[0], yAxisID: "y", borderRadius: 3 },
      { label: "Deal Revenue (₹)", data: SERVICE_NAMES.map((s) => sum(cur.deals.filter((d) => d.service === s), (d) => d.value)), backgroundColor: COLORS[3], yAxisID: "y1", borderRadius: 3 },
    ],
  }, {
    plugins: { legend: { align: "end", labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8 } }, valueLabels: { format: (v, i) => (i ? kilo(v) : "") } },
    scales: { y: { beginAtZero: true, ...lightGrid }, y1: { position: "right", beginAtZero: true, grid: { display: false } }, x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 0, font: { size: 9 } } } },
  });

  // revenue by service as horizontal progress bars
  const ranked = SERVICE_NAMES
    .map((s) => ({ name: s, value: sum(cur.deals.filter((d) => d.service === s), (d) => d.value) }))
    .filter((r) => r.value > 0).sort((x, y) => y.value - x.value).slice(0, 6);
  const top = ranked.length ? ranked[0].value : 1;
  byId("revenueBars").innerHTML = ranked.map((r) =>
    `<div class="bar-row"><div class="name" title="${r.name}">${r.name}</div><div class="track"><i style="width:${pct(r.value, top)}%"></i></div><div class="val">${kilo(r.value)} (${pct(r.value, a.revenue).toFixed(1)}%)</div></div>`).join("")
    || '<p class="muted center">No revenue for this filter</p>';

  const priorityColor = { High: "red", Medium: "orange", Low: "green" };
  byId("priorityTable").innerHTML = buildTable(["Priority", "Deals", "Revenue", "%"],
    ["High", "Medium", "Low"].map((p) => {
      const z = cur.deals.filter((d) => d.priority === p), v = sum(z, (d) => d.value);
      return { cells: [`<i class="dot ${priorityColor[p]}"></i>${p}`, z.length, rupee(v), pct(v, a.revenue).toFixed(1) + "%"] };
    }));

  const days = dayList(range);
  drawChart("revenueTrend", "bar", {
    labels: days.map(shortDay),
    datasets: [
      { label: "Revenue", data: days.map((t) => sum(cur.deals.filter((d) => d.date === t), (d) => d.value)), backgroundColor: COLORS[0] },
      { label: "Collected", data: days.map((t) => sum(cur.payments.filter((p) => p.date === t), (p) => p.amount)), backgroundColor: COLORS[2] },
    ],
  }, {
    plugins: { legend: { align: "end", labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8 } } },
    scales: { y: { beginAtZero: true, ...lightGrid }, x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } } },
  });

  byId("revenueTotals").innerHTML = `
    <div class="total-box blue"><span class="ico">$</span><div><small>Total Deal Value</small><b>${rupee(a.revenue)}</b></div></div>
    <div class="total-box green"><span class="ico">✔</span><div><small>Net Collected Revenue</small><b>${rupee(a.collected)}</b></div></div>
    <div class="total-box orange"><span class="ico">!</span><div><small>Outstanding Revenue</small><b>${rupee(a.outstanding)}</b></div></div>`;
}

function renderTeams(cur) {
  const users = state.user === "all" || !SALES_USERS.includes(state.user) ? SALES_USERS : [state.user];
  byId("salesTable").innerHTML = buildTable(
    ["User", "Leads Handled", "Qualified", "Converted", "Conversion %", "Quotations", "Deals", "Deal Value", "Revenue"],
    users.map((u) => {
      const mine = (list) => list.filter((x) => x.owner === u);
      const l = mine(cur.leads), d = mine(cur.deals);
      const converted = l.filter((x) => x.status === "converted").length;
      return { cells: [`<span class="avatar">${initials(u)}</span>${u}`, l.length, l.filter((x) => x.status !== "unqualified").length, converted, pct(converted, l.length).toFixed(1) + "%", mine(cur.quotes).length, d.length, rupee(sum(d, (x) => x.value)), rupee(sum(mine(cur.payments), (p) => p.amount))] };
    }));

  const opsUsers = OPS_USERS.includes(state.user) ? [state.user] : OPS_USERS;
  byId("opsTable").innerHTML = buildTable(
    ["User", "Orders Updated", "Stages Completed", "Pending Stages", "Overdue Orders"],
    opsUsers.map((u) => {
      const mine = cur.orders.filter((o) => o.ops === u);
      return { cells: [`<span class="avatar">${initials(u)}</span>${u}`, mine.length, sum(mine, (o) => o.stagesDone), sum(mine, (o) => o.stages - o.stagesDone), mine.filter((o) => o.overdue).length] };
    }));
}

function renderStages(cur) {
  const rows = SERVICE_NAMES.map((s) => ({ name: s, list: cur.orders.filter((o) => o.service === s) }))
    .filter((r) => r.list.length).sort((x, y) => y.list.length - x.list.length).slice(0, 6);
  const seg = (cls, n) => (n ? `<i class="${cls}" style="flex:${n}">${n}</i>` : "");
  byId("stageBars").innerHTML = rows.map((r) => {
    const n = (status) => r.list.filter((o) => o.status === status).length;
    return `<div class="stage-row"><div class="name" title="${r.name}">${r.name}</div><div class="stage-track">${seg("p", n("pending"))}${seg("g", n("progress"))}${seg("c", n("completed"))}${seg("h", n("hold"))}</div><b>${r.list.length}</b></div>`;
  }).join("") || '<p class="muted center">No orders for this filter</p>';
}

function renderActivity(cur) {
  const events = [
    ...cur.leads.map((x) => ({ ts: x.ts, user: x.owner, action: "Lead updated", rec: x.id })),
    ...cur.quotes.map((x) => ({ ts: x.ts, user: x.owner, action: "Quotation created", rec: x.id })),
    ...cur.deals.map((x) => ({ ts: x.ts, user: x.owner, action: "Deal created", rec: x.id })),
    ...cur.orders.map((x) => ({ ts: x.ts, user: x.owner, action: "Order created", rec: x.id })),
    ...cur.payments.map((x) => ({ ts: x.ts, user: x.owner, action: "Payment recorded", rec: x.id })),
  ].sort((x, y) => y.ts - x.ts).slice(0, 12);
  byId("activity").innerHTML = '<div class="act-row head"><span>Time</span><span>Employee</span><span>Action</span><span class="rec">Record</span></div>' + events.map((e) =>
    `<div class="act-row"><span class="time">${new Date(e.ts).toISOString().slice(0, 19) + "Z"}</span><span><span class="avatar">${initials(e.user)}</span>${e.user}</span><span>${e.action}</span><span class="rec">#${e.rec}</span></div>`).join("")
    || '<p class="muted center">No activity for this filter</p>';
}

function renderExtras(cur, range) {
  const statuses = ["pending", "progress", "completed", "hold"];
  drawChart("orderStatus", "doughnut", {
    labels: ["Pending", "In Progress", "Completed", "On Hold"],
    datasets: [{ data: statuses.map((s) => cur.orders.filter((o) => o.status === s).length), backgroundColor: [COLORS[3], COLORS[0], COLORS[2], COLORS[6]], borderWidth: 0 }],
  }, { cutout: "62%", plugins: { legend: { position: "right", labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8 } } } });
  const done = cur.orders.filter((o) => o.status === "completed").length;
  byId("orderSummary").textContent = `Completed orders: ${done} of ${cur.orders.length}`;

  const days = dayList(range);
  let running = 0;
  drawChart("collectionTrend", "line", {
    labels: days.map(shortDay),
    datasets: [{ label: "Collected", borderColor: COLORS[2], backgroundColor: "#10b98122", fill: true, tension: 0.3, pointRadius: 2,
      data: days.map((t) => (running += sum(cur.payments.filter((p) => p.date === t), (p) => p.amount))) }],
  }, { plugins: quietLegend, scales: { y: { beginAtZero: true, ...lightGrid }, x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } } } });

  // lead source trend (stacked bars per day) + quotation status split
  const palette = [COLORS[0], COLORS[2], COLORS[3], COLORS[5]];
  drawChart("sourceTrend", "bar", {
    labels: days.map(shortDay),
    datasets: SOURCES.map((s, i) => ({ label: s, backgroundColor: palette[i], data: days.map((t) => cur.leads.filter((l) => l.date === t && l.source === s).length) })),
  }, {
    plugins: { legend: { align: "end", labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8 } } },
    scales: { x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } }, y: { stacked: true, beginAtZero: true, ...lightGrid } },
  });
  const quoteStates = ["accepted", "pending", "rejected"];
  drawChart("quoteStatus", "doughnut", {
    labels: ["Accepted", "Pending", "Rejected"],
    datasets: [{ data: quoteStates.map((s) => cur.quotes.filter((q) => q.status === s).length), backgroundColor: [COLORS[2], COLORS[3], COLORS[6]], borderWidth: 0 }],
  }, { cutout: "62%", plugins: { legend: { position: "right", labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8 } } } });

  const recentPayments = cur.payments.slice().sort((x, y) => y.ts - x.ts).slice(0, 10);
  byId("paymentTable").innerHTML = buildTable(["Payment", "Deal", "Date", "Mode", "Amount"],
    recentPayments.map((p) => ({ open: "deal:" + p.deal, cells: [p.id, p.deal, isoDate(p.date), p.mode, rupee(p.amount)] })));

  byId("leadTable").innerHTML = buildTable(["Lead", "Client", "Date", "Source", "Status", "Quotes", "Deals", "Deal Value"],
    cur.leads.slice().sort((x, y) => y.ts - x.ts).slice(0, 25).map((l) => ({
      open: "lead:" + l.id,
      cells: [l.id, l.client, isoDate(l.date), l.source, `<span class="tag">${l.status}</span>`,
        quotations.filter((q) => q.lead === l.id).length, deals.filter((d) => d.lead === l.id).length,
        rupee(sum(deals.filter((d) => d.lead === l.id), (d) => d.value))],
    })));

  byId("dealTable").innerHTML = buildTable(["Deal", "Service", "Value", "Paid", "Progress"],
    cur.deals.slice().sort((x, y) => y.ts - x.ts).slice(0, 25).map((d) => ({
      open: "deal:" + d.id,
      cells: [d.id, d.service, rupee(d.value), rupee(paidForDeal(d.id)),
        `<span class="mini-bar"><i style="width:${d.progress}%"></i></span>${d.progress}%`],
    })));
}

// Drill-down popups
const modal = byId("modal");
const showModal = (html) => { byId("modalBody").innerHTML = html; modal.hidden = false; };

const quoteRows = (list) => buildTable(["Quote", "Lead", "Date", "Service", "Amount", "Status"],
  list.map((q) => ({ open: "lead:" + q.lead, cells: [q.id, q.lead, isoDate(q.date), q.service, rupee(q.amount), `<span class="tag">${q.status}</span>`] })));
const dealRows = (list) => buildTable(["Deal", "Service", "Date", "Priority", "Value", "Paid", "Progress"],
  list.map((d) => ({ open: "deal:" + d.id, cells: [d.id, d.service, isoDate(d.date), d.priority, rupee(d.value), rupee(paidForDeal(d.id)), d.progress + "%"] })));

function openLead(id) {
  const lead = leadsById[id];
  showModal(`<h3>${lead.id} — ${lead.client}</h3>
    <p class="muted">${lead.source} · ${lead.status} · owner ${lead.owner} · ${isoDate(lead.date)}</p>
    <h4>Quotations</h4>${quoteRows(quotations.filter((q) => q.lead === id))}
    <h4>Deals</h4>${dealRows(deals.filter((d) => d.lead === id))}`);
}
function openDeal(id) {
  const deal = dealsById[id], paid = paidForDeal(id);
  showModal(`<h3>${deal.id} — ${deal.service}</h3>
    <p class="muted">Lead ${deal.lead} · Quote ${deal.quote} · ${deal.priority} priority · Value ${rupee(deal.value)} · Paid ${rupee(paid)} · Outstanding ${rupee(deal.value - paid)}</p>
    <h4>Orders</h4>${buildTable(["Order", "Date", "Status", "Stages", "Handled by"],
      orders.filter((o) => o.deal === id).map((o) => ({ cells: [o.id, isoDate(o.date), `<span class="tag">${o.status}</span>`, `${o.stagesDone}/${o.stages}`, o.ops] })))}
    <h4>Payments</h4>${buildTable(["Payment", "Date", "Mode", "Amount"],
      payments.filter((p) => p.deal === id).map((p) => ({ cells: [p.id, isoDate(p.date), p.mode, rupee(p.amount)] })))}`);
}
function openService(name) {
  showModal(`<h3>${name} — quotations in selected period</h3>` +
    quoteRows(applyUser(quotations, "quotes").filter((q) => q.service === name && inRange(q, state.range))));
}

// one click handler for every clickable table row
document.addEventListener("click", (event) => {
  const row = event.target.closest("[data-open]");
  if (!row) return;
  const [type, id] = row.dataset.open.split(":");
  ({ lead: openLead, deal: openDeal, service: openService })[type](id);
});
byId("modalClose").onclick = () => (modal.hidden = true);
modal.onclick = (e) => { if (e.target === modal) modal.hidden = true; };

// Filters
SALES_USERS.concat(OPS_USERS).forEach((u) => byId("userFilter").add(new Option(u, u)));

function setRange(from, to) {
  state.range = [from, to];
  render();
}
byId("preset").onchange = (e) => {
  const custom = e.target.value === "custom";
  byId("customRange").hidden = !custom;
  if (!custom) setRange(TODAY - Number(e.target.value) * DAY, TODAY);
};
byId("applyRange").onclick = () => {
  let from = Date.parse(byId("fromDate").value), to = Date.parse(byId("toDate").value);
  if (isNaN(from) || isNaN(to)) return alert("Please pick both dates");
  if (from > to) [from, to] = [to, from];
  setRange(from, Math.min(to, TODAY));
};
byId("userFilter").onchange = (e) => { state.user = e.target.value; render(); };
byId("deptFilter").onchange = (e) => { state.dept = e.target.value; render(); };

// CSV export (whatever the filters currently show)
byId("exportBtn").onclick = () => {
  const cur = sliceData(state.range);
  const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
  const out = [];
  const section = (title, headers, rows) => {
    out.push(q(title), headers.map(q).join(","), ...rows.map((r) => r.map(q).join(",")), "");
  };
  const a = calcStats(cur);
  section("Summary " + isoDate(state.range[0]) + " to " + isoDate(state.range[1]), ["Metric", "Value"], Object.entries(a).map(([k, v]) => [k, +v.toFixed(2)]));
  section("Leads", ["ID", "Client", "Owner", "Date", "Source", "Status"], cur.leads.map((x) => [x.id, x.client, x.owner, isoDate(x.date), x.source, x.status]));
  section("Quotations", ["ID", "Lead", "Date", "Service", "Amount", "Status"], cur.quotes.map((x) => [x.id, x.lead, isoDate(x.date), x.service, x.amount, x.status]));
  section("Deals", ["ID", "Lead", "Date", "Service", "Priority", "Value", "Paid", "Progress %"], cur.deals.map((x) => [x.id, x.lead, isoDate(x.date), x.service, x.priority, x.value, paidForDeal(x.id), x.progress]));
  section("Orders", ["ID", "Deal", "Date", "Service", "Status", "Handled by"], cur.orders.map((x) => [x.id, x.deal, isoDate(x.date), x.service, x.status, x.ops]));
  section("Payments", ["ID", "Deal", "Date", "Mode", "Amount"], cur.payments.map((x) => [x.id, x.deal, isoDate(x.date), x.mode, x.amount]));

  const url = URL.createObjectURL(new Blob(["\ufeff" + out.join("\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `dashboard-${isoDate(state.range[0])}_to_${isoDate(state.range[1])}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// First load
byId("fromDate").value = isoDate(TODAY - 29 * DAY);
byId("toDate").value = isoDate(TODAY);
render();
