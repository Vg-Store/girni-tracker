/* ------------------------------------------------------ */
/* KG TREND CHART (plain <canvas>, no external library —   */
/* keeps the app fully offline-capable, no CDN dependency) */
/* ------------------------------------------------------ */

function getCssVar(name, fallback) {
  const value = getComputedStyle(document.body).getPropertyValue(name).trim();
  return value || fallback;
}

function roundRect(ctx, x, y, w, h, r) {

  const radius = Math.min(r, w / 2, Math.max(h, 0.001) / 2);

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

async function renderChart() {

  const canvas = document.getElementById("dailyChart");
  if (!canvas) return;

  if (typeof dbReady !== "undefined") await dbReady;

  const allEntries = await db.getAllEntries();

  /* getAllEntries() is sorted newest-first; take the most recent 14
     and flip to chronological order for a left-to-right timeline. */
  const recent = allEntries.slice(0, 14).slice().reverse();

  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.parentElement.clientWidth || 320;
  const cssHeight = 260;

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const textLight = getCssVar("--text-light", "#6b7280");

  if (!recent.length) {
    ctx.fillStyle = textLight;
    ctx.font = "14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      typeof t === "function" ? t("noRecords") : "No records yet",
      cssWidth / 2,
      cssHeight / 2
    );
    return;
  }

  const padding = { top: 16, right: 10, bottom: 30, left: 8 };
  const chartW = cssWidth - padding.left - padding.right;
  const chartH = cssHeight - padding.top - padding.bottom;

  const maxKg = Math.max(...recent.map((e) => Number(e.kg) || 0), 1);
  const barGap = 8;
  const barW = Math.max((chartW - barGap * (recent.length - 1)) / recent.length, 4);

  const primary = getCssVar("--primary", "#2e7d32");
  const border = getCssVar("--border", "#e5e7eb");

  /* gridlines */
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = padding.top + (chartH * i) / 3;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();
  }

  recent.forEach((entry, i) => {

    const kg = Number(entry.kg) || 0;
    const barH = Math.max((kg / maxKg) * chartH, 2);
    const x = padding.left + i * (barW + barGap);
    const y = padding.top + chartH - barH;

    ctx.fillStyle = primary;
    roundRect(ctx, x, y, barW, barH, 4);
    ctx.fill();

    ctx.fillStyle = textLight;
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";

    const d = new Date(entry.date);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    ctx.fillText(label, x + barW / 2, cssHeight - 12);
  });
}

/* Redraw on resize (debounced) so the chart stays responsive, and
   whenever the theme flips (colors come from CSS variables). */
let chartResizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(renderChart, 150);
});
