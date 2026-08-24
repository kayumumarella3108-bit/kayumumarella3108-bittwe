/**
 * Helper utility to export array of objects or tabular data to CSV / Excel format
 */

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  // Format each cell: wrap with quotes if contains commas, quotes, or newlines
  const formatCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(formatCell).join(',');
  const rowLines = rows.map((row) => row.map(formatCell).join(','));

  // UTF-8 BOM so Excel opens indonesian characters / symbols cleanly
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
