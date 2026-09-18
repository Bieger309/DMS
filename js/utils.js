// utils.js
// Kleine Hilfsfunktionen, die von mehreren Modulen gebraucht werden.

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}
