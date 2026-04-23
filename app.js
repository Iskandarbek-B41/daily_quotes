const quoteEl = document.getElementById("quoteText");
const statusEl = document.getElementById("status");
const themeToggle = document.getElementById("themeToggle");
const shareBtn = document.getElementById("shareBtn");
const copyBtn = document.getElementById("copyBtn");
const SITE_URL = location.href.split("?")[0].split("#")[0];

function fnv1a(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function todayKey() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
}

function loadTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") return setTheme(saved);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}

async function loadQuotes() {
  const response = await fetch("quotes.txt", { cache: "no-store" });
  const text = await response.text();
  return text
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(line => line.replace(/^Thought for today:\s*/i, "").trim());
}

function pickDailyQuote(quotes) {
  return quotes[fnv1a(todayKey()) % quotes.length];
}

function render(q) {
  quoteEl.textContent = q;
}

function sharePayload() {
  return {
    title: "Daily Thought",
    text: `Thought for today: ${quoteEl.textContent}\n\n${SITE_URL}`,
    url: SITE_URL,
  };
}

async function shareQuote() {
  const data = sharePayload();
  try {
    if (navigator.share) {
      await navigator.share(data);
      statusEl.textContent = "Share panel opened.";
    } else {
      await navigator.clipboard.writeText(`${data.text}`);
      statusEl.textContent = "Share text copied to clipboard.";
    }
  } catch {
    statusEl.textContent = "Sharing was canceled or not available.";
  }
}

async function copyQuote() {
  try {
    await navigator.clipboard.writeText(`Thought for today: ${quoteEl.textContent}\n\n${SITE_URL}`);
    statusEl.textContent = "Copied to clipboard.";
  } catch {
    statusEl.textContent = "Clipboard access was blocked by the browser.";
  }
}

themeToggle.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

shareBtn.addEventListener("click", shareQuote);
copyBtn.addEventListener("click", copyQuote);

(async function init() {
  loadTheme();
  try {
    const quotes = await loadQuotes();
    render(pickDailyQuote(quotes));
  } catch {
    quoteEl.textContent = "Could not load today’s thought.";
  }
})();