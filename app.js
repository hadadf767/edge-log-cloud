import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const storageKey = "edge-log-supabase";
const els = {
  sessionState: document.getElementById("session-state"),
  sessionUser: document.getElementById("session-user"),
  statPnl: document.getElementById("stat-pnl"),
  statTrades: document.getElementById("stat-trades"),
  statWinrate: document.getElementById("stat-winrate"),
  statRr: document.getElementById("stat-rr"),
  tradeForm: document.getElementById("trade-form"),
  formTitle: document.getElementById("form-title"),
  tradeId: document.getElementById("trade-id"),
  symbol: document.getElementById("symbol"),
  tradeDate: document.getElementById("trade-date"),
  direction: document.getElementById("direction"),
  setup: document.getElementById("setup"),
  entry: document.getElementById("entry"),
  exit: document.getElementById("exit"),
  quantity: document.getElementById("quantity"),
  pnl: document.getElementById("pnl"),
  stopLoss: document.getElementById("stop-loss"),
  target: document.getElementById("target"),
  rr: document.getElementById("rr"),
  emotion: document.getElementById("emotion"),
  notes: document.getElementById("notes"),
  resetFormBtn: document.getElementById("reset-form-btn"),
  tradeRows: document.getElementById("trade-rows"),
  tradesTable: document.getElementById("trades-table"),
  emptyState: document.getElementById("empty-state"),
  search: document.getElementById("search"),
  exportBtn: document.getElementById("export-btn"),
  refreshBtn: document.getElementById("refresh-btn"),
  signoutBtn: document.getElementById("signout-btn"),
  setupModal: document.getElementById("setup-modal"),
  authModal: document.getElementById("auth-modal"),
  openSetupBtn: document.getElementById("open-setup-btn"),
  saveSetupBtn: document.getElementById("save-setup-btn"),
  supabaseUrl: document.getElementById("supabase-url"),
  supabaseAnon: document.getElementById("supabase-anon"),
  openAuthBtn: document.getElementById("open-auth-btn"),
  authEmail: document.getElementById("auth-email"),
  sendLinkBtn: document.getElementById("send-link-btn"),
  toast: document.getElementById("toast"),
};

let supabase = null;
let session = null;
let trades = [];

function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

function saveConfig(config) {
  localStorage.setItem(storageKey, JSON.stringify(config));
}

function showToast(message, ms = 2600) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), ms);
}

function formatCurrency(value) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatPnlCell(value) {
  const cls = value >= 0 ? "pnl-pos" : "pnl-neg";
  return `<span class="${cls}">${formatCurrency(value)}</span>`;
}

function getStats(items) {
  const total = items.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
  const wins = items.filter((trade) => Number(trade.pnl) > 0);
  const rrTrades = items.filter((trade) => trade.rr !== null && trade.rr !== undefined && trade.rr !== "");
  return {
    total,
    count: items.length,
    winRate: items.length ? (wins.length / items.length) * 100 : 0,
    avgRr: rrTrades.length ? rrTrades.reduce((sum, trade) => sum + Number(trade.rr || 0), 0) / rrTrades.length : null,
  };
}

function updateStats() {
  const stats = getStats(trades);
  els.statPnl.textContent = formatCurrency(stats.total);
  els.statPnl.className = `metric ${stats.total >= 0 ? "pnl-pos" : "pnl-neg"}`;
  els.statTrades.textContent = String(stats.count);
  els.statWinrate.textContent = `${stats.winRate.toFixed(1)}%`;
  els.statRr.textContent = stats.avgRr ? `1:${stats.avgRr.toFixed(2)}` : "-";
}

function toggleTradeViews(rows = trades) {
  const hasRows = rows.length > 0;
  els.emptyState.hidden = hasRows;
  els.tradesTable.hidden = !hasRows;
  if (!hasRows) {
    els.emptyState.innerHTML = trades.length
      ? `<h3>No matching trades</h3><p class="muted">Try a different search term.</p>`
      : `<h3>No trades yet</h3><p class="muted">Sign in, then log your first trade. Your data will sync to any device where you sign in with the same email.</p>`;
  }
}

function filteredTrades() {
  const term = els.search.value.trim().toLowerCase();
  if (!term) return trades;
  return trades.filter((trade) =>
    [trade.symbol, trade.setup, trade.notes, trade.emotion, trade.trade_date]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  );
}

