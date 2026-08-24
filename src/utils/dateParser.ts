/**
 * Utility untuk parsing dan formatting tanggal standar PLN
 * Mendukung format teks Indonesia (contoh: "6 Agustus 2026" -> "6/8/2026"),
 * ISO (YYYY-MM-DD), DD/MM/YYYY, DD-MM-YYYY, serta Excel date serials.
 */

const INDONESIAN_MONTHS: Record<string, number> = {
  januari: 1,
  jan: 1,
  februari: 2,
  pebruari: 2,
  feb: 2,
  maret: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  juni: 6,
  jun: 6,
  juli: 7,
  jul: 7,
  agustus: 8,
  agust: 8,
  agu: 8,
  ags: 8,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  oktober: 10,
  okt: 10,
  october: 10,
  oct: 10,
  november: 11,
  nopember: 11,
  nov: 11,
  desember: 12,
  des: 12,
  december: 12,
  dec: 12
};

const INDONESIAN_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export interface ParsedDateResult {
  year: number;
  month: number; // 1 - 12
  day: number;   // 1 - 31
  formattedDMY: string; // contoh: "6/8/2026"
  formattedIndonesian: string; // contoh: "6 Agustus 2026"
  isoDate: string; // contoh: "2026-08-06"
}

/**
 * Membaca dan mem-parsing berbagai format tanggal, termasuk:
 * - "6 Agustus 2026" -> { year: 2026, month: 8, day: 6, formattedDMY: "6/8/2026", isoDate: "2026-08-06" }
 * - "6/8/2026"
 * - "2026-08-06"
 * - Excel serial number
 * - JS Date object
 */
export function parseFlexibleDate(val: any): ParsedDateResult | null {
  if (val === undefined || val === null || val === '') return null;

  // 1. JS Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const year = val.getFullYear();
    const month = val.getMonth() + 1;
    const day = val.getDate();
    return buildResult(year, month, day);
  }

  // 2. Excel numeric serial number
  if (typeof val === 'number') {
    if (val > 1000) {
      try {
        const utcDays = val - 25569;
        const utcValue = utcDays * 86400;
        const dateInfo = new Date(utcValue * 1000);
        if (!isNaN(dateInfo.getTime())) {
          const year = dateInfo.getUTCFullYear();
          const month = dateInfo.getUTCMonth() + 1;
          const day = dateInfo.getUTCDate();
          return buildResult(year, month, day);
        }
      } catch {}
    }
  }

  const str = String(val).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str === '-' || str === '#n/a') {
    return null;
  }

  // 3. Format Teks Indonesia: "6 Agustus 2026" atau "06 Agustus 2026" atau "6-Agustus-2026" atau "6/Agustus/2026"
  const indoTextMatch = str.match(/^(\d{1,2})[\s\-/.]([a-zA-Z]+)[\s\-/.]([0-9]{2,4})$/);
  if (indoTextMatch) {
    const day = parseInt(indoTextMatch[1], 10);
    const monthStr = indoTextMatch[2].toLowerCase();
    let year = parseInt(indoTextMatch[3], 10);
    if (year < 100) year += 2000;

    const month = INDONESIAN_MONTHS[monthStr];
    if (month && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return buildResult(year, month, day);
    }
  }

  // 4. Regex ISO: YYYY-MM-DD atau YYYY/MM/DD atau YYYY.MM.DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return buildResult(year, month, day);
    }
  }

  // 5. Regex DD-MM-YYYY atau DD/MM/YYYY atau DD.MM.YYYY (e.g. 6/8/2026 or 06/08/2026)
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return buildResult(year, month, day);
    }
  }

  // 6. Regex DD-MM-YY atau DD/MM/YY
  const dmyShortMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (dmyShortMatch) {
    const day = parseInt(dmyShortMatch[1], 10);
    const month = parseInt(dmyShortMatch[2], 10);
    let year = parseInt(dmyShortMatch[3], 10);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return buildResult(year, month, day);
    }
  }

  // 7. Generic JS Date parsing fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = parsed.getMonth() + 1;
    const day = parsed.getDate();
    if (year >= 1900 && year <= 2100) {
      return buildResult(year, month, day);
    }
  }

  return null;
}

function buildResult(year: number, month: number, day: number): ParsedDateResult {
  const padM = String(month).padStart(2, '0');
  const padD = String(day).padStart(2, '0');
  const monthName = INDONESIAN_MONTH_NAMES[month - 1] || `Bulan-${month}`;

  return {
    year,
    month,
    day,
    formattedDMY: `${day}/${month}/${year}`,
    formattedIndonesian: `${day} ${monthName} ${year}`,
    isoDate: `${year}-${padM}-${padD}`
  };
}

/**
 * Mengubah input tanggal apapun menjadi format D/M/YYYY (contoh: "6/8/2026")
 */
export function formatDateToDMY(val: any, fallback = '-'): string {
  const res = parseFlexibleDate(val);
  return res ? res.formattedDMY : fallback;
}

/**
 * Mengubah input tanggal apapun menjadi format Teks Indonesia (contoh: "6 Agustus 2026")
 */
export function formatDateToIndonesian(val: any, fallback = '-'): string {
  const res = parseFlexibleDate(val);
  return res ? res.formattedIndonesian : fallback;
}

/**
 * Mengubah input tanggal menjadi ISO string YYYY-MM-DD untuk <input type="date">
 */
export function formatDateToISO(val: any): string {
  const res = parseFlexibleDate(val);
  if (res) return res.isoDate;
  return new Date().toISOString().split('T')[0];
}
