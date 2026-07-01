let RATE_PER_KG = 6;

const form =
document.getElementById("entryForm");

const kgInput =
document.getElementById("entryKg");

const dateInput =
document.getElementById("entryDate");

const recordsContainer =
document.getElementById("recordsContainer");

const undoBtn =
document.getElementById("undoBtn");

const themeToggle =
document.getElementById("themeToggle");

const languageToggle =
document.getElementById("languageToggle");

const ratePerKgInput =
document.getElementById("ratePerKg");

const offlineIndicator =
document.getElementById("offlineIndicator");

const lastBackupDate =
document.getElementById("lastBackupDate");

const backupNowBtn =
document.getElementById("backupNowBtn");

const exportCsvBtn =
document.getElementById("exportCsvBtn");

const exportJsonBtn =
document.getElementById("exportJsonBtn");

const importFile =
document.getElementById("importFile");

const importBtn =
document.getElementById("importBtn");

const toastEl =
document.getElementById("toast");

let lastDeleted = null;
let toastTimer = null;

/* ------------------ */
/* INIT               */
/* ------------------ */

document.addEventListener(
"DOMContentLoaded",
async () => {


await dbReady;

dateInput.value =
  new Date()
  .toISOString()
  .split("T")[0];

await initSettings();
await renderRecords();
await renderChart();
initOfflineIndicator();
registerServiceWorker();


}
);

/* ------------------ */
/* SETTINGS (theme /   */
/* language / rate)    */
/* ------------------ */

async function initSettings() {

const savedTheme =
  await db.getSetting("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
} else {
  themeToggle.textContent = "🌙";
}

const savedLang =
  await db.getSetting("language");

await setLanguage(
  savedLang || "mr",
  { persist: false, refresh: false }
);

const savedRate =
  await db.getSetting("ratePerKg");

RATE_PER_KG =
  (savedRate !== null && savedRate !== undefined)
    ? Number(savedRate)
    : 6;

ratePerKgInput.value = RATE_PER_KG;

const backupTime =
  await db.getSetting("lastBackup");

updateLastBackupLabel(backupTime);

}

themeToggle.addEventListener(
"click",
async () => {


const isDark =
  document.body.classList.toggle("dark");

themeToggle.textContent =
  isDark ? "☀️" : "🌙";

await db.setSetting(
  "theme",
  isDark ? "dark" : "light"
);

await renderChart();


}
);

languageToggle?.addEventListener(
"change",
async () => {

await setLanguage(languageToggle.value);
updateLastBackupLabel(
  await db.getSetting("lastBackup")
);

}
);

ratePerKgInput?.addEventListener(
"change",
async () => {


const rate =
  parseFloat(ratePerKgInput.value);

if (isNaN(rate) || rate < 0) {
  showToast(t("invalidKg"));
  ratePerKgInput.value = RATE_PER_KG;
  return;
}

RATE_PER_KG = rate;

await db.setSetting(
  "ratePerKg",
  RATE_PER_KG
);

showToast(t("expensesSaved"));


}
);

/* ------------------ */
/* OFFLINE INDICATOR  */
/* ------------------ */

function initOfflineIndicator() {

updateOfflineStatus();

window.addEventListener(
  "online",
  updateOfflineStatus
);

window.addEventListener(
  "offline",
  updateOfflineStatus
);

}

function updateOfflineStatus() {

if (!offlineIndicator) return;

offlineIndicator.classList.toggle(
  "hidden",
  navigator.onLine
);

}

/* ------------------ */
/* SERVICE WORKER     */
/* ------------------ */

function registerServiceWorker() {

if (!navigator.serviceWorker) return;

navigator.serviceWorker
  .register("sw.js")
  .catch(() => {
    /* offline-first app shell just won't be cached; app still works */
  });

}

/* ------------------ */
/* TOAST              */
/* ------------------ */

function showToast(message) {

if (!toastEl) return;

toastEl.textContent = message;
toastEl.classList.add("show");

clearTimeout(toastTimer);

toastTimer = setTimeout(
  () => toastEl.classList.remove("show"),
  2200
);

}