function renderTrades() {
  const rows = filteredTrades();
  toggleTradeViews(rows);
  if (!rows.length) {
    els.tradeRows.innerHTML = "";
    return;
  }
  els.tradeRows.innerHTML = rows
    .map((trade) => `
      <tr>
        <td>${trade.trade_date || "-"}</td>
        <td><strong>${trade.symbol || "-"}</strong></td>
        <td><span class="badge ${trade.direction === "Long" ? "long" : "short"}">${trade.direction || "-"}</span></td>
        <td>${trade.setup || "-"}</td>
        <td>${formatPnlCell(Number(trade.pnl || 0))}</td>
        <td>${trade.rr ? `1:${Number(trade.rr).toFixed(2)}` : "-"}</td>
        <td>${trade.emotion || "-"}</td>
        <td>
          <button class="action-btn" data-action="edit" data-id="${trade.id}">Edit</button>
          <button class="action-btn" data-action="delete" data-id="${trade.id}">Delete</button>
        </td>
      </tr>
    `)
    .join("");
}

function resetForm() {
  els.tradeForm.reset();
  els.tradeId.value = "";
  els.formTitle.textContent = "New trade";
  els.tradeDate.value = new Date().toISOString().split("T")[0];
  els.direction.value = "Long";
  els.emotion.value = "Calm";
}

function estimateComputedValues() {
  const entry = Number(els.entry.value || 0);
  const exit = Number(els.exit.value || 0);
  const quantity = Number(els.quantity.value || 0);
  const stopLoss = Number(els.stopLoss.value || 0);
  const target = Number(els.target.value || 0);
  const direction = els.direction.value;

  if (!els.pnl.value && entry && exit && quantity) {
    const computedPnl = direction === "Long" ? (exit - entry) * quantity : (entry - exit) * quantity;
    els.pnl.value = computedPnl.toFixed(2);
  }
  if (!els.rr.value && entry && stopLoss && target) {
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(target - entry);
    if (risk > 0) els.rr.value = (reward / risk).toFixed(2);
  }
}

function payloadFromForm() {
  estimateComputedValues();
  return {
    id: els.tradeId.value || undefined,
    symbol: els.symbol.value.trim().toUpperCase(),
    trade_date: els.tradeDate.value,
    direction: els.direction.value,
    setup: els.setup.value.trim(),
    entry: els.entry.value ? Number(els.entry.value) : null,
    exit: els.exit.value ? Number(els.exit.value) : null,
    quantity: els.quantity.value ? Number(els.quantity.value) : null,
    pnl: els.pnl.value ? Number(els.pnl.value) : 0,
    stop_loss: els.stopLoss.value ? Number(els.stopLoss.value) : null,
    target: els.target.value ? Number(els.target.value) : null,
    rr: els.rr.value ? Number(els.rr.value) : null,
    emotion: els.emotion.value,
    notes: els.notes.value.trim(),
  };
}

