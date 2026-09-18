// module-kunden.js
// Kundenverwaltung: Anlegen, Suchen, Bearbeiten. Privat- und Firmenkunden.

// Wird auch von anderen Modulen gebraucht (Fahrzeuge, Aufträge, ...),
// deshalb hier als globale Funktion statt versteckt im Modul.
function kundeAnzeigename(kunde) {
  if (kunde.typ === 'firma') {
    return kunde.firma || '(Firma ohne Namen)';
  }
  return [kunde.vorname, kunde.nachname].filter(Boolean).join(' ') || '(ohne Namen)';
}

function kundeLeererDatensatz() {
  return {
    typ: 'privat',
    firma: '',
    vorname: '',
    nachname: '',
    strasse: '',
    plz: '',
    ort: '',
    telefon: '',
    email: '',
    notizen: ''
  };
}

function kundeSuchtreffer(kunde, suchbegriff) {
  const text = [kunde.firma, kunde.vorname, kunde.nachname, kunde.ort, kunde.telefon, kunde.email]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(suchbegriff.toLowerCase());
}

async function initKundenModul(container) {
  await kundenListeAnzeigen(container);
}

async function kundenListeAnzeigen(container, suchbegriff = '') {
  const alleKunden = await DB.alleHolen('kunden');
  alleKunden.sort((a, b) => kundeAnzeigename(a).localeCompare(kundeAnzeigename(b)));

  const gefiltert = suchbegriff ? alleKunden.filter((k) => kundeSuchtreffer(k, suchbegriff)) : alleKunden;

  container.innerHTML = `
    <div class="werkzeugleiste">
      <input type="search" id="kunden-suche" placeholder="Suchen nach Name, Firma, Ort..." value="${escapeHtml(suchbegriff)}">
      <button id="kunde-neu-button">+ Neuer Kunde</button>
    </div>
    <table class="tabelle">
      <thead>
        <tr><th>Name</th><th>Typ</th><th>Ort</th><th>Telefon</th><th></th></tr>
      </thead>
      <tbody>
        ${gefiltert.map((k) => `
          <tr data-id="${k.id}" class="tabelle-zeile">
            <td>${escapeHtml(kundeAnzeigename(k))}</td>
            <td>${k.typ === 'firma' ? 'Firma' : 'Privat'}</td>
            <td>${escapeHtml(k.ort)}</td>
            <td>${escapeHtml(k.telefon)}</td>
            <td><button class="loeschen-button" data-id="${k.id}" title="Löschen">✕</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${gefiltert.length === 0 ? '<p class="hinweis">Keine Kunden gefunden.</p>' : ''}
  `;

  container.querySelector('#kunden-suche').addEventListener('input', (event) => {
    kundenListeAnzeigen(container, event.target.value);
  });

  container.querySelector('#kunde-neu-button').addEventListener('click', () => {
    kundeFormularAnzeigen(container, null);
  });

  for (const zeile of container.querySelectorAll('.tabelle-zeile')) {
    zeile.addEventListener('click', async (event) => {
      if (event.target.classList.contains('loeschen-button')) return;
      const kunde = await DB.einesHolen('kunden', Number(zeile.dataset.id));
      kundeFormularAnzeigen(container, kunde);
    });
  }

  for (const button of container.querySelectorAll('.loeschen-button')) {
    button.addEventListener('click', async (event) => {
      event.stopPropagation();
      const id = Number(button.dataset.id);
      const kunde = await DB.einesHolen('kunden', id);

      const alleFahrzeuge = await DB.alleHolen('fahrzeuge');
      const hatFahrzeuge = alleFahrzeuge.some((f) => f.kundeId === id);
      if (hatFahrzeuge) {
        window.alert(
          `Kunde "${kundeAnzeigename(kunde)}" hat noch Fahrzeuge zugeordnet. ` +
          'Bitte die Fahrzeuge zuerst löschen oder einem anderen Kunden zuordnen.'
        );
        return;
      }

      const bestaetigt = window.confirm(`Kunde "${kundeAnzeigename(kunde)}" wirklich löschen?`);
      if (!bestaetigt) return;
      await DB.loeschen('kunden', id);
      kundenListeAnzeigen(container, suchbegriff);
    });
  }
}

function kundeFormularAnzeigen(container, kunde) {
  const istNeu = !kunde;
  const daten = kunde || kundeLeererDatensatz();

  container.innerHTML = `
    <form id="kunden-formular" class="formular">
      <label>Kundentyp
        <select name="typ">
          <option value="privat" ${daten.typ === 'privat' ? 'selected' : ''}>Privatkunde</option>
          <option value="firma" ${daten.typ === 'firma' ? 'selected' : ''}>Firmenkunde</option>
        </select>
      </label>

      <div id="feld-firma">
        <label>Firmenname
          <input type="text" name="firma" value="${escapeHtml(daten.firma)}">
        </label>
      </div>

      <div id="feld-namen" class="feld-nebeneinander">
        <label>Vorname
          <input type="text" name="vorname" value="${escapeHtml(daten.vorname)}">
        </label>
        <label>Nachname
          <input type="text" name="nachname" value="${escapeHtml(daten.nachname)}">
        </label>
      </div>

      <label>Straße/Hausnummer
        <input type="text" name="strasse" value="${escapeHtml(daten.strasse)}">
      </label>
      <div class="feld-nebeneinander">
        <label>PLZ
          <input type="text" name="plz" value="${escapeHtml(daten.plz)}">
        </label>
        <label>Ort
          <input type="text" name="ort" value="${escapeHtml(daten.ort)}">
        </label>
      </div>
      <label>Telefon
        <input type="text" name="telefon" value="${escapeHtml(daten.telefon)}">
      </label>
      <label>E-Mail
        <input type="email" name="email" value="${escapeHtml(daten.email)}">
      </label>
      <label>Notizen
        <textarea name="notizen" rows="3">${escapeHtml(daten.notizen)}</textarea>
      </label>

      <button type="submit">Speichern</button>
      <button type="button" id="kunde-abbrechen-button">Abbrechen</button>
      <span id="kunden-formular-status" class="status fehler"></span>
    </form>
  `;

  function feldSichtbarkeitAktualisieren() {
    const typ = container.querySelector('select[name="typ"]').value;
    container.querySelector('#feld-firma').style.display = typ === 'firma' ? 'block' : 'none';
    container.querySelector('#feld-namen').style.display = typ === 'privat' ? 'flex' : 'none';
  }
  feldSichtbarkeitAktualisieren();
  container.querySelector('select[name="typ"]').addEventListener('change', feldSichtbarkeitAktualisieren);

  container.querySelector('#kunde-abbrechen-button').addEventListener('click', () => {
    kundenListeAnzeigen(container);
  });

  container.querySelector('#kunden-formular').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formDaten = new FormData(event.target);
    const typ = formDaten.get('typ');
    const neuerKunde = {
      ...(istNeu ? {} : { id: daten.id }),
      typ,
      firma: formDaten.get('firma').trim(),
      vorname: formDaten.get('vorname').trim(),
      nachname: formDaten.get('nachname').trim(),
      strasse: formDaten.get('strasse').trim(),
      plz: formDaten.get('plz').trim(),
      ort: formDaten.get('ort').trim(),
      telefon: formDaten.get('telefon').trim(),
      email: formDaten.get('email').trim(),
      notizen: formDaten.get('notizen').trim()
    };

    const status = container.querySelector('#kunden-formular-status');
    if (typ === 'firma' && !neuerKunde.firma) {
      status.textContent = 'Bitte Firmenname eingeben.';
      return;
    }
    if (typ === 'privat' && !neuerKunde.vorname && !neuerKunde.nachname) {
      status.textContent = 'Bitte Vor- oder Nachname eingeben.';
      return;
    }

    await DB.speichern('kunden', neuerKunde);
    kundenListeAnzeigen(container);
  });
}
