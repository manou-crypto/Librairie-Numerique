/**
 * Utilitaire universel d'exportation au format CSV
 * Compatible avec Excel (BOM UTF-8, séparateur point-virgule, échappement RFC 4180)
 */

export interface ExportCSVOptions {
  filename: string;
  headers: string[];
  data: (string | number | boolean | null | undefined)[][];
}

export function exportToCSV({ filename, headers, data }: ExportCSVOptions): boolean {
  if (!data || data.length === 0) {
    return false;
  }

  // Échappement CSV standard
  const formatCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(formatCell).join(';');
  const contentRows = data.map((row) => row.map(formatCell).join(';'));
  const csvContent = '\ufeff' + [headerRow, ...contentRows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);

  const cleanFilename = filename.toLowerCase().endsWith('.csv')
    ? filename
    : `${filename}_${new Date().toISOString().split('T')[0]}.csv`;

  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