function fillForm(trade) {
  els.tradeId.value = trade.id;
  els.symbol.value = trade.symbol || "";
  els.tradeDate.value = trade.trade_date || "";
  els.direction.value = trade.direction || "Long";
  els.setup.value = trade.setup || "";
  els.entry.value = trade.entry ?? "";
  els.exit.value = trade.exit ?? "";
  els.quantity.value = trade.quantity ?? "";
  els.pnl.value = trade.pnl ?? "";
  els.stopLoss.value = trade.stop_loss ?? "";
  els.target.value = trade.target ?? "";
  els.rr.value = trade.rr ?? "";
  els.emotion.value = trade.emotion || "Calm";
  els.notes.value = trade.notes || "";
  els.formTitle.textContent = `Edit ${trade.symbol}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function applySessionUi() {
  const configured = !!supabase;
  if (!configured) {
    els.sessionState.textContent = "Setup needed";
    els.sessionUser.textContent = "Paste your Supabase URL and anon key";
    els.signoutBtn.hidden = true;
    return;
  }
  if (session?.user) {
    els.sessionState.textContent = "Connected";
    els.sessionUser.textContent = session.user.email || "Signed in";
    els.signoutBtn.hidden = false;
  } else {
    els.sessionState.textContent = "Ready";
    els.sessionUser.textContent = "Send yourself a magic link to sign in";
    els.signoutBtn.hidden = true;
  }
}

async function initSupabase() {
  const config = loadConfig();
  els.supabaseUrl.value = config.url || "";
  els.supabaseAnon.value = config.anonKey || "";
  if (!config.url || !config.anonKey) {
    supabase = null;
    session = null;
    trades = [];
    renderTrades();
    updateStats();
    applySessionUi();
    return;
  }
  supabase = createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  const { data } = await supabase.auth.getSession();
  session = data.session;
  supabase.auth.onAuthStateChange((_event, newSession) => {
    session = newSession;
    applySessionUi();
    if (session?.user) loadTrades();
    else {
      trades = [];
      renderTrades();
      updateStats();
    }
  });
  applySessionUi();
  if (session?.user) await loadTrades();
}

async function loadTrades() {
  if (!supabase || !session?.user) {
    trades = [];
    renderTrades();
    updateStats();
    return;
  }
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("trade_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    showToast(error.message);
    return;
  }
  trades = data || [];
  renderTrades();
  updateStats();
}

async function saveTrade(event) {
  event.preventDefault();
  if (!supabase || !session?.user) {
    showToast("Configure Supabase and sign in first");
    return;
  }
  const trade = payloadFromForm();
  if (!trade.symbol || !trade.trade_date) {
    showToast("Symbol and date are required");
    return;
  }
  const payload = {
    ...trade,
    user_id: session.user.id,
  };
  if (!payload.id) delete payload.id;
  const { error } = await supabase.from("trades").upsert(payload, { onConflict: "id" });
  if (error) {
    showToast(error.message);
    return;
  }
  resetForm();
  await loadTrades();
  showToast("Trade synced");
}

async function deleteTrade(id) {
  if (!supabase || !session?.user) return;
  const confirmed = window.confirm("Delete this trade?");
  if (!confirmed) return;
  const { error } = await supabase.from("trades").delete().eq("id", id);
  if (error) {
    showToast(error.message);
    return;
  }
  await loadTrades();
  showToast("Trade deleted");
}

function exportCsv() {
  if (!trades.length) {
    showToast("No trades to export");
    return;
  }
  const header = ["Date", "Symbol", "Direction", "Setup", "Entry", "Exit", "Quantity", "PnL", "StopLoss", "Target", "RR", "Emotion", "Notes"];
  const rows = trades.map((trade) => [
    trade.trade_date,
    trade.symbol,
    trade.direction,
    trade.setup || "",
    trade.entry ?? "",
    trade.exit ?? "",
    trade.quantity ?? "",
    trade.pnl ?? "",
    trade.stop_loss ?? "",
    trade.target ?? "",
    trade.rr ?? "",
    trade.emotion || "",
    (trade.notes || "").replace(/,/g, ";"),
  ]);
  const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `edge-log-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

els.openSetupBtn.addEventListener("click", () => els.setupModal.showModal());
els.openAuthBtn.addEventListener("click", () => {
  if (!supabase) {
    showToast("Save Supabase settings first");
    els.setupModal.showModal();
    return;
  }
  els.authModal.showModal();
});
els.saveSetupBtn.addEventListener("click", async () => {
  const config = {
    url: els.supabaseUrl.value.trim(),
    anonKey: els.supabaseAnon.value.trim(),
  };
  if (!config.url || !config.anonKey) {
    showToast("Both Supabase values are required");
    return;
  }
  saveConfig(config);
  els.setupModal.close();
  await initSupabase();
  showToast("Settings saved");
});
els.sendLinkBtn.addEventListener("click", async () => {
  if (!supabase) {
    showToast("Save Supabase settings first");
    return;
  }
  const email = els.authEmail.value.trim();
  if (!email) {
    showToast("Enter your email");
    return;
  }
  const redirectTo = window.location.href.split("#")[0];
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
  if (error) {
    showToast(error.message);
    return;
  }
  els.authModal.close();
  showToast("Magic link sent");
});
els.signoutBtn.addEventListener("click", async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
  showToast("Signed out");
});
els.tradeForm.addEventListener("submit", saveTrade);
els.resetFormBtn.addEventListener("click", resetForm);
els.search.addEventListener("input", renderTrades);
els.refreshBtn.addEventListener("click", loadTrades);
els.exportBtn.addEventListener("click", exportCsv);
[els.entry, els.exit, els.quantity, els.direction, els.stopLoss, els.target].forEach((el) => el.addEventListener("input", estimateComputedValues));
els.tradeRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  const trade = trades.find((item) => item.id === id);
  if (!trade) return;
  if (action === "edit") fillForm(trade);
  if (action === "delete") deleteTrade(id);
});

resetForm();
await initSupabase();