/* ------------------ */
/* SAVE ENTRY         */
/* ------------------ */

form.addEventListener(
"submit",
async (e) => {


e.preventDefault();

const kg =
  parseFloat(
    kgInput.value
  );

if (
  isNaN(kg)
  ||
  kg <= 0
) {

  showToast(
    t("invalidKg")
  );

  return;
}

const revenue =
  kg * RATE_PER_KG;

const entry = {

  date:
    dateInput.value,

  kg,

  revenue,

  createdAt:
    Date.now()

};

await db.addEntry(entry);

form.reset();

dateInput.value =
  new Date()
  .toISOString()
  .split("T")[0];

await renderRecords();
await renderChart();
if (typeof updateBillingReport === "function") {
  await updateBillingReport();
}

showToast(t("entrySaved"));


}
);

/* ------------------ */
/* RENDER RECORDS     */
/* ------------------ */

async function renderRecords() {

const entries =
await db.getAllEntries();

if (
!entries.length
) {


recordsContainer.innerHTML =
  `
  <div class="empty-state">
  ${t("noRecords")}
  </div>
  `;

return;


}

recordsContainer.innerHTML =
entries
.map(
record => {


      const formattedDate =
        formatDate(
          record.date
        );

      return `
      <div class="record-item">

        <div class="record-date">
          ${formattedDate}
        </div>

        <div class="record-data">

          <strong>
            ${record.kg} KG
          </strong>

          <strong>
            ₹${Number(record.revenue).toFixed(0)}
          </strong>

        </div>

        <div class="record-actions">

          <button
            class="edit-btn"
            onclick="editRecord(${record.id})"
          >
            ${t("edit")}
          </button>

          <button
            class="delete-btn"
            onclick="deleteRecord(${record.id})"
          >
            ${t("delete")}
          </button>

        </div>

      </div>
      `;
    }
  )
  .join("");


}

/* ------------------ */
/* DELETE             */
/* ------------------ */

async function deleteRecord(id) {

const confirmDelete =
confirm(
t("confirmDelete")
);

if (
!confirmDelete
) return;

const entries =
await db.getAllEntries();

lastDeleted =
entries.find(
e => e.id === id
);

await db.deleteEntry(id);

await renderRecords();
await renderChart();
if (typeof updateBillingReport === "function") {
  await updateBillingReport();
}

showToast(t("entryDeleted"));

}

/* ------------------ */
/* UNDO LAST DELETE   */
/* ------------------ */

undoBtn.addEventListener(
"click",
async () => {


if (
  !lastDeleted
) {

  showToast(
    t("nothingToUndo")
  );

  return;
}

const restored = {

  date:
    lastDeleted.date,

  kg:
    lastDeleted.kg,

  revenue:
    lastDeleted.revenue,

  createdAt:
    Date.now()

};

await db.addEntry(
  restored
);

lastDeleted = null;

await renderRecords();
await renderChart();
if (typeof updateBillingReport === "function") {
  await updateBillingReport();
}

showToast(t("entryUndone"));


}
);

/* ------------------ */
/* EDIT               */
/* ------------------ */

async function editRecord(id) {

const entries =
await db.getAllEntries();

const record =
entries.find(
e => e.id === id
);

if (
!record
) return;

const newKg =
prompt(
t("totalKg"),
record.kg
);

if (
newKg === null
) return;

const kg =
parseFloat(newKg);

if (
isNaN(kg)
||
kg <= 0
) {


showToast(
  t("invalidKg")
);

return;


}

record.kg =
kg;

record.revenue =
kg * RATE_PER_KG;

await db.updateEntry(
record
);

await renderRecords();
await renderChart();
if (typeof updateBillingReport === "function") {
  await updateBillingReport();
}

showToast(t("entryUpdated"));

}

/* ------------------ */
/* FORMAT DATE        */
/* ------------------ */

function formatDate(date) {

return new Date(date)
.toLocaleDateString(
"en-GB",
{
day: "2-digit",
month: "short",
year: "numeric"
}
);

}

