const DB_NAME = "GirniNondDB";
const DB_VERSION = 1;

const STORES = {
entries: "entries",
settings: "settings",
expenses: "expenses"
};

class GirniDB {

constructor() {
this.db = null;
}

async init() {


return new Promise((resolve, reject) => {

  const request =
    indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = () =>
    reject(request.error);

  request.onsuccess = () => {

    this.db = request.result;
    resolve(this.db);

  };

  request.onupgradeneeded = (event) => {

    const db = event.target.result;

    if (!db.objectStoreNames.contains(STORES.entries)) {

      const store =
        db.createObjectStore(
          STORES.entries,
          {
            keyPath: "id",
            autoIncrement: true
          }
        );

      store.createIndex(
        "date",
        "date",
        { unique: false }
      );
    }

    if (!db.objectStoreNames.contains(STORES.settings)) {

      db.createObjectStore(
        STORES.settings,
        {
          keyPath: "key"
        }
      );
    }

    if (!db.objectStoreNames.contains(STORES.expenses)) {

      db.createObjectStore(
        STORES.expenses,
        {
          keyPath: "id"
        }
      );
    }

  };

});


}

getStore(name, mode = "readonly") {


return this.db
  .transaction(name, mode)
  .objectStore(name);


}

/* ------------------ */
/* ENTRIES            */
/* ------------------ */

async addEntry(entry) {


return new Promise((resolve, reject) => {

  const request =
    this.getStore(
      STORES.entries,
      "readwrite"
    ).add(entry);

  request.onsuccess =
    () => resolve(request.result);

  request.onerror =
    () => reject(request.error);

});


}

async updateEntry(entry) {


return new Promise((resolve, reject) => {

  const request =
    this.getStore(
      STORES.entries,
      "readwrite"
    ).put(entry);

  request.onsuccess =
    () => resolve();

  request.onerror =
    () => reject(request.error);

});


}

async deleteEntry(id) {


return new Promise((resolve, reject) => {

  const request =
    this.getStore(
      STORES.entries,
      "readwrite"
    ).delete(id);

  request.onsuccess =
    () => resolve();

  request.onerror =
    () => reject(request.error);

});


}

async getAllEntries() {


return new Promise((resolve, reject) => {

  const request =
    this.getStore(
      STORES.entries
    ).getAll();

  request.onsuccess = () => {

    const records =
      request.result.sort(
        (a, b) =>
          new Date(b.date)
          -
          new Date(a.date)
      );

    resolve(records);

  };

  request.onerror =
    () => reject(request.error);

});


}

async getLastEntry() {


const entries =
  await this.getAllEntries();

return entries[0] || null;


}

/* ------------------ */
/* SETTINGS           */
/* ------------------ */

async setSetting(key, value) {


return new Promise((resolve, reject) => {

  const request =
    this.getStore(
      STORES.settings,
      "readwrite"
    ).put({
      key,
      value
    });

  request.onsuccess =
    () => resolve();

  request.onerror =
    () => reject(request.error);

});


}

async getSetting(key) {


return new Promise((resolve, reject) => {

  const request =
    this.getStore(
      STORES.settings
    ).get(key);

  request.onsuccess = () => {

    resolve(
      request.result
        ? request.result.value
        : null
    );

  };

  request.onerror =
    () => reject(request.error);

});


}

/* ------------------ */
/* EXPENSES           */
/* ------------------ */

async saveExpenses(data) {


return new Promise((resolve, reject) => {

  const request =
    this.getStore(
      STORES.expenses,
      "readwrite"
    ).put({
      id: "current",
      ...data
    });

  request.onsuccess =
    () => resolve();

  request.onerror =
    () => reject(request.error);

});


}

async getExpenses() {


return new Promise((resolve, reject) => {

  const request =
    this.getStore(
      STORES.expenses
    ).get("current");

  request.onsuccess =
    () => resolve(
      request.result || {
        electricity: 0,
        other: 0
      }
    );

  request.onerror =
    () => reject(request.error);

});


}

}

const db = new GirniDB();

/* dbReady is awaited by every other script before touching the DB.
   Declared with const at top level so it's visible to later classic
   <script> tags on this page (shared script scope), same as `db` above. */
const dbReady = db.init();

