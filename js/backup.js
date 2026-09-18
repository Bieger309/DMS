// backup.js
// Export/Import aller Daten als JSON-Datei. Wichtig, weil IndexedDB beim
// Löschen der Browserdaten unwiderruflich weg ist.

async function backupExportieren() {
  const daten = {};
  for (const storeName of DB.STORES) {
    daten[storeName] = await DB.alleHolen(storeName);
  }

  const paket = {
    anwendung: 'werkstatt-dms',
    version: 1,
    daten
  };

  const blob = new Blob([JSON.stringify(paket, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const heute = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `werkstatt-dms-backup-${heute}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

function backupDateiLesen(datei) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(datei);
  });
}

async function backupImportieren(datei) {
  const text = await backupDateiLesen(datei);
  let paket;
  try {
    paket = JSON.parse(text);
  } catch (fehler) {
    throw new Error('Datei ist kein gültiges JSON.');
  }

  if (!paket || paket.anwendung !== 'werkstatt-dms' || !paket.daten) {
    throw new Error('Datei ist kein Backup dieses Programms.');
  }

  const bestaetigt = window.confirm(
    'Import überschreibt ALLE aktuell gespeicherten Daten unwiderruflich. Fortfahren?'
  );
  if (!bestaetigt) {
    return;
  }

  for (const storeName of DB.STORES) {
    await DB.leeren(storeName);
    const eintraege = paket.daten[storeName] || [];
    for (const eintrag of eintraege) {
      await DB.speichern(storeName, eintrag);
    }
  }
}