/* ------------------ */
/* BACKUP / EXPORT /   */
/* IMPORT              */
/* ------------------ */

async function buildBackupPayload() {

const entries = await db.getAllEntries();
const expenses = await db.getExpenses();

const settings = {
  ratePerKg: RATE_PER_KG,
  billingStartDate: await db.getSetting("billingStartDate"),
  billingEndDate: await db.getSetting("billingEndDate")
};

return { entries, expenses, settings };

}

function downloadFile(filename, content, mimeType) {

const blob = new Blob([content], { type: mimeType });
const url = URL.createObjectURL(blob);

const link = document.createElement("a");
link.href = url;
link.download = filename;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

URL.revokeObjectURL(url);

}

function updateLastBackupLabel(timestamp) {

if (!lastBackupDate) return;

lastBackupDate.textContent =
  timestamp
    ? formatDate(new Date(Number(timestamp)))
    : t("never");

}

backupNowBtn?.addEventListener(
"click",
async () => {


const payload = await buildBackupPayload();

if (!payload.entries.length) {
  showToast(t("noDataToExport"));
  return;
}

const stamp = Date.now();

downloadFile(
  `girni-nond-backup-${stamp}.json`,
  JSON.stringify(payload, null, 2),
  "application/json"
);

await db.setSetting("lastBackup", stamp);
updateLastBackupLabel(stamp);

showToast(t("backedUp"));


}
);

exportJsonBtn?.addEventListener(
"click",
async () => {


const payload = await buildBackupPayload();

if (!payload.entries.length) {
  showToast(t("noDataToExport"));
  return;
}

downloadFile(
  `girni-nond-${Date.now()}.json`,
  JSON.stringify(payload, null, 2),
  "application/json"
);

showToast(t("exportedJson"));


}
);

exportCsvBtn?.addEventListener(
"click",
async () => {


const entries = await db.getAllEntries();

if (!entries.length) {
  showToast(t("noDataToExport"));
  return;
}

const rows = [
  ["date", "kg", "revenue"],
  ...entries
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => [e.date, e.kg, e.revenue])
];

const csv = rows
  .map((row) => row.join(","))
  .join("\n");

downloadFile(
  `girni-nond-${Date.now()}.csv`,
  csv,
  "text/csv"
);

showToast(t("exportedCsv"));


}
);

importBtn?.addEventListener(
"click",
async () => {


const file = importFile.files[0];

if (!file) {
  showToast(t("selectFile"));
  return;
}

try {

  const text = await file.text();

  if (file.name.endsWith(".json")) {
    await importJson(text);
  } else {
    await importCsv(text);
  }

  await renderRecords();
  await renderChart();
  if (typeof updateBillingReport === "function") {
    await updateBillingReport();
  }

  importFile.value = "";
  showToast(t("imported"));

} catch (err) {
  showToast(t("importFailed"));
}


}
);

async function importJson(text) {

const data = JSON.parse(text);
const entries = Array.isArray(data) ? data : data.entries;

if (!Array.isArray(entries)) {
  throw new Error("Invalid JSON format");
}

for (const entry of entries) {

  await db.addEntry({
    date: entry.date,
    kg: Number(entry.kg),
    revenue:
      entry.revenue !== undefined
        ? Number(entry.revenue)
        : Number(entry.kg) * RATE_PER_KG,
    createdAt: Date.now()
  });

}

if (!Array.isArray(data) && data.expenses) {
  await db.saveExpenses(data.expenses);
}

}

async function importCsv(text) {

const lines = text
  .trim()
  .split("\n")
  .filter(Boolean);

const startIndex =
  lines[0].toLowerCase().startsWith("date") ? 1 : 0;

for (let i = startIndex; i < lines.length; i++) {

  const [date, kg, revenue] = lines[i].split(",");

  if (!date || !kg) continue;

  const kgNum = Number(kg);

  await db.addEntry({
    date: date.trim(),
    kg: kgNum,
    revenue:
      revenue !== undefined && revenue.trim() !== ""
        ? Number(revenue)
        : kgNum * RATE_PER_KG,
    createdAt: Date.now()
  });

}

}

window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
