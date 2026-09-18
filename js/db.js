// db.js
// Kapselt den Zugriff auf IndexedDB hinter einfachen Promise-Funktionen,
// damit der Rest des Programms nicht mit der Callback-API von IndexedDB
// arbeiten muss.

const DB_NAME = 'werkstatt-dms';
const DB_VERSION = 1;

// Alle Object Stores der Datenbank. Jeder Datensatz bekommt automatisch
// eine fortlaufende numerische id (keyPath 'id', autoIncrement).
const DB_STORES = [
  'kunden',
  'fahrzeuge',
  'artikel',
  'lohnpositionen',
  'auftraege',
  'rechnungen',
  'firmenprofil'
];

let dbInstanz = null;

function dbOeffnen() {
  return new Promise((resolve, reject) => {
    const anfrage = indexedDB.open(DB_NAME, DB_VERSION);

    anfrage.onupgradeneeded = (event) => {
      const db = event.target.result;
      for (const storeName of DB_STORES) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      }
    };

    anfrage.onsuccess = (event) => {
      dbInstanz = event.target.result;
      resolve(dbInstanz);
    };

    anfrage.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function objectStore(storeName, modus) {
  return dbInstanz.transaction(storeName, modus).objectStore(storeName);
}

function dbAlleHolen(storeName) {
  return new Promise((resolve, reject) => {
    const anfrage = objectStore(storeName, 'readonly').getAll();
    anfrage.onsuccess = () => resolve(anfrage.result);
    anfrage.onerror = () => reject(anfrage.error);
  });
}

function dbEinesHolen(storeName, id) {
  return new Promise((resolve, reject) => {
    const anfrage = objectStore(storeName, 'readonly').get(id);
    anfrage.onsuccess = () => resolve(anfrage.result);
    anfrage.onerror = () => reject(anfrage.error);
  });
}

// Legt einen neuen Datensatz an oder überschreibt einen vorhandenen
// (wenn datensatz.id gesetzt ist). Liefert die id zurück.
function dbSpeichern(storeName, datensatz) {
  return new Promise((resolve, reject) => {
    const anfrage = objectStore(storeName, 'readwrite').put(datensatz);
    anfrage.onsuccess = () => resolve(anfrage.result);
    anfrage.onerror = () => reject(anfrage.error);
  });
}

function dbLoeschen(storeName, id) {
  return new Promise((resolve, reject) => {
    const anfrage = objectStore(storeName, 'readwrite').delete(id);
    anfrage.onsuccess = () => resolve();
    anfrage.onerror = () => reject(anfrage.error);
  });
}

function dbLeeren(storeName) {
  return new Promise((resolve, reject) => {
    const anfrage = objectStore(storeName, 'readwrite').clear();
    anfrage.onsuccess = () => resolve();
    anfrage.onerror = () => reject(anfrage.error);
  });
}

// Liefert das Firmenprofil (Singleton-Datensatz mit id 1). Legt beim
// allerersten Aufruf einen Datensatz mit sinnvollen Startwerten an.
async function dbFirmenprofilHolen() {
  let profil = await dbEinesHolen('firmenprofil', 1);
  if (!profil) {
    profil = {
      id: 1,
      firmenname: '',
      strasse: '',
      plz: '',
      ort: '',
      telefon: '',
      email: '',
      steuernummer: '',
      bankverbindung: '',
      mwstSatz: 19,
      naechsteAuftragsnummer: 1,
      naechsteRechnungsnummer: 1
    };
    await dbSpeichern('firmenprofil', profil);
  }
  return profil;
}

const DB = {
  STORES: DB_STORES,
  oeffnen: dbOeffnen,
  alleHolen: dbAlleHolen,
  einesHolen: dbEinesHolen,
  speichern: dbSpeichern,
  loeschen: dbLoeschen,
  leeren: dbLeeren,
  firmenprofilHolen: dbFirmenprofilHolen
};
