// module-einstellungen.js
// Firmenprofil (Absenderdaten für Auftrags-/Rechnungsdruck) und
// Backup-Export/Import. Wird schon im Grundgerüst gebraucht, damit ein
// Backup von Anfang an möglich ist.

async function initEinstellungenModul(container) {
  const profil = await DB.firmenprofilHolen();

  container.innerHTML = `
    <section class="karte">
      <h2>Firmenprofil</h2>
      <p class="hinweis">Diese Angaben erscheinen später auf Auftrags- und Rechnungsdrucken.</p>
      <form id="firmenprofil-formular" class="formular">
        <label>Firmenname
          <input type="text" name="firmenname" value="${escapeHtml(profil.firmenname)}">
        </label>
        <label>Straße/Hausnummer
          <input type="text" name="strasse" value="${escapeHtml(profil.strasse)}">
        </label>
        <label>PLZ
          <input type="text" name="plz" value="${escapeHtml(profil.plz)}">
        </label>
        <label>Ort
          <input type="text" name="ort" value="${escapeHtml(profil.ort)}">
        </label>
        <label>Telefon
          <input type="text" name="telefon" value="${escapeHtml(profil.telefon)}">
        </label>
        <label>E-Mail
          <input type="email" name="email" value="${escapeHtml(profil.email)}">
        </label>
        <label>Steuernummer
          <input type="text" name="steuernummer" value="${escapeHtml(profil.steuernummer)}">
        </label>
        <label>Bankverbindung
          <input type="text" name="bankverbindung" value="${escapeHtml(profil.bankverbindung)}">
        </label>
        <label>MwSt-Satz (%)
          <input type="number" name="mwstSatz" value="${profil.mwstSatz}" step="0.1" min="0">
        </label>
        <button type="submit">Speichern</button>
        <span id="firmenprofil-status" class="status"></span>
      </form>
    </section>

    <section class="karte">
      <h2>Backup</h2>
      <p class="hinweis">
        Alle Daten liegen nur in diesem Browser. Beim Löschen der Browserdaten
        sind sie unwiderruflich weg. Regelmäßig exportieren!
      </p>
      <button id="backup-export-button">Daten exportieren (JSON-Datei)</button>

      <p class="hinweis" style="margin-top: 1.5em;">
        Import überschreibt ALLE aktuell gespeicherten Daten mit dem Inhalt
        der ausgewählten Datei.
      </p>
      <input type="file" id="backup-import-datei" accept="application/json">
      <span id="backup-status" class="status"></span>
    </section>
  `;

  const formular = container.querySelector('#firmenprofil-formular');
  formular.addEventListener('submit', async (event) => {
    event.preventDefault();
    const daten = new FormData(formular);
    const aktualisiertesProfil = {
      ...profil,
      firmenname: daten.get('firmenname').trim(),
      strasse: daten.get('strasse').trim(),
      plz: daten.get('plz').trim(),
      ort: daten.get('ort').trim(),
      telefon: daten.get('telefon').trim(),
      email: daten.get('email').trim(),
      steuernummer: daten.get('steuernummer').trim(),
      bankverbindung: daten.get('bankverbindung').trim(),
      mwstSatz: parseFloat(daten.get('mwstSatz')) || 0
    };
    await DB.speichern('firmenprofil', aktualisiertesProfil);
    const status = container.querySelector('#firmenprofil-status');
    status.textContent = 'Gespeichert.';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });

  container.querySelector('#backup-export-button').addEventListener('click', async () => {
    await backupExportieren();
  });

  container.querySelector('#backup-import-datei').addEventListener('change', async (event) => {
    const datei = event.target.files[0];
    if (!datei) return;
    const status = container.querySelector('#backup-status');
    try {
      await backupImportieren(datei);
      status.textContent = 'Import abgeschlossen. Seite wird neu geladen.';
      setTimeout(() => window.location.reload(), 1500);
    } catch (fehler) {
      status.textContent = 'Fehler: ' + fehler.message;
    }
    event.target.value = '';
  });
}
