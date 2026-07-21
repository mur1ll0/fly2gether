/**
 * Formata datas no padrão brasileiro (DD/MM/YYYY)
 * @param {string} dateStr - Data no formato YYYY-MM-DD
 */
export function formatToBrazillianDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
