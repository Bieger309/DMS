// app.js
// Startpunkt: öffnet die Datenbank und startet danach den Router.

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await DB.oeffnen();
    routerStarten();
  } catch (fehler) {
    document.getElementById('inhalt').innerHTML =
      '<p class="fehler">Datenbank konnte nicht geöffnet werden: ' + fehler.message + '</p>';
    console.error(fehler);
  }
});
