// teilekatalog.js
// Abstraktionsschicht für die Ersatzteilsuche. Das restliche Programm
// darf NIE direkt auf LokalerKatalog oder TecDocKatalog zugreifen,
// sondern immer nur über AKTIVER_KATALOG (siehe unten). So kann später
// mit TecDoc-Lizenz einfach die eine Zeile am Ende dieser Datei
// getauscht werden, ohne den Rest des Programms anzufassen.
//
// Interface "Teilekatalog" (informell, JS kennt keine echten Interfaces):
//   sucheNachFahrzeug(fahrzeug)      -> Promise<Array<Artikel>>
//   sucheNachArtikelnummer(nummer)   -> Promise<Array<Artikel>>
//   holeFahrzeugdaten(fahrzeug)      -> Promise<Object|null>

// Sucht nur im eigenen Teilestamm (DB-Store "artikel"). Kennt keine
// Fahrzeug-Teile-Zuordnung und keine externen Fahrzeugstammdaten -
// beides bräuchte TecDoc-Daten, die uns nicht vorliegen.
class LokalerKatalog {
  async sucheNachArtikelnummer(nummer) {
    const alleArtikel = await DB.alleHolen('artikel');
    const suchtext = nummer.trim().toLowerCase();
    return alleArtikel.filter((a) => (a.artikelnummer || '').toLowerCase().includes(suchtext));
  }

  async sucheNachFahrzeug(_fahrzeug) {
    // Lokaler Teilestamm hat keine Zuordnung "welches Teil passt in
    // welches Fahrzeug" - das ist genau die Funktion, die TecDoc liefern
    // würde. Deshalb bewusst leeres Ergebnis statt Rateversuch.
    return [];
  }

  async holeFahrzeugdaten(_fahrzeug) {
    // Keine externe Fahrzeugdatenbank vorhanden - es gibt nur das, was
    // im Fahrzeuge-Modul manuell erfasst wurde.
    return null;
  }
}

// Platzhalter für die spätere TecDoc-Anbindung (TecAlliance). Sobald eine
// Lizenz vorliegt, würden diese Methoden etwa so arbeiten:
//   - holeFahrzeugdaten(fahrzeug): aus VIN oder HSN/TSN die TecDoc-
//     KType-ID ermitteln und Fahrzeug-Stammdaten (Motor, Baujahr, ...)
//     von TecDoc laden.
//   - sucheNachFahrzeug(fahrzeug): mit der KType-ID die zum Fahrzeug
//     passenden Teile samt Herstellerreferenzen von TecDoc abfragen.
//   - sucheNachArtikelnummer(nummer): TecDoc-Artikelsuche über deren API.
// Ohne Lizenz/Zugangsdaten kann das nicht implementiert werden, deshalb
// werfen alle Methoden einen klaren Fehler statt erfundene Daten zu liefern.
class TecDocKatalog {
  async sucheNachArtikelnummer(_nummer) {
    throw new Error('TecDoc-Katalog ist nicht konfiguriert (keine Lizenz/Zugangsdaten hinterlegt).');
  }

  async sucheNachFahrzeug(_fahrzeug) {
    throw new Error('TecDoc-Katalog ist nicht konfiguriert (keine Lizenz/Zugangsdaten hinterlegt).');
  }

  async holeFahrzeugdaten(_fahrzeug) {
    throw new Error('TecDoc-Katalog ist nicht konfiguriert (keine Lizenz/Zugangsdaten hinterlegt).');
  }
}

// Zentrale Stelle, die festlegt, welcher Katalog aktiv ist. Für den
// Wechsel auf TecDoc genügt es, diese eine Zeile zu ändern.
const AKTIVER_KATALOG = new LokalerKatalog();
