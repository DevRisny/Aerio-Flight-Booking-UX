/* Aerio clickable prototype: 9 screens, a tiny state machine, no frameworks. */
(function () {
  "use strict";

  // ------------------------------------------------------------------ data
  const AIRPORTS = {
    CMB: { city: "Colombo", name: "Bandaranaike Intl" }, SIN: { city: "Singapore", name: "Changi" },
    MAA: { city: "Chennai", name: "Chennai Intl" }, DXB: { city: "Dubai", name: "Dubai Intl" }, MLE: { city: "Malé", name: "Velana Intl" },
  };
  const FLIGHTS = [
    { id: "SR 468", airline: "Serendib Air", color: "#2F5BEA", dep: "08:40", arr: "15:05", dur: "3h 55m", stops: "Non-stop", price: 74500, status: ["ok", "On time"], seats: 23, best: true },
    { id: "MW 213", airline: "Monsoon Airways", color: "#0E9F8B", dep: "06:15", arr: "14:50", dur: "6h 05m", stops: "1 stop · MAA 1h 30m", price: 58900, status: ["ok", "On time"], seats: 41, cheapest: true },
    { id: "CJ 902", airline: "Coral Jet", color: "#FF6B4A", dep: "13:20", arr: "19:50", dur: "4h 00m", stops: "Non-stop", price: 81200, status: ["warn", "Delayed 25m"], seats: 6 },
    { id: "SR 470", airline: "Serendib Air", color: "#2F5BEA", dep: "23:55", arr: "06:20+1", dur: "3h 55m", stops: "Non-stop", price: 69800, status: ["info", "Few seats left"], seats: 3, fastest: true },
  ];
  const FARES = [
    { id: "basic", name: "Saver", add: 0, items: [["7 kg cabin bag", 1], ["20 kg checked bag", 0], ["Seat selection", 0], ["Changes", 0], ["Refund", 0]] },
    { id: "std", name: "Classic", add: 9800, popular: true, items: [["7 kg cabin bag", 1], ["25 kg checked bag", 1], ["Standard seat free", 1], ["Change fee LKR 6,000", 1], ["Refund", 0]] },
    { id: "flex", name: "Flex", add: 24500, items: [["10 kg cabin bag", 1], ["30 kg checked bag", 1], ["Any seat free", 1], ["Free changes", 1], ["Full refund", 1]] },
  ];
  const lkr = (n) => "LKR " + n.toLocaleString("en-LK");

  const state = {
    screen: "search", from: "CMB", to: "SIN", trip: "round", depart: 18, ret: 24, pax: 1, cls: "Economy",
    flight: FLIGHTS[0], fare: FARES[1], seat: "16C", sort: "best", payPressed: false, tripsTab: "upcoming",
  };
  const HISTORY = [];

  // ------------------------------------------------------------------ icons (inline SVG, 24px)
  const I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    trips: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
    pass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3a2 2 0 000-4z"/><path d="M14 5v14" stroke-dasharray="2 2"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#0F7A57" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
    cross: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M16 12.5h2"/></svg>',
  };
  const plane = "✈";

  // ------------------------------------------------------------------ helpers
  const status = () => `<div class="status"><span>9:41</span><span class="icons">
      <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
      <svg width="25" height="12" viewBox="0 0 25 12"><rect x=".5" y=".5" width="21" height="11" rx="3" fill="none" stroke="currentColor"/><rect x="2" y="2" width="16" height="8" rx="2"/><rect x="23" y="4" width="2" height="4" rx="1"/></svg></span></div><div class="island"></div>`;
  const top = (title, sub) => `<div class="topbar"><button class="icon-btn tap" data-go="back" aria-label="Back">${I.back}</button><div style="flex:1"><h2>${title}</h2>${sub ? `<div class="small muted">${sub}</div>` : ""}</div></div>`;
  const nav = (on) => `<nav class="nav">${[["search", I.search, "Search"], ["trips", I.trips, "My trips"], ["pass", I.pass, "Boarding"], ["profile", I.user, "Profile"]]
    .map(([k, ic, l]) => `<button class="${on === k ? "on" : ""}" data-go="${k === "profile" ? "search" : k}" aria-label="${l}">${ic}<span>${l}</span></button>`).join("")}</nav>`;
  const day = (d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][(d - 1) % 7]; // 1 Nov 2026 is a Sunday
  const dateLabel = (d) => `${day(d)}, ${d} Nov`;
  const priceFor = (d) => 52000 + ((d * 7919) % 31) * 1100;
  const route = () => `${state.from} → ${state.to}`;

  // ------------------------------------------------------------------ screens
  const SCREENS = {
    search() {
      const f = AIRPORTS[state.from], t = AIRPORTS[state.to];
      return `${status()}<div class="content">
        <div class="row between" style="padding:6px 0 14px"><div><div class="small muted" style="font-weight:600">Good morning, Risny 👋</div><div style="font-size:24px;font-weight:800;letter-spacing:-.02em">Where to next?</div></div>
          <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#2F5BEA,#7AA2FF);color:#fff;display:grid;place-items:center;font-weight:800">RS</div></div>
        <div class="row" style="gap:6px;margin-bottom:12px">${[["oneway", "One way"], ["round", "Round trip"], ["multi", "Multi-city"]].map(([k, l]) => `<button class="chip tap ${state.trip === k ? "on" : ""}" data-trip="${k}">${l}</button>`).join("")}</div>
        <div class="card" style="padding:0;position:relative">
          <div style="padding:16px 18px;border-bottom:1px solid var(--line)"><div class="label">From</div><div class="row" style="gap:8px;margin-top:4px"><span class="code" style="font-size:24px">${state.from}</span><span class="muted" style="font-weight:600">${f.city} · ${f.name}</span></div></div>
          <div style="padding:16px 18px"><div class="label">To</div><div class="row" style="gap:8px;margin-top:4px"><span class="code" style="font-size:24px">${state.to}</span><span class="muted" style="font-weight:600">${t.city} · ${t.name}</span></div></div>
          <button class="tap" data-act="swap" aria-label="Swap airports" style="position:absolute;right:18px;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:14px;background:var(--blue);color:#fff;display:grid;place-items:center;box-shadow:0 8px 18px rgba(47,91,234,.35)"><span style="width:22px;height:22px">${I.swap}</span></button>
        </div>
        <div class="row" style="gap:10px;margin-top:10px">
          <button class="card tap" data-go="calendar" style="flex:1;text-align:left;padding:14px"><div class="label">Depart</div><div style="font-weight:800;margin-top:4px">${dateLabel(state.depart)}</div></button>
          ${state.trip === "round" ? `<button class="card tap" data-go="calendar" style="flex:1;text-align:left;padding:14px"><div class="label">Return</div><div style="font-weight:800;margin-top:4px">${dateLabel(state.ret)}</div></button>` : ""}
        </div>
        <div class="card row between" style="margin-top:10px;padding:14px"><div><div class="label">Travellers & class</div><div style="font-weight:800;margin-top:4px">${state.pax} adult · ${state.cls}</div></div>
          <div class="row" style="gap:8px"><button class="icon-btn tap" data-act="pax-" aria-label="Fewer travellers" style="width:34px;height:34px;box-shadow:inset 0 0 0 1px var(--line)">−</button><b>${state.pax}</b><button class="icon-btn tap" data-act="pax+" aria-label="More travellers" style="width:34px;height:34px;box-shadow:inset 0 0 0 1px var(--line)">+</button></div></div>
        <button class="btn tap" data-go="results" style="margin-top:16px"><span style="width:20px;height:20px">${I.search}</span> Search flights</button>
        <div class="row between" style="margin:22px 0 10px"><b>Trending from Colombo</b><span class="small" style="color:var(--blue);font-weight:700">See all</span></div>
        <div class="row" style="gap:10px;overflow:hidden">${[["MLE", "Malé", "34,900", "#0EA5E9"], ["DXB", "Dubai", "89,500", "#F59E0B"], ["MAA", "Chennai", "28,400", "#10B981"]].map(([c, n, p, col]) => `
          <div class="card" style="min-width:150px;padding:0;overflow:hidden"><div style="height:74px;background:linear-gradient(135deg,${col},${col}99);position:relative"><span style="position:absolute;left:12px;bottom:8px;color:#fff;font-weight:800;font-size:22px">${c}</span></div>
          <div style="padding:10px 12px"><b>${n}</b><div class="small muted">from LKR ${p}</div></div></div>`).join("")}</div>
      </div>${nav("search")}`;
    },

    calendar() {
      const cells = [];
      for (let i = 0; i < 0; i++) cells.push("<div></div>");
      for (let d = 1; d <= 30; d++) {
        const p = priceFor(d), cheap = p < 58000, sel = d === state.depart || (state.trip === "round" && d === state.ret);
        const inRange = state.trip === "round" && d > state.depart && d < state.ret;
        cells.push(`<button class="tap" data-day="${d}" aria-label="${dateLabel(d)}, from ${lkr(p)}" style="height:52px;border-radius:12px;display:grid;place-items:center;align-content:center;gap:1px;
          background:${sel ? "var(--blue)" : inRange ? "var(--blue-50)" : "transparent"};color:${sel ? "#fff" : d < 13 ? "#CBD5E1" : "var(--ink)"}" ${d < 13 ? "disabled" : ""}>
          <b style="font-size:15px">${d}</b><span style="font-size:9.5px;font-weight:700;color:${sel ? "#DCE6FF" : cheap ? "var(--green)" : "var(--muted)"}">${d < 13 ? "" : Math.round(p / 1000) + "k"}</span></button>`);
      }
      return `${status()}<div class="content">${top("Select dates", route() + " · prices per adult")}
        <div class="row" style="gap:8px;margin-bottom:14px"><div class="card" style="flex:1;padding:12px;box-shadow:inset 0 0 0 2px var(--blue)"><div class="label">Depart</div><b>${dateLabel(state.depart)}</b></div>
          <div class="card" style="flex:1;padding:12px"><div class="label">Return</div><b>${dateLabel(state.ret)}</b></div></div>
        <div class="card"><div class="row between" style="margin-bottom:10px"><b>November 2026</b><span class="small muted">‹ ›</span></div>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center" class="small muted">${"SMTWTFS".split("").map((c) => `<b style="padding:4px 0">${c}</b>`).join("")}</div>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">${cells.join("")}</div>
          <div class="row small" style="gap:14px;margin-top:12px"><span class="row" style="gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:var(--green)"></i>Lowest fares</span><span class="row" style="gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:var(--blue)"></i>Selected</span></div></div>
        <div class="card row" style="margin-top:12px;gap:12px;background:var(--green-50);box-shadow:none"><span style="font-size:22px">💡</span><div class="small"><b style="color:var(--green)">Save LKR 9,200</b> by flying Tue 17 Nov instead.</div></div>
      </div><div class="sheet-cta"><button class="btn tap" data-go="results">Confirm dates</button></div>`;
    },

    results() {
      const sorted = [...FLIGHTS].sort((a, b) => state.sort === "cheap" ? a.price - b.price : state.sort === "fast" ? parseInt(a.dur) - parseInt(b.dur) : (b.best ? 1 : 0) - (a.best ? 1 : 0));
      const strip = [16, 17, 18, 19, 20].map((d) => `<button class="tap" data-day="${d}" style="flex:1;padding:8px 0;border-radius:12px;text-align:center;${d === state.depart ? "background:var(--blue);color:#fff" : "background:var(--card);box-shadow:var(--sh)"}">
        <div style="font-size:11px;font-weight:700;opacity:.8">${day(d)} ${d}</div><div style="font-size:12px;font-weight:800">${Math.round(priceFor(d) / 1000)}k</div></button>`).join("");
      return `${status()}<div class="content">${top(`${state.from} <span style="color:var(--blue)">${plane}</span> ${state.to}`, `${dateLabel(state.depart)} · ${state.pax} adult · ${state.cls}`)}
        <div class="row" style="gap:6px;margin-bottom:12px">${strip}</div>
        <div class="row" style="gap:6px;margin-bottom:12px">${[["best", "Best"], ["cheap", "Cheapest"], ["fast", "Fastest"]].map(([k, l]) => `<button class="chip tap ${state.sort === k ? "on" : ""}" data-sort="${k}">${l}</button>`).join("")}
          <button class="chip tap" style="margin-left:auto"><span style="width:16px;height:16px">${I.filter}</span>Filters</button></div>
        ${sorted.map((f) => `<button class="card tap" data-flight="${f.id}" style="width:100%;text-align:left;margin-bottom:12px;display:block">
          <div class="row between" style="margin-bottom:12px"><div class="row" style="gap:8px"><span style="width:28px;height:28px;border-radius:9px;background:${f.color};color:#fff;display:grid;place-items:center;font-size:12px;font-weight:800">${f.airline[0]}</span><div><b style="font-size:13.5px">${f.airline}</b><div class="small muted">${f.id}</div></div></div>
            <span class="tag ${f.status[0]}">${f.status[1]}</span></div>
          <div class="timeline"><div><div style="font-size:19px;font-weight:800">${f.dep}</div><div class="small muted">${state.from}</div></div>
            <div style="text-align:center"><div class="small muted" style="font-weight:700">${f.dur}</div><div class="line" style="margin:9px 4px 7px"><span class="plane">${plane}</span></div><div class="small" style="font-weight:700;color:${f.stops === "Non-stop" ? "var(--green)" : "var(--amber)"}">${f.stops.split(" · ")[0]}</div></div>
            <div style="text-align:right"><div style="font-size:19px;font-weight:800">${f.arr}</div><div class="small muted">${state.to}</div></div></div>
          <div class="row between" style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--line)">
            <div class="row" style="gap:6px">${f.best ? '<span class="tag info">Best value</span>' : ""}${f.cheapest ? '<span class="tag ok">Cheapest</span>' : ""}${f.fastest ? '<span class="tag info">Overnight</span>' : ""}</div>
            <div style="text-align:right"><div style="font-size:18px;font-weight:800;color:var(--blue)">${lkr(f.price)}</div><div class="small muted">per adult · round trip</div></div></div></button>`).join("")}
      </div>`;
    },

    fares() {
      const f = state.flight;
      return `${status()}<div class="content">${top("Choose your fare", `${f.airline} ${f.id} · ${route()}`)}
        <div class="card" style="margin-bottom:14px"><div class="timeline"><div><div class="code" style="font-size:24px">${f.dep}</div><div class="small muted">${state.from} · ${dateLabel(state.depart)}</div></div>
          <div style="text-align:center"><div class="small muted" style="font-weight:700">${f.dur}</div><div class="line" style="margin:9px 4px 7px"><span class="plane">${plane}</span></div><div class="small muted">${f.stops}</div></div>
          <div style="text-align:right"><div class="code" style="font-size:24px">${f.arr}</div><div class="small muted">${state.to}</div></div></div>
          <div class="row small" style="gap:8px;margin-top:12px;flex-wrap:wrap"><span class="tag ${f.status[0]}">${f.status[1]}</span><span class="chip" style="padding:4px 9px;font-size:11px">Airbus A321neo</span><span class="chip" style="padding:4px 9px;font-size:11px">Meal included</span></div></div>
        ${FARES.map((x) => `<button class="card tap" data-fare="${x.id}" style="width:100%;text-align:left;margin-bottom:10px;display:block;${state.fare.id === x.id ? "box-shadow:0 0 0 2px var(--blue),var(--sh)" : ""}">
          <div class="row between"><div class="row" style="gap:8px"><span style="width:20px;height:20px;border-radius:50%;border:2px solid ${state.fare.id === x.id ? "var(--blue)" : "#CBD5E1"};display:grid;place-items:center">${state.fare.id === x.id ? '<i style="width:10px;height:10px;border-radius:50%;background:var(--blue)"></i>' : ""}</span><b style="font-size:16px">${x.name}</b>${x.popular ? '<span class="tag info" style="font-size:10px">Most popular</span>' : ""}</div>
            <b style="color:var(--blue)">${lkr(f.price + x.add)}</b></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;margin-top:10px">${x.items.map(([t, ok]) => `<div class="row small" style="gap:6px;color:${ok ? "var(--body)" : "#94A3B8"}">${ok ? I.check : I.cross}${t}</div>`).join("")}</div></button>`).join("")}
      </div><div class="sheet-cta row between" style="gap:14px"><div><div class="small muted">Total for ${state.pax} adult</div><b style="font-size:20px">${lkr((f.price + state.fare.add) * state.pax)}</b></div><button class="btn tap" data-go="seats" style="width:auto;padding:0 26px">Choose seat</button></div>`;
    },

    seats() {
      const taken = new Set(["11A", "11B", "12E", "12F", "13A", "13D", "15B", "15C", "16E", "17A", "17F", "18C", "18D", "19B", "20E", "20F", "21A"]);
      const rows = [];
      for (let r = 10; r <= 21; r++) {
        const exit = r === 14;
        const seat = (c) => {
          const id = r + c, t = taken.has(id), sel = state.seat === id, xl = exit || r === 10;
          const bg = sel ? "var(--blue)" : t ? "#E2E8F0" : xl ? "var(--coral-50)" : "var(--blue-50)";
          const fg = sel ? "#fff" : t ? "#94A3B8" : xl ? "#B23C1F" : "var(--blue-600)";
          return `<button class="tap" ${t ? "disabled" : `data-seat="${id}"`} aria-label="Seat ${id}${t ? " taken" : xl ? " extra legroom" : ""}" style="width:38px;height:38px;border-radius:10px 10px 6px 6px;background:${bg};color:${fg};font-size:11px;font-weight:800;${xl && !sel && !t ? "box-shadow:inset 0 0 0 1.5px #FFB49F" : ""}">${t ? "×" : c}</button>`;
        };
        rows.push(`${exit ? '<div class="row between small" style="color:var(--coral);font-weight:800;padding:2px 2px 6px"><span>◀ EXIT</span><span>EXIT ▶</span></div>' : ""}
          <div class="row" style="justify-content:center;gap:6px;margin-bottom:7px">${["A", "B", "C"].map(seat).join("")}<span style="width:26px;text-align:center;font-size:11px;font-weight:700;color:var(--muted)">${r}</span>${["D", "E", "F"].map(seat).join("")}</div>`);
      }
      const extra = state.seat && (state.seat.startsWith("14") || state.seat.startsWith("10")) ? 6500 : 0;
      return `${status()}<div class="content">${top("Pick your seat", `${state.flight.id} · ${route()} · Airbus A321neo`)}
        <div class="row small" style="gap:12px;margin-bottom:12px;flex-wrap:wrap">${[["var(--blue-50)", "Free"], ["var(--coral-50)", "Extra legroom +6,500"], ["#E2E8F0", "Taken"], ["var(--blue)", "Your seat"]].map(([c, l]) => `<span class="row" style="gap:5px"><i style="width:14px;height:14px;border-radius:4px;background:${c};box-shadow:inset 0 0 0 1px #0001"></i>${l}</span>`).join("")}</div>
        <div style="background:var(--card);border-radius:120px 120px 24px 24px;box-shadow:var(--sh);padding:56px 16px 18px;position:relative">
          <div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:800;color:var(--muted);letter-spacing:.1em">FRONT</div>
          <div class="row" style="justify-content:center;gap:6px;margin-bottom:8px" aria-hidden="true">${["A", "B", "C"].map((c) => `<b style="width:38px;text-align:center;font-size:11px;color:var(--muted)">${c}</b>`).join("")}<span style="width:26px"></span>${["D", "E", "F"].map((c) => `<b style="width:38px;text-align:center;font-size:11px;color:var(--muted)">${c}</b>`).join("")}</div>
          ${rows.join("")}</div>
      </div><div class="sheet-cta row between" style="gap:14px"><div><div class="small muted">Seat ${state.seat || "–"} · ${extra ? "Extra legroom" : "Window/aisle free with Classic"}</div><b style="font-size:20px">${extra ? "+ " + lkr(extra) : "Included"}</b></div><button class="btn tap" data-go="review" style="width:auto;padding:0 26px">Continue</button></div>`;
    },

    review() {
      const f = state.flight, base = (f.price + state.fare.add) * state.pax;
      const extra = state.seat.startsWith("14") || state.seat.startsWith("10") ? 6500 : 0;
      const taxes = Math.round(base * 0.18), fee = 1500, total = base + taxes + extra + fee;
      const line = (l, v, strong) => `<div class="row between" style="padding:7px 0;${strong ? "font-weight:800;font-size:17px;border-top:1px solid var(--line);margin-top:6px;padding-top:12px" : "font-size:14px"}"><span class="${strong ? "" : "muted"}">${l}</span><span>${v}</span></div>`;
      return `${status()}<div class="content">${top("Review & pay", "Step 4 of 4")}
        <div class="card" style="margin-bottom:12px"><div class="label">Passenger</div>
          <div class="row" style="gap:12px;margin-top:10px"><div style="width:40px;height:40px;border-radius:12px;background:var(--blue-50);color:var(--blue);display:grid;place-items:center;font-weight:800">RS</div><div><b>Junaideen Risny Suha</b><div class="small muted">Adult · Passport ending ••42 · Seat ${state.seat}</div></div></div></div>
        <div class="card" style="margin-bottom:12px"><div class="row between"><div><div class="label">Flight</div><b style="display:block;margin-top:6px">${f.airline} ${f.id}</b><div class="small muted">${dateLabel(state.depart)} · ${f.dep} → ${f.arr}</div></div><span class="tag ${f.status[0]}">${f.status[1]}</span></div>
          <div class="small" style="margin-top:8px"><span class="chip" style="padding:4px 9px;font-size:11px">${state.fare.name} fare</span></div></div>
        <div class="card"><div class="label" style="margin-bottom:6px">Price breakdown</div>
          ${line(`Base fare · ${state.pax} adult`, lkr(f.price * state.pax))}${line(`${state.fare.name} fare upgrade`, state.fare.add ? lkr(state.fare.add * state.pax) : "Free")}
          ${line("Taxes & airport charges", lkr(taxes))}${line(`Seat ${state.seat}`, extra ? lkr(extra) : "Free")}${line("Service fee", lkr(fee))}${line("Total", lkr(total), true)}</div>
        <div class="card row" style="margin-top:12px;gap:12px;padding:14px"><span style="width:24px;height:24px;color:var(--blue)">${I.wallet}</span><div style="flex:1"><b>Visa •••• 4417</b><div class="small muted">Expires 08/29</div></div><span class="small" style="color:var(--blue);font-weight:800">Change</span></div>
        <p class="small muted" style="text-align:center;margin:12px 4px 0">🔒 Payments are encrypted. Free cancellation within 24 hours.</p>
      </div><div class="sheet-cta"><button class="btn tap" data-go="success">${state.payPressed ? "Processing…" : "Pay " + lkr(total)}</button></div>`;
    },

    success() {
      return `${status()}<div class="content" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 30px">
        <div style="width:96px;height:96px;border-radius:50%;background:var(--green-50);display:grid;place-items:center;margin-bottom:18px"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#0F7A57" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></div>
        <div style="font-size:26px;font-weight:800;letter-spacing:-.02em">You're going to ${AIRPORTS[state.to].city}!</div>
        <p class="muted" style="line-height:1.5">Booking <b style="color:var(--ink)">AER-7Q4K2M</b> is confirmed. We emailed your e-ticket and added the trip to <b style="color:var(--ink)">My trips</b>.</p>
        <div class="card" style="width:100%;margin:10px 0 18px;text-align:left"><div class="row between"><div><div class="code" style="font-size:22px">${state.from} → ${state.to}</div><div class="small muted">${dateLabel(state.depart)} · ${state.flight.dep} · Seat ${state.seat}</div></div><span class="tag ok">Confirmed</span></div></div>
        <button class="btn tap" data-go="pass">View boarding pass</button>
        <button class="btn secondary tap" data-go="trips" style="margin-top:10px">Go to My trips</button></div>`;
    },

    pass() {
      const qr = []; // deterministic QR-like pattern (illustrative only)
      let s = 7;
      for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
        const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        const on = !finder && (s >> 7) % 2 === 0;
        if (on) qr.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
      }
      const f = state.flight;
      return `${status()}<div class="content">${top("Boarding pass", "Add to wallet · works offline")}
        <div style="background:linear-gradient(160deg,#2F5BEA,#4C79FF);border-radius:24px 24px 0 0;padding:20px;color:#fff">
          <div class="row between"><b style="font-size:15px">${f.airline}</b><span style="background:rgba(255,255,255,.18);padding:4px 10px;border-radius:8px;font-size:12px;font-weight:800">● On time</span></div>
          <div class="row between" style="margin-top:16px"><div><div style="font-size:40px;font-weight:800;letter-spacing:-.02em">${state.from}</div><div style="opacity:.85;font-size:12.5px">${AIRPORTS[state.from].city}</div></div>
            <div style="text-align:center;opacity:.95"><div style="font-size:22px">${plane}</div><div style="font-size:11.5px">${f.dur}</div></div>
            <div style="text-align:right"><div style="font-size:40px;font-weight:800;letter-spacing:-.02em">${state.to}</div><div style="opacity:.85;font-size:12.5px">${AIRPORTS[state.to].city}</div></div></div></div>
        <div style="background:var(--card);padding:18px 20px;box-shadow:var(--sh)">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${[["Passenger", "R. Suha"], ["Flight", f.id], ["Date", `${state.depart} Nov`], ["Gate", "B7"], ["Seat", state.seat], ["Group", "2"], ["Boarding", "08:00"], ["Departs", f.dep], ["Class", state.cls]]
            .map(([l, v]) => `<div><div class="label">${l}</div><div style="font-weight:800;font-size:16px;margin-top:3px">${v}</div></div>`).join("")}</div></div>
        <div style="height:24px;background:var(--card);position:relative"><div style="position:absolute;left:18px;right:18px;top:11px;border-top:2px dashed var(--line)"></div>
          <i style="position:absolute;left:-12px;top:0;width:24px;height:24px;border-radius:50%;background:var(--bg)"></i><i style="position:absolute;right:-12px;top:0;width:24px;height:24px;border-radius:50%;background:var(--bg)"></i></div>
        <div style="background:var(--card);border-radius:0 0 24px 24px;padding:6px 20px 20px;box-shadow:var(--sh);display:grid;justify-items:center">
          <svg viewBox="-1 -1 23 23" width="150" height="150" fill="#0F172A" role="img" aria-label="Boarding pass QR code">${qr.join("")}${[[0, 0], [14, 0], [0, 14]].map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`).join("")}</svg>
          <div class="small muted" style="margin-top:6px">Booking AER-7Q4K2M · Show at security & gate</div></div>
        <div class="card row" style="margin-top:12px;gap:12px;background:var(--amber-50);box-shadow:none"><span style="font-size:20px">⏰</span><div class="small"><b style="color:var(--amber)">Boarding starts 08:00</b> · Gate closes 08:20. Allow 25 min to reach gate B7.</div></div>
      </div>${nav("pass")}`;
    },

    trips() {
      const up = state.tripsTab === "upcoming";
      const stage = (l, done, now) => `<div class="row" style="gap:10px;align-items:flex-start"><span style="width:14px;height:14px;border-radius:50%;margin-top:2px;flex:none;background:${done ? "var(--green)" : now ? "var(--blue)" : "#E2E8F0"};${now ? "box-shadow:0 0 0 4px var(--blue-50)" : ""}"></span><span class="small" style="font-weight:${now ? 800 : 600};color:${done || now ? "var(--ink)" : "var(--muted)"}">${l}</span></div>`;
      return `${status()}<div class="content"><div class="topbar"><h2 style="font-size:24px">My trips</h2></div>
        <div class="row" style="gap:6px;background:var(--card);padding:4px;border-radius:14px;box-shadow:var(--sh);margin-bottom:14px">${[["upcoming", "Upcoming"], ["past", "Past"]].map(([k, l]) => `<button class="tap" data-tab="${k}" style="flex:1;padding:9px;border-radius:11px;font-weight:800;font-size:13.5px;${state.tripsTab === k ? "background:var(--blue);color:#fff" : "color:var(--muted)"}">${l}</button>`).join("")}</div>
        ${up ? `<div class="card" style="margin-bottom:12px">
          <div class="row between"><div><div class="small muted" style="font-weight:700">${dateLabel(state.depart)} – ${dateLabel(state.ret)}</div><div class="code" style="font-size:22px;margin-top:2px">${state.from} ⇄ ${state.to}</div></div><span class="tag ok">Confirmed</span></div>
          <div class="small muted" style="margin:6px 0 12px">${state.flight.airline} ${state.flight.id} · Seat ${state.seat} · ${state.fare.name} · AER-7Q4K2M</div>
          <div style="display:grid;gap:9px;padding:12px;border-radius:12px;background:var(--bg)">${stage("Booked & paid", true)}${stage("Online check-in opens 16 Nov, 08:40", false, true)}${stage("Boarding pass ready", false)}${stage("Fly to Singapore", false)}</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px">${[["💺", "Change seat", "seats"], ["🧳", "Add bags", "trips"], ["✏️", "Change date", "calendar"]].map(([e, l, g]) => `<button class="tap" data-go="${g}" style="padding:10px 4px;border-radius:12px;background:var(--blue-50);font-size:12px;font-weight:800;color:var(--blue-600)"><div style="font-size:18px">${e}</div>${l}</button>`).join("")}</div>
          <button class="tap small" style="width:100%;margin-top:10px;padding:10px;color:var(--red);font-weight:800">Cancel booking · free until 14 Nov</button></div>
        <div class="card row between"><div><div class="small muted" style="font-weight:700">Sat, 19 Dec</div><b>CMB → MLE</b><div class="small muted">Coral Jet CJ 115 · Saver</div></div><span class="tag warn">Pay by 20 Nov</span></div>`
        : `<div class="card row between" style="margin-bottom:10px"><div><div class="small muted" style="font-weight:700">2 Aug 2026</div><b>CMB → MAA</b><div class="small muted">Monsoon MW 207 · Seat 9A</div></div><span class="tag info">Completed</span></div>
        <div class="card row between"><div><div class="small muted" style="font-weight:700">14 Apr 2026</div><b>CMB → DXB</b><div class="small muted">Serendib SR 226 · Seat 21C</div></div><span class="tag info">Completed</span></div>`}
      </div>${nav("trips")}`;
    },
  };

  // ------------------------------------------------------------------ engine
  const root = document.getElementById("screen");
  function render() {
    root.innerHTML = SCREENS[state.screen]();
    document.querySelectorAll("[data-screen-link]").forEach((a) => a.classList.toggle("on", a.dataset.screenLink === state.screen));
    const t = document.getElementById("screenName");
    if (t) t.textContent = TITLES[state.screen];
  }
  const TITLES = { search: "1 · Search", calendar: "2 · Date & fare calendar", results: "3 · Flight results", fares: "4 · Fare comparison", seats: "5 · Seat map", review: "6 · Review & price breakdown", success: "7 · Booking confirmed", pass: "8 · Digital boarding pass", trips: "9 · Manage bookings" };

  function go(to) {
    if (to === "back") { state.screen = HISTORY.pop() || "search"; }
    else if (to !== state.screen) { HISTORY.push(state.screen); state.screen = to; }
    render();
    root.querySelector(".content")?.scrollTo(0, 0);
  }

  root.addEventListener("click", (e) => {
    const el = e.target.closest("button,[data-go]");
    if (!el || el.disabled) return;
    const d = el.dataset;
    if (d.trip) { state.trip = d.trip; render(); }
    else if (d.sort) { state.sort = d.sort; render(); }
    else if (d.tab) { state.tripsTab = d.tab; render(); }
    else if (d.fare) { state.fare = FARES.find((f) => f.id === d.fare); render(); }
    else if (d.seat) { state.seat = d.seat; render(); }
    else if (d.flight) { state.flight = FLIGHTS.find((f) => f.id === d.flight); go("fares"); }
    else if (d.day) {
      const n = +d.day;
      if (state.screen === "calendar" && state.trip === "round" && n > state.depart && state.ret <= state.depart) state.ret = n;
      else if (state.screen === "calendar" && state.trip === "round" && n > state.depart && n !== state.ret) state.ret = n;
      else { state.depart = n; if (state.ret <= n) state.ret = n + 6; }
      render();
    } else if (d.act === "swap") { [state.from, state.to] = [state.to, state.from]; render(); }
    else if (d.act === "pax+") { state.pax = Math.min(9, state.pax + 1); render(); }
    else if (d.act === "pax-") { state.pax = Math.max(1, state.pax - 1); render(); }
    else if (d.go === "success") { state.payPressed = true; render(); setTimeout(() => { state.payPressed = false; go("success"); }, 700); }
    else if (d.go) go(d.go);
  });

  // keyboard: ← back, → follow the primary button
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "Escape") go("back");
  });

  window.Aerio = { go, render, state, SCREENS, TITLES };
  const start = new URLSearchParams(location.search).get("screen");
  if (start && SCREENS[start]) state.screen = start;
  render();
})();
