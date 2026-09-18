// module-teile.js
// Teilestamm: eigene Artikelliste (Artikelnummer, Bezeichnung,
// Hersteller, EK, VK). Preise sind Bruttopreise, der MwSt-Satz steht
// zentral im Firmenprofil (Einstellungen).
//
// Das ist reine Stammdatenpflege (CRUD auf DB-Store "artikel") und
// bewusst getrennt vom Teilekatalog-Interface (teilekatalog.js), das
// später die Suche über Fahrzeugdaten/TecDoc übernimmt.

function artikelLeererDatensatz() {
  return { artikelnummer: '', bezeichnung: '', hersteller: '', ek: '', vk: '' };
}

function artikelSuchtreffer(artikel, suchbegriff) {
  const text = [artikel.artikelnummer, artikel.bezeichnung, artikel.hersteller]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(suchbegriff.toLowerCase());
}

function preisFormatieren(wert) {
  if (wert === '' || wert == null) return '';
  return Number(wert).toFixed(2) + ' €';
}

async function initTeileModul(container) {
  await teileListeAnzeigen(container);
}

async function teileListeAnzeigen(container, suchbegriff = '') {
  const alleArtikel = await DB.alleHolen('artikel');
  alleArtikel.sort((a, b) => (a.artikelnummer || '').localeCompare(b.artikelnummer || ''));

  const gefiltert = suchbegriff ? alleArtikel.filter((a) => artikelSuchtreffer(a, suchbegriff)) : alleArtikel;

  container.innerHTML = `
    <div class="werkzeugleiste">
      <input type="search" id="teile-suche" placeholder="Suchen nach Artikelnummer, Bezeichnung, Hersteller..." value="${escapeHtml(suchbegriff)}">
      <button id="artikel-neu-button">+ Neuer Artikel</button>
    </div>
    <table class="tabelle">
      <thead>
        <tr><th>Artikelnummer</th><th>Bezeichnung</th><th>Hersteller</th><th>EK</th><th>VK</th><th></th></tr>
      </thead>
      <tbody>
        ${gefiltert.map((a) => `
          <tr data-id="${a.id}" class="tabelle-zeile">
            <td>${escapeHtml(a.artikelnummer)}</td>
            <td>${escapeHtml(a.bezeichnung)}</td>
            <td>${escapeHtml(a.hersteller)}</td>
            <td>${preisFormatieren(a.ek)}</td>
            <td>${preisFormatieren(a.vk)}</td>
            <td><button class="loeschen-button" data-id="${a.id}" title="Löschen">✕</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${gefiltert.length === 0 ? '<p class="hinweis">Keine Artikel gefunden.</p>' : ''}
  `;

  container.querySelector('#teile-suche').addEventListener('input', (event) => {
    teileListeAnzeigen(container, event.target.value);
  });

  container.querySelector('#artikel-neu-button').addEventListener('click', () => {
    artikelFormularAnzeigen(container, null);
  });

  for (const zeile of container.querySelectorAll('.tabelle-zeile')) {
    zeile.addEventListener('click', async (event) => {
      if (event.target.classList.contains('loeschen-button')) return;
      const artikel = await DB.einesHolen('artikel', Number(zeile.dataset.id));
      artikelFormularAnzeigen(container, artikel);
    });
  }

  for (const button of container.querySelectorAll('.loeschen-button')) {
    button.addEventListener('click', async (event) => {
      event.stopPropagation();
      const id = Number(button.dataset.id);
      const artikel = await DB.einesHolen('artikel', id);
      const bestaetigt = window.confirm(`Artikel "${artikel.bezeichnung}" wirklich löschen?`);
      if (!bestaetigt) return;
      await DB.loeschen('artikel', id);
      teileListeAnzeigen(container, suchbegriff);
    });
  }
}

function artikelFormularAnzeigen(container, artikel) {
  const istNeu = !artikel;
  const daten = artikel || artikelLeererDatensatz();

  container.innerHTML = `
    <form id="artikel-formular" class="formular">
      <label>Artikelnummer
        <input type="text" name="artikelnummer" value="${escapeHtml(daten.artikelnummer)}">
      </label>
      <label>Bezeichnung
        <input type="text" name="bezeichnung" value="${escapeHtml(daten.bezeichnung)}">
      </label>
      <label>Hersteller
        <input type="text" name="hersteller" value="${escapeHtml(daten.hersteller)}">
      </label>
      <div class="feld-nebeneinander">
        <label>EK (brutto, €)
          <input type="number" name="ek" min="0" step="0.01" value="${escapeHtml(daten.ek)}">
        </label>
        <label>VK (brutto, €)
          <input type="number" name="vk" min="0" step="0.01" value="${escapeHtml(daten.vk)}">
        </label>
      </div>

      <button type="submit">Speichern</button>
      <button type="button" id="artikel-abbrechen-button">Abbrechen</button>
      <span id="artikel-formular-status" class="status fehler"></span>
    </form>
  `;

  container.querySelector('#artikel-abbrechen-button').addEventListener('click', () => {
    teileListeAnzeigen(container);
  });

  container.querySelector('#artikel-formular').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formDaten = new FormData(event.target);
    const status = container.querySelector('#artikel-formular-status');

    const artikelnummer = formDaten.get('artikelnummer').trim();
    const bezeichnung = formDaten.get('bezeichnung').trim();
    if (!artikelnummer || !bezeichnung) {
      status.textContent = 'Bitte Artikelnummer und Bezeichnung eingeben.';
      return;
    }

    const alleArtikel = await DB.alleHolen('artikel');
    const doppelteNummer = alleArtikel.some(
      (a) => a.artikelnummer.toLowerCase() === artikelnummer.toLowerCase() && a.id !== daten.id
    );
    if (doppelteNummer) {
      status.textContent = 'Diese Artikelnummer wird bereits verwendet.';
      return;
    }

    const ekWert = formDaten.get('ek');
    const vkWert = formDaten.get('vk');
    const neuerArtikel = {
      ...(istNeu ? {} : { id: daten.id }),
      artikelnummer,
      bezeichnung,
      hersteller: formDaten.get('hersteller').trim(),
      ek: ekWert === '' ? '' : Number(ekWert),
      vk: vkWert === '' ? '' : Number(vkWert)
    };

    await DB.speichern('artikel', neuerArtikel);
    teileListeAnzeigen(container);
  });
}
