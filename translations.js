/* ------------------------------------------------------ */
/* TRANSLATIONS (Marathi / English)                        */
/* ------------------------------------------------------ */

const TRANSLATIONS = {

mr: {
  appTitle: "गिरणी नोंद",
  dailyEntry: "रोजची नोंद",
  totalKg: "एकूण किलो",
  date: "तारीख",
  saveEntry: "नोंद जतन करा",
  undoLast: "शेवटची पूर्ववत करा",
  records: "नोंदी",
  noRecords: "अजून नोंदी नाहीत",
  kgTrend: "किलो कल",
  billingReports: "बिल अहवाल",
  period: "कालावधी",
  totalDays: "एकूण दिवस",
  totalKgLabel: "एकूण किलो",
  revenue: "उत्पन्न",
  electricityBill: "वीज बिल",
  otherExpenses: "इतर खर्च",
  saveExpenses: "खर्च जतन करा",
  netIncome: "निव्वळ उत्पन्न",
  settings: "सेटिंग्ज",
  ratePerKg: "दर प्रति किलो (₹)",
  billingStart: "बिल सुरुवात तारीख",
  billingEnd: "बिल शेवट तारीख",
  lastBackup: "शेवटचा बॅकअप:",
  backupNow: "आता बॅकअप घ्या",
  exportCsv: "CSV निर्यात करा",
  exportJson: "JSON निर्यात करा",
  importData: "डेटा आयात करा",
  edit: "संपादित करा",
  delete: "काढा",
  never: "कधीच नाही",
  offline: "ऑफलाइन मोड",
  entrySaved: "नोंद जतन झाली",
  entryDeleted: "नोंद काढली",
  entryUndone: "नोंद पूर्ववत झाली",
  entryUpdated: "नोंद अद्यतनित झाली",
  expensesSaved: "खर्च जतन झाला",
  backedUp: "बॅकअप जतन झाला",
  exportedCsv: "CSV निर्यात झाली",
  exportedJson: "JSON निर्यात झाली",
  imported: "आयात यशस्वी",
  importFailed: "आयात अयशस्वी",
  invalidKg: "वैध किलो टाका",
  nothingToUndo: "पूर्ववत करण्यासाठी काही नाही",
  confirmDelete: "नोंद काढायची का?",
  noDataToExport: "निर्यात करण्यासाठी डेटा नाही",
  selectFile: "आधी फाईल निवडा"
},

en: {
  appTitle: "Girni Nond",
  dailyEntry: "Daily Entry",
  totalKg: "Total KG",
  date: "Date",
  saveEntry: "Save Entry",
  undoLast: "Undo Last",
  records: "Records",
  noRecords: "No records yet",
  kgTrend: "KG Trend",
  billingReports: "Billing Reports",
  period: "Period",
  totalDays: "Total Days",
  totalKgLabel: "Total KG",
  revenue: "Revenue",
  electricityBill: "Electricity Bill",
  otherExpenses: "Other Expenses",
  saveExpenses: "Save Expenses",
  netIncome: "Net Income",
  settings: "Settings",
  ratePerKg: "Rate per KG (₹)",
  billingStart: "Billing Start Date",
  billingEnd: "Billing End Date",
  lastBackup: "Last Backup:",
  backupNow: "Backup Now",
  exportCsv: "Export CSV",
  exportJson: "Export JSON",
  importData: "Import Data",
  edit: "Edit",
  delete: "Delete",
  never: "Never",
  offline: "Offline Mode",
  entrySaved: "Entry saved",
  entryDeleted: "Entry deleted",
  entryUndone: "Entry restored",
  entryUpdated: "Entry updated",
  expensesSaved: "Expenses saved",
  backedUp: "Backup saved",
  exportedCsv: "CSV exported",
  exportedJson: "JSON exported",
  imported: "Import successful",
  importFailed: "Import failed",
  invalidKg: "Enter valid KG",
  nothingToUndo: "Nothing to undo",
  confirmDelete: "Delete this record?",
  noDataToExport: "No data to export",
  selectFile: "Choose a file first"
}

};

let currentLang = "mr";

function t(key) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.mr;
  return dict[key] || key;
}

function applyTranslations() {

  document.documentElement.lang = currentLang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });

  const langToggle = document.getElementById("languageToggle");
  if (langToggle) langToggle.value = currentLang;
}

/* Called by app.js once the language <select> changes, and once on
   startup after the saved preference is read from IndexedDB. */
async function setLanguage(lang, opts) {

  const options = opts || {};
  const persist = options.persist !== false;
  const refresh = options.refresh !== false;

  currentLang = lang === "en" ? "en" : "mr";

  applyTranslations();

  if (persist && typeof dbReady !== "undefined") {
    await dbReady;
    await db.setSetting("language", currentLang);
  }

  if (refresh) {
    if (typeof renderRecords === "function") await renderRecords();
    if (typeof updateBillingReport === "function") await updateBillingReport();
    if (typeof renderChart === "function") await renderChart();
  }
}
