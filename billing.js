const billingStartDate =
document.getElementById(
"billingStartDate"
);

const billingEndDate =
document.getElementById(
"billingEndDate"
);

const electricityBillInput =
document.getElementById(
"electricityBill"
);

const otherExpensesInput =
document.getElementById(
"otherExpenses"
);

const reportPeriod =
document.getElementById(
"reportPeriod"
);

const reportDays =
document.getElementById(
"reportDays"
);

const reportKg =
document.getElementById(
"reportKg"
);

const reportRevenue =
document.getElementById(
"reportRevenue"
);

const reportNetIncome =
document.getElementById(
"reportNetIncome"
);

async function initBilling() {

if (typeof dbReady !== "undefined") await dbReady;

const startDate =
await db.getSetting(
"billingStartDate"
);

const endDate =
await db.getSetting(
"billingEndDate"
);

if(startDate)
billingStartDate.value =
startDate;

if(endDate)
billingEndDate.value =
endDate;

const expenses =
await db.getExpenses();

electricityBillInput.value =
expenses.electricity || 0;

otherExpensesInput.value =
expenses.other || 0;

await updateBillingReport();

}

billingStartDate?.addEventListener(
"change",
async () => {


await db.setSetting(
  "billingStartDate",
  billingStartDate.value
);

await updateBillingReport();


}
);

billingEndDate?.addEventListener(
"change",
async () => {


await db.setSetting(
  "billingEndDate",
  billingEndDate.value
);

await updateBillingReport();


}
);

electricityBillInput?.addEventListener(
"input",
saveExpenses
);

otherExpensesInput?.addEventListener(
"input",
saveExpenses
);

async function saveExpenses() {

await db.saveExpenses({


electricity:
  Number(
    electricityBillInput.value
  ) || 0,

other:
  Number(
    otherExpensesInput.value
  ) || 0


});

await updateBillingReport();

}

async function updateBillingReport() {

if (typeof dbReady !== "undefined") await dbReady;

const start =
billingStartDate.value;

const end =
billingEndDate.value;

if(!start || !end)
return;

const entries =
await db.getAllEntries();

const filtered =
entries.filter(entry => {


  return (
    entry.date >= start &&
    entry.date <= end
  );

});


const totalKg =
filtered.reduce(
(sum, entry) =>
sum + Number(entry.kg),
0
);

const revenue =
filtered.reduce(
(sum, entry) =>
sum + Number(entry.revenue),
0
);

const startObj =
new Date(start);

const endObj =
new Date(end);

const totalDays =
Math.floor(
(
endObj -
startObj
) /
86400000
) + 1;

const expenses =
await db.getExpenses();

const electricity =
Number(
expenses.electricity
) || 0;

const other =
Number(
expenses.other
) || 0;

const netIncome =
revenue
- electricity
- other;

reportPeriod.textContent =
`${formatDate(start)} → ${formatDate(end)}`;

reportDays.textContent =
totalDays;

reportKg.textContent =
totalKg.toFixed(1);

reportRevenue.textContent =
`₹${revenue.toFixed(0)}`;

reportNetIncome.textContent =
`₹${netIncome.toFixed(0)}`;

}

function formatDate(date) {

return new Date(date)
.toLocaleDateString(
"en-GB",
{
day:"2-digit",
month:"short",
year:"numeric"
}
);

}

document.addEventListener(
"DOMContentLoaded",
async () => {


if(typeof db !== "undefined") {

  await initBilling();

}


}
);

window.updateBillingReport =
updateBillingReport;

