/**
 * Export to Excel (.xlsx). SheetJS is loaded only when someone exports.
 * Columns get a width that fits their content and the header row gets an autofilter.
 */
export async function downloadXlsx(fileName: string, sheet: string, head: string[], rows: (string | number)[][]) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([head, ...rows]);
  ws['!cols'] = head.map((h, i) => ({ wch: Math.min(60, Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length)) + 2) }));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: head.length - 1 } }) };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 31));
  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`, { compression: true });
}
