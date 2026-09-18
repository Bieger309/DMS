// module-dashboard.js
// Startseite. Zeigt vorerst nur eine Begrüßung, später vielleicht eine
// kurze Übersicht (offene Aufträge, unbezahlte Rechnungen o.ä.).

function initDashboardModul(container) {
  container.innerHTML = `
    <p>Willkommen im Werkstatt-DMS. Wähle links ein Modul aus.</p>
    <p>Alle Daten liegen lokal in diesem Browser (IndexedDB). Unter
    „Einstellungen &amp; Backup" kannst du sie als Datei sichern.</p>
  `;
}
