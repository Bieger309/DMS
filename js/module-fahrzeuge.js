// module-fahrzeuge.js
// Fahrzeugverwaltung. Jedes Fahrzeug gehört zu genau einem Kunden.

function fahrzeugLeererDatensatz() {
  return {
    kundeId: null,
    kennzeichen: '',
    vin: '',
    hsn: '',
    tsn: '',
    hersteller: '',
    modell: '',
    erstzulassung: '',
    kilometerstandAktuell: ''
  };
}

function fahrzeugSuchtreffer(fahrzeug, kundeName, suchbegriff) {
  const text = [fahrzeug.kennzeichen, fahrzeug.vin, fahrzeug.hersteller, fahrzeug.modell, kundeName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(suchbegriff.toLowerCase());
}

async function initFahrzeugeModul(container) {
  await fahrzeugeListeAnzeigen(container);
}

async function fahrzeugeListeAnzeigen(container, suchbegriff = '') {
  const [alleFahrzeuge, alleKunden] = await Promise.all([
    DB.alleHolen('fahrzeuge'),
    DB.alleHolen('kunden')
  ]);

  const kundenNachId = new Map(alleKunden.map((k) => [k.id, k]));
  const kundeName = (kundeId) => {
    const kunde = kundenNachId.get(kundeId);
    return kunde ? kundeAnzeigename(kunde) : '(unbekannter Kunde)';
  };

  alleFahrzeuge.sort((a, b) => (a.kennzeichen || '').localeCompare(b.kennzeichen || ''));

  const gefiltert = suchbegriff
    ? alleFahrzeuge.filter((f) => fahrzeugSuchtreffer(f, kundeName(f.kundeId), suchbegriff))
    : alleFahrzeuge;

  container.innerHTML = `
    <div class="werkzeugleiste">
      <input type="search" id="fahrzeuge-suche" placeholder="Suchen nach Kennzeichen, VIN, Hersteller, Halter..." value="${escapeHtml(suchbegriff)}">
      <button id="fahrzeug-neu-button" ${alleKunden.length === 0 ? 'disabled' : ''}>+ Neues Fahrzeug</button>
    </div>
    ${alleKunden.length === 0 ? '<p class="hinweis">Bitte zuerst einen Kunden anlegen, bevor du ein Fahrzeug erfassen kannst.</p>' : ''}
    <table class="tabelle">
      <thead>
        <tr><th>Kennzeichen</th><th>Halter</th><th>Hersteller/Modell</th><th>km-Stand</th><th></th></tr>
      </thead>
      <tbody>
        ${gefiltert.map((f) => `
          <tr data-id="${f.id}" class="tabelle-zeile">
            <td>${escapeHtml(f.kennzeichen)}</td>
            <td>${escapeHtml(kundeName(f.kundeId))}</td>
            <td>${escapeHtml([f.hersteller, f.modell].filter(Boolean).join(' '))}</td>
            <td>${f.kilometerstandAktuell !== '' && f.kilometerstandAktuell != null ? escapeHtml(String(f.kilometerstandAktuell)) : ''}</td>
            <td><button class="loeschen-button" data-id="${f.id}" title="Löschen">✕</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${gefiltert.length === 0 ? '<p class="hinweis">Keine Fahrzeuge gefunden.</p>' : ''}
  `;

  container.querySelector('#fahrzeuge-suche').addEventListener('input', (event) => {
    fahrzeugeListeAnzeigen(container, event.target.value);
  });

  const neuButton = container.querySelector('#fahrzeug-neu-button');
  neuButton.addEventListener('click', () => {
    fahrzeugFormularAnzeigen(container, null, alleKunden);
  });

  for (const zeile of container.querySelectorAll('.tabelle-zeile')) {
    zeile.addEventListener('click', async (event) => {
      if (event.target.classList.contains('loeschen-button')) return;
      const fahrzeug = await DB.einesHolen('fahrzeuge', Number(zeile.dataset.id));
      fahrzeugFormularAnzeigen(container, fahrzeug, alleKunden);
    });
  }

  for (const button of container.querySelectorAll('.loeschen-button')) {
    button.addEventListener('click', async (event) => {
      event.stopPropagation();
      const id = Number(button.dataset.id);
      const fahrzeug = await DB.einesHolen('fahrzeuge', id);
      const bestaetigt = window.confirm(`Fahrzeug "${fahrzeug.kennzeichen || '(ohne Kennzeichen)'}" wirklich löschen?`);
      if (!bestaetigt) return;
      await DB.loeschen('fahrzeuge', id);
      fahrzeugeListeAnzeigen(container, suchbegriff);
    });
  }
}

function fahrzeugFormularAnzeigen(container, fahrzeug, alleKunden) {
  const istNeu = !fahrzeug;
  const daten = fahrzeug || fahrzeugLeererDatensatz();
  const kundenSortiert = [...alleKunden].sort((a, b) => kundeAnzeigename(a).localeCompare(kundeAnzeigename(b)));

  container.innerHTML = `
    <form id="fahrzeug-formular" class="formular">
      <label>Halter (Kunde)
        <select name="kundeId" required>
          <option value="">– bitte wählen –</option>
          ${kundenSortiert.map((k) => `
            <option value="${k.id}" ${daten.kundeId === k.id ? 'selected' : ''}>${escapeHtml(kundeAnzeigename(k))}</option>
          `).join('')}
        </select>
      </label>

      <div class="feld-nebeneinander">
        <label>Kennzeichen
          <input type="text" name="kennzeichen" value="${escapeHtml(daten.kennzeichen)}">
        </label>
        <label>Erstzulassung
          <input type="date" name="erstzulassung" value="${escapeHtml(daten.erstzulassung)}">
        </label>
      </div>

      <label>Fahrgestellnummer (VIN)
        <input type="text" name="vin" value="${escapeHtml(daten.vin)}">
      </label>

      <div class="feld-nebeneinander">
        <label>HSN
          <input type="text" name="hsn" value="${escapeHtml(daten.hsn)}">
        </label>
        <label>TSN
          <input type="text" name="tsn" value="${escapeHtml(daten.tsn)}">
        </label>
      </div>

      <div class="feld-nebeneinander">
        <label>Hersteller
          <input type="text" name="hersteller" value="${escapeHtml(daten.hersteller)}">
        </label>
        <label>Modell
          <input type="text" name="modell" value="${escapeHtml(daten.modell)}">
        </label>
      </div>

      <label>Kilometerstand (aktuell)
        <input type="number" name="kilometerstandAktuell" min="0" value="${escapeHtml(daten.kilometerstandAktuell)}">
      </label>

      <button type="submit">Speichern</button>
      <button type="button" id="fahrzeug-abbrechen-button">Abbrechen</button>
      <span id="fahrzeug-formular-status" class="status fehler"></span>
    </form>
  `;

  container.querySelector('#fahrzeug-abbrechen-button').addEventListener('click', () => {
    fahrzeugeListeAnzeigen(container);
  });

  container.querySelector('#fahrzeug-formular').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formDaten = new FormData(event.target);
    const kundeIdWert = formDaten.get('kundeId');
    const kilometerstandWert = formDaten.get('kilometerstandAktuell');

    const status = container.querySelector('#fahrzeug-formular-status');
    if (!kundeIdWert) {
      status.textContent = 'Bitte einen Kunden auswählen.';
      return;
    }
    const kennzeichen = formDaten.get('kennzeichen').trim();
    const vin = formDaten.get('vin').trim();
    if (!kennzeichen && !vin) {
      status.textContent = 'Bitte Kennzeichen oder Fahrgestellnummer eingeben.';
      return;
    }

    const neuesFahrzeug = {
      ...(istNeu ? {} : { id: daten.id }),
      kundeId: Number(kundeIdWert),
      kennzeichen,
      vin,
      hsn: formDaten.get('hsn').trim(),
      tsn: formDaten.get('tsn').trim(),
      hersteller: formDaten.get('hersteller').trim(),
      modell: formDaten.get('modell').trim(),
      erstzulassung: formDaten.get('erstzulassung'),
      kilometerstandAktuell: kilometerstandWert === '' ? '' : Number(kilometerstandWert)
    };

    await DB.speichern('fahrzeuge', neuesFahrzeug);
    fahrzeugeListeAnzeigen(container);
  });
}
