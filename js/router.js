// router.js
// Einfache Navigation zwischen den Modulen über den URL-Hash (#kunden,
// #fahrzeuge, ...). Kein Framework, nur Ein-/Ausblenden von <section>-
// Elementen plus Aufruf der passenden Modul-init-Funktion.

const ROUTER_MODULE = {
  dashboard: { titel: 'Übersicht', init: initDashboardModul },
  kunden: { titel: 'Kunden', init: initKundenModul },
  fahrzeuge: { titel: 'Fahrzeuge', init: initFahrzeugeModul },
  teile: { titel: 'Teilestamm', init: initTeileModul },
  arbeitswerte: { titel: 'Arbeitswerte', init: initArbeitswerteModul },
  auftraege: { titel: 'Aufträge', init: initAuftraegeModul },
  rechnungen: { titel: 'Rechnungen', init: initRechnungenModul },
  einstellungen: { titel: 'Einstellungen & Backup', init: initEinstellungenModul }
};

function routerAktuelleRoute() {
  const hash = window.location.hash.replace('#', '');
  return ROUTER_MODULE[hash] ? hash : 'dashboard';
}

function routerAnzeigen() {
  const route = routerAktuelleRoute();
  const modul = ROUTER_MODULE[route];

  for (const link of document.querySelectorAll('.nav-link')) {
    link.classList.toggle('aktiv', link.dataset.route === route);
  }

  const inhalt = document.getElementById('inhalt');
  inhalt.innerHTML = '';

  const ueberschrift = document.createElement('h1');
  ueberschrift.textContent = modul.titel;
  inhalt.appendChild(ueberschrift);

  const container = document.createElement('div');
  container.id = 'modul-container';
  inhalt.appendChild(container);

  modul.init(container);
}

function routerStarten() {
  window.addEventListener('hashchange', routerAnzeigen);
  routerAnzeigen();
}
