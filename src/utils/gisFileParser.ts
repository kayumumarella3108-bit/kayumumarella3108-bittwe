import JSZip from 'jszip';
import { PohonGisItem, KonstruksiGisItem } from '../types';

export interface RawGisFeature {
  name: string;
  description?: string;
  lat: number;
  lng: number;
  coordinates?: [number, number][]; // for lines/polygons
  properties: Record<string, any>;
}

export interface GisValidationReport {
  isValid: boolean;
  fileType: 'kml' | 'kmz' | 'geojson' | 'csv' | 'unknown';
  fileName: string;
  totalItems: number;
  validCount: number;
  invalidCount: number;
  detectedHeaders?: string[];
  missingRequiredColumns?: string[];
  features: RawGisFeature[];
  errors: string[];
  warnings: string[];
  rowErrors?: { row: number; reason: string; sample?: string }[];
}

// Clean and extract string text from XML node
function getNodeText(parent: Element, tag: string): string {
  const node = parent.getElementsByTagName(tag)[0];
  return node ? (node.textContent || '').trim() : '';
}

// Strip HTML tags, MapMarker XML metadata, and unwanted distance suffixes
export function sanitizeGisText(text: string): string {
  if (!text) return '';
  let cleaned = text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/com\.exlyo\.mapmarker[^\s]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

// Extract extended data attributes from KML Placemark
function extractExtendedData(placemark: Element): Record<string, string> {
  const props: Record<string, string> = {};
  const dataNodes = placemark.getElementsByTagName('Data');
  for (let i = 0; i < dataNodes.length; i++) {
    const d = dataNodes[i];
    const name = d.getAttribute('name') || '';
    const val = sanitizeGisText(getNodeText(d, 'value'));
    if (name) props[name.toLowerCase()] = val;
  }
  const simpleNodes = placemark.getElementsByTagName('SimpleData');
  for (let i = 0; i < simpleNodes.length; i++) {
    const d = simpleNodes[i];
    const name = d.getAttribute('name') || '';
    const val = sanitizeGisText(d.textContent || '');
    if (name) props[name.toLowerCase()] = val;
  }
  return props;
}

// Validate and parse KML text
export function validateAndParseKml(kmlText: string, fileName = 'file.kml'): GisValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const features: RawGisFeature[] = [];
  const rowErrors: { row: number; reason: string; sample?: string }[] = [];

  if (!kmlText || kmlText.trim().length === 0) {
    return {
      isValid: false,
      fileType: 'kml',
      fileName,
      totalItems: 0,
      validCount: 0,
      invalidCount: 0,
      features: [],
      errors: ['File KML kosong atau tidak memiliki konten.'],
      warnings: []
    };
  }

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
    
    // Check for XML parsing errors
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError && parserError.length > 0) {
      errors.push('Struktur XML dokumen KML rusak atau tidak sesuai standar XML.');
      return {
        isValid: false,
        fileType: 'kml',
        fileName,
        totalItems: 0,
        validCount: 0,
        invalidCount: 0,
        features: [],
        errors,
        warnings
      };
    }

    const placemarks = xmlDoc.getElementsByTagName('Placemark');
    if (placemarks.length === 0) {
      errors.push('Tidak ditemukan elemen <Placemark> (titik penanda GIS) pada file KML ini.');
      return {
        isValid: false,
        fileType: 'kml',
        fileName,
        totalItems: 0,
        validCount: 0,
        invalidCount: 0,
        features: [],
        errors,
        warnings
      };
    }

    let invalidCount = 0;

    for (let i = 0; i < placemarks.length; i++) {
      const p = placemarks[i];
      const name = getNodeText(p, 'name') || `Titik ${i + 1}`;
      const desc = getNodeText(p, 'description');
      const extProps = extractExtendedData(p);

      const coordNode = p.getElementsByTagName('coordinates')[0];
      if (!coordNode || !coordNode.textContent || coordNode.textContent.trim() === '') {
        invalidCount++;
        rowErrors.push({
          row: i + 1,
          reason: 'Tag <coordinates> tidak ditemukan atau kosong',
          sample: name
        });
        continue;
      }

      const rawCoords = coordNode.textContent.trim().split(/\s+/);
      const parsedCoords: [number, number][] = [];

      for (const item of rawCoords) {
        const parts = item.split(',');
        if (parts.length >= 2) {
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            parsedCoords.push([lat, lng]);
          }
        }
      }

      if (parsedCoords.length > 0) {
        features.push({
          name,
          description: desc,
          lat: parsedCoords[0][0],
          lng: parsedCoords[0][1],
          coordinates: parsedCoords.length > 1 ? parsedCoords : undefined,
          properties: extProps
        });
      } else {
        invalidCount++;
        rowErrors.push({
          row: i + 1,
          reason: 'Koordinat tidak berada dalam rentang Latitude (-90..90) dan Longitude (-180..180)',
          sample: `${name}: ${coordNode.textContent.substring(0, 30)}`
        });
      }
    }

    if (features.length === 0) {
      errors.push('Tidak ditemukan koordinat geografis yang valid pada seluruh elemen Placemark.');
      return {
        isValid: false,
        fileType: 'kml',
        fileName,
        totalItems: placemarks.length,
        validCount: 0,
        invalidCount,
        features: [],
        errors,
        warnings,
        rowErrors
      };
    }

    if (invalidCount > 0) {
      warnings.push(`Ditemukan ${invalidCount} elemen Placemark tanpa koordinat valid yang dilewati.`);
    }

    return {
      isValid: true,
      fileType: 'kml',
      fileName,
      totalItems: placemarks.length,
      validCount: features.length,
      invalidCount,
      features,
      errors: [],
      warnings,
      rowErrors: rowErrors.length > 0 ? rowErrors : undefined
    };
  } catch (err: any) {
    return {
      isValid: false,
      fileType: 'kml',
      fileName,
      totalItems: 0,
      validCount: 0,
      invalidCount: 0,
      features: [],
      errors: [`Gagal memproses file KML: ${err.message || 'Format tidak valid'}`],
      warnings: []
    };
  }
}

// Parse KML text into raw GIS features
export function parseKmlFeatures(kmlText: string): RawGisFeature[] {
  return validateAndParseKml(kmlText).features;
}

// Validate and parse GeoJSON text
export function validateAndParseGeoJson(jsonText: string, fileName = 'file.geojson'): GisValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const features: RawGisFeature[] = [];
  const rowErrors: { row: number; reason: string; sample?: string }[] = [];

  if (!jsonText || jsonText.trim().length === 0) {
    return {
      isValid: false,
      fileType: 'geojson',
      fileName,
      totalItems: 0,
      validCount: 0,
      invalidCount: 0,
      features: [],
      errors: ['File GeoJSON kosong atau tidak memiliki konten.'],
      warnings: []
    };
  }

  try {
    let data: any;
    try {
      data = JSON.parse(jsonText);
    } catch (parseErr: any) {
      return {
        isValid: false,
        fileType: 'geojson',
        fileName,
        totalItems: 0,
        validCount: 0,
        invalidCount: 0,
        features: [],
        errors: [`Format JSON tidak valid atau struktur rusak: ${parseErr.message}`],
        warnings: []
      };
    }

    const rawList = data.type === 'FeatureCollection' && Array.isArray(data.features) 
      ? data.features 
      : (Array.isArray(data) ? data : (data.geometry || data.coordinates ? [data] : []));

    if (rawList.length === 0) {
      return {
        isValid: false,
        fileType: 'geojson',
        fileName,
        totalItems: 0,
        validCount: 0,
        invalidCount: 0,
        features: [],
        errors: ['File GeoJSON tidak memiliki kumpulan fitur (FeatureCollection / features array).'],
        warnings: []
      };
    }

    let invalidCount = 0;

    for (let i = 0; i < rawList.length; i++) {
      const feat = rawList[i];
      const geom = feat?.geometry || feat;
      const props = feat?.properties || {};
      const name = props.name || props.Nama || props.lokasi || props.title || props.notiang || `Titik ${i + 1}`;

      if (!geom || !geom.coordinates || !Array.isArray(geom.coordinates)) {
        invalidCount++;
        rowErrors.push({
          row: i + 1,
          reason: 'Objek tidak memiliki atribut geometry / coordinates yang valid',
          sample: name
        });
        continue;
      }

      if (geom.type === 'Point') {
        const lng = Number(geom.coordinates[0]);
        const lat = Number(geom.coordinates[1]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          features.push({
            name,
            lat,
            lng,
            properties: props
          });
        } else {
          invalidCount++;
          rowErrors.push({
            row: i + 1,
            reason: `Koordinat [${geom.coordinates[0]}, ${geom.coordinates[1]}] tidak valid`,
            sample: name
          });
        }
      } else if (geom.type === 'LineString' || geom.type === 'MultiPoint') {
        const coords: [number, number][] = [];
        for (const pt of geom.coordinates) {
          if (Array.isArray(pt) && pt.length >= 2) {
            const lng = Number(pt[0]);
            const lat = Number(pt[1]);
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              coords.push([lat, lng]);
            }
          }
        }
        if (coords.length > 0) {
          features.push({
            name,
            lat: coords[0][0],
            lng: coords[0][1],
            coordinates: coords,
            properties: props
          });
        } else {
          invalidCount++;
          rowErrors.push({
            row: i + 1,
            reason: 'Kumpulan koordinat line/multipoint tidak valid',
            sample: name
          });
        }
      } else {
        invalidCount++;
        rowErrors.push({
          row: i + 1,
          reason: `Tipe geometri '${geom.type}' tidak didukung untuk titik pohon (gunakan Point)`,
          sample: name
        });
      }
    }

    if (features.length === 0) {
      return {
        isValid: false,
        fileType: 'geojson',
        fileName,
        totalItems: rawList.length,
        validCount: 0,
        invalidCount,
        features: [],
        errors: ['Tidak ditemukan fitur dengan koordinat Point [longitude, latitude] yang valid dalam file GeoJSON.'],
        warnings,
        rowErrors
      };
    }

    if (invalidCount > 0) {
      warnings.push(`Ditemukan ${invalidCount} fitur tanpa koordinat Point valid yang dilewati.`);
    }

    return {
      isValid: true,
      fileType: 'geojson',
      fileName,
      totalItems: rawList.length,
      validCount: features.length,
      invalidCount,
      features,
      errors: [],
      warnings,
      rowErrors: rowErrors.length > 0 ? rowErrors : undefined
    };
  } catch (err: any) {
    return {
      isValid: false,
      fileType: 'geojson',
      fileName,
      totalItems: 0,
      validCount: 0,
      invalidCount: 0,
      features: [],
      errors: [`Gagal memproses file GeoJSON: ${err.message || 'Format tidak valid'}`],
      warnings: []
    };
  }
}

// Parse GeoJSON text into raw GIS features
export function parseGeoJsonFeatures(jsonText: string): RawGisFeature[] {
  return validateAndParseGeoJson(jsonText).features;
}

// Validate and parse CSV / Excel text
export function validateAndParseCsv(csvText: string, fileName = 'file.csv'): GisValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const features: RawGisFeature[] = [];
  const rowErrors: { row: number; reason: string; sample?: string }[] = [];
  const missingRequiredColumns: string[] = [];

  if (!csvText || csvText.trim().length === 0) {
    return {
      isValid: false,
      fileType: 'csv',
      fileName,
      totalItems: 0,
      validCount: 0,
      invalidCount: 0,
      features: [],
      errors: ['File CSV kosong (0 Byte). Silakan unggah file dengan data.'],
      warnings: []
    };
  }

  try {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) {
      return {
        isValid: false,
        fileType: 'csv',
        fileName,
        totalItems: lines.length,
        validCount: 0,
        invalidCount: 0,
        features: [],
        errors: ['File CSV tidak memiliki baris data (minimal 1 baris header dan 1 baris data).'],
        warnings: []
      };
    }

    // Detect delimiter (, or ; or \t)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let insideQuote = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === delimiter && !insideQuote) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const rawHeaders = parseRow(firstLine);
    const headers = rawHeaders.map((h) => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''));

    // Check for Coordinate headers
    let latIdx = headers.findIndex((h) => ['lat', 'latitude', 'lintang', 'y', 'koordinaty'].includes(h));
    let lngIdx = headers.findIndex((h) => ['lng', 'lon', 'long', 'longitude', 'bujur', 'x', 'koordinatx'].includes(h));
    const nameIdx = headers.findIndex((h) => ['name', 'nama', 'jenispohon', 'namaproyek', 'judul', 'lokasi', 'notiang'].includes(h));

    if (latIdx === -1) {
      latIdx = headers.findIndex((h) => h.includes('lat') || h.includes('lintang'));
    }
    if (lngIdx === -1) {
      lngIdx = headers.findIndex((h) => h.includes('lng') || h.includes('lon') || h.includes('bujur') || h.includes('long'));
    }

    // Strict validation of required column headers
    if (latIdx === -1) {
      missingRequiredColumns.push('Latitude (lat / latitude / lintang)');
    }
    if (lngIdx === -1) {
      missingRequiredColumns.push('Longitude (lng / longitude / bujur)');
    }

    if (missingRequiredColumns.length > 0) {
      const headerList = rawHeaders.filter(Boolean).join(', ') || 'tidak terdeteksi';
      errors.push(
        `Kolom koordinat wajib tidak ditemukan pada baris header file CSV: ${missingRequiredColumns.join(' & ')}.`
      );
      errors.push(
        `Kolom yang terdeteksi pada file: [${headerList}]. Format yang dibutuhkan minimal memiliki kolom 'lat' (Latitude) dan 'lng' (Longitude), serta dianjurkan 'penyulang', 'notiang', 'jenispohon', 'lokasi'.`
      );

      return {
        isValid: false,
        fileType: 'csv',
        fileName,
        totalItems: lines.length - 1,
        validCount: 0,
        invalidCount: lines.length - 1,
        detectedHeaders: rawHeaders.filter(Boolean),
        missingRequiredColumns,
        features: [],
        errors,
        warnings
      };
    }

    let invalidCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cells = parseRow(lines[i]);
      if (cells.length <= 1 || (cells.length === 1 && !cells[0])) continue;

      const props: Record<string, any> = {};
      headers.forEach((h, idx) => {
        if (cells[idx] !== undefined) props[h] = cells[idx];
      });

      const rawLatStr = cells[latIdx] || '';
      const rawLngStr = cells[lngIdx] || '';

      let lat = parseFloat(rawLatStr.replace(',', '.'));
      let lng = parseFloat(rawLngStr.replace(',', '.'));

      // Fallback search in cells if coords in specific format
      if (isNaN(lat) || isNaN(lng)) {
        for (const cell of cells) {
          const num = parseFloat((cell || '').replace(',', '.'));
          if (!isNaN(num)) {
            if (num >= -10 && num <= 10 && isNaN(lat)) lat = num;
            else if (num >= 90 && num <= 145 && isNaN(lng)) lng = num;
          }
        }
      }

      // Check validity range
      const isLatValid = !isNaN(lat) && lat >= -90 && lat <= 90;
      const isLngValid = !isNaN(lng) && lng >= -180 && lng <= 180;

      if (isLatValid && isLngValid) {
        const name = nameIdx !== -1 && cells[nameIdx] ? cells[nameIdx] : `Titik Baris ${i + 1}`;
        features.push({
          name,
          lat,
          lng,
          properties: props
        });
      } else {
        invalidCount++;
        rowErrors.push({
          row: i + 1,
          reason: `Nilai koordinat tidak valid (Latitude: '${rawLatStr || 'kosong'}', Longitude: '${rawLngStr || 'kosong'}')`,
          sample: cells.slice(0, 4).join(' | ')
        });
      }
    }

    if (features.length === 0) {
      errors.push('Tidak ada baris data dengan nilai koordinat Latitude dan Longitude yang valid.');
      return {
        isValid: false,
        fileType: 'csv',
        fileName,
        totalItems: lines.length - 1,
        validCount: 0,
        invalidCount,
        detectedHeaders: rawHeaders.filter(Boolean),
        missingRequiredColumns: [],
        features: [],
        errors,
        warnings,
        rowErrors
      };
    }

    if (invalidCount > 0) {
      warnings.push(`Ditemukan ${invalidCount} baris data dengan format koordinat tidak valid yang dilewati secara otomatis.`);
    }

    // Regional Maluku / Indonesia Coordinate check
    const hasFarCoords = features.some((f) => f.lat > 10 || f.lat < -15 || f.lng < 95 || f.lng > 145);
    if (hasFarCoords) {
      warnings.push('Sebagian titik koordinat terdeteksi berada di luar wilayah regional Indonesia/Maluku. Pastikan urutan kolom Latitude dan Longitude tidak tertukar.');
    }

    return {
      isValid: true,
      fileType: 'csv',
      fileName,
      totalItems: lines.length - 1,
      validCount: features.length,
      invalidCount,
      detectedHeaders: rawHeaders.filter(Boolean),
      missingRequiredColumns: [],
      features,
      errors: [],
      warnings,
      rowErrors: rowErrors.length > 0 ? rowErrors : undefined
    };
  } catch (err: any) {
    return {
      isValid: false,
      fileType: 'csv',
      fileName,
      totalItems: 0,
      validCount: 0,
      invalidCount: 0,
      features: [],
      errors: [`Gagal memproses file CSV: ${err.message || 'Format tidak didukung'}`],
      warnings: []
    };
  }
}

// Parse CSV / TSV text
export function parseCsvFeatures(csvText: string): RawGisFeature[] {
  return validateAndParseCsv(csvText).features;
}

// Convert Raw features to PohonGisItem
export function convertToPohonItems(
  features: RawGisFeature[],
  defaultPenyulang = 'PASSO',
  defaultIconType: PohonGisItem['iconType'] = 'pohon',
  validPenyulangs: string[] = []
): PohonGisItem[] {
  const masterFeeders = (validPenyulangs && validPenyulangs.length > 0)
    ? validPenyulangs.filter(Boolean)
    : ['PASSO', 'WAIHERU', 'HUTUMURI', 'LATERI', 'TIAL', 'SULI', 'KARPAN', 'RIJALI', 'TANTUI', 'AMBON'];

  return features.map((feat, idx) => {
    const p = feat.properties || {};
    
    const cleanName = sanitizeGisText(feat.name || '');
    const cleanDesc = sanitizeGisText(feat.description || '');

    // Penyulang detection formatted strictly against master data penyulang
    let rawPenyulang = sanitizeGisText(p.penyulang || p.feeder || '');
    const matchedMaster = masterFeeders.find(
      (feeder) => feeder && rawPenyulang && String(feeder).toUpperCase() === String(rawPenyulang).toUpperCase()
    );

    if (matchedMaster) {
      rawPenyulang = matchedMaster;
    } else {
      const upperName = (cleanName || '').toUpperCase();
      const upperDesc = (cleanDesc || '').toUpperCase();
      const detectedFeeder = masterFeeders.find(
        (feeder) => feeder && (upperName.includes(String(feeder).toUpperCase()) || upperDesc.includes(String(feeder).toUpperCase()))
      );
      rawPenyulang = detectedFeeder || defaultPenyulang || 'PASSO';
    }

    // No Tiang / Span detection (e.g. TG-23, TG 14, SPAN 02, etc.)
    let rawNoTiang = sanitizeGisText(p.notiangorspan || p.notiang || p.tiang || '');
    if (!rawNoTiang) {
      const tiangMatch = cleanName.match(/(?:TG|TIANG|SPAN|POLE|T)[\s\-_.:]*([0-9A-Za-z\-_/]+)/i);
      if (tiangMatch && tiangMatch[0]) {
        rawNoTiang = String(tiangMatch[0]).toUpperCase().replace(/\s+/g, '-');
      } else {
        rawNoTiang = `TG-${idx + 1}`;
      }
    }

    // Jenis Pohon: strip tiang prefix, feeder names, and distance annotations (e.g., "0,5m", "1m", "< 1 meter")
    let rawJenisPohon = sanitizeGisText(p.jenispohon || p.pohon || '');
    if (!rawJenisPohon) {
      let tempName = cleanName
        .replace(/(?:TG|TIANG|SPAN|POLE|T)[\s\-_.:]*([0-9A-Za-z\-_/]+)/gi, '')
        .replace(/\b(?:PASSO|WAIHERU|HUTUMURI|LATERI|TIAL|SULI|KARPAN|RIJALI|TANTUI)\b/gi, '')
        .replace(/\b[0-9]+[.,]?[0-9]*\s*(?:meter|m|cm)\b/gi, '')
        .replace(/[.,\-_/:]+$/, '')
        .replace(/^[.,\-_/:]+/, '')
        .trim();
      rawJenisPohon = tempName || 'Pohon Vegetasi';
    }

    // Further sanitize jenis pohon: strip lingering distance suffixes
    rawJenisPohon = rawJenisPohon
      .replace(/\b[0-9]+[.,]?[0-9]*\s*(?:meter|m|cm)\b/gi, '')
      .replace(/[.,\-_/:\s]+$/, '')
      .trim() || 'Pohon / Ranting Vegetasi';

    // Auto-detect icon type if not explicitly overridden
    let detectedIcon: PohonGisItem['iconType'] = defaultIconType || 'pohon';
    const lowerName = `${rawJenisPohon} ${cleanName}`.toLowerCase();
    if (lowerName.includes('kelapa') || lowerName.includes('palem') || lowerName.includes('sawit')) {
      detectedIcon = 'kelapa';
    } else if (lowerName.includes('bambu') || lowerName.includes('semak') || lowerName.includes('ranting')) {
      detectedIcon = 'bambu';
    } else if (lowerName.includes('kritis') || lowerName.includes('bahaya') || lowerName.includes('tumbang') || lowerName.includes('roboh')) {
      detectedIcon = 'warning';
    } else if (lowerName.includes('potong') || lowerName.includes('tebang') || lowerName.includes('pangkas')) {
      detectedIcon = 'saw';
    }

    // Lokasi: clean description or default location
    let rawLokasi = sanitizeGisText(p.lokasi || p.alamat || '');
    if (!rawLokasi) {
      if (cleanDesc && cleanDesc.length > 3 && !cleanDesc.includes('com.exlyo')) {
        rawLokasi = cleanDesc.replace(/<[^>]+>/g, '').trim();
      } else {
        rawLokasi = `Jalur 20kV ${rawPenyulang} (${rawNoTiang})`;
      }
    }

    const rawJumlah = parseInt(p.jumlahpohon || p.jumlah || '1') || 1;

    // Tingkat bahaya detection
    let bahaya: PohonGisItem['tingkatBahaya'] = 'Kritis (Bahaya Padam)';
    const combinedText = `${cleanName} ${cleanDesc} ${JSON.stringify(p)}`.toLowerCase();
    if (combinedText.includes('aman') || combinedText.includes('terpangkas') || combinedText.includes('bersih')) {
      bahaya = 'Aman / Terpangkas';
    } else if (combinedText.includes('roboh') || combinedText.includes('condong') || combinedText.includes('tumbang')) {
      bahaya = 'Potensi Roboh';
    } else if (combinedText.includes('rawan') || combinedText.includes('waspada') || combinedText.includes('sedang')) {
      bahaya = 'Rawan Sentuh';
    }

    // Status eksekusi
    let status: PohonGisItem['statusEksekusi'] = 'Perlu Tebas';
    if (bahaya === 'Aman / Terpangkas' || combinedText.includes('selesai')) {
      status = 'Selesai Pangkas';
    } else if (combinedText.includes('izin') || combinedText.includes('warga') || combinedText.includes('masyarakat')) {
      status = 'Perlu Izin Warga';
    } else if (combinedText.includes('padam') || combinedText.includes('jtm')) {
      status = 'Perlu Padam';
    } else if (combinedText.includes('tebang') || combinedText.includes('potong besar')) {
      status = 'Perlu Tebang';
    }

    return {
      id: `pohon-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      penyulang: rawPenyulang,
      section: sanitizeGisText(p.section || p.seksi || ''),
      noTiangOrSpan: rawNoTiang,
      lokasi: rawLokasi,
      lat: feat.lat,
      lng: feat.lng,
      jarakKeJaringan: '< 1 meter',
      tingkatBahaya: bahaya,
      statusEksekusi: status,
      jenisPohon: rawJenisPohon,
      jumlahPohon: rawJumlah,
      iconType: detectedIcon,
      tglTemuan: p.tgltemuan || new Date().toISOString().split('T')[0],
      tglEksekusi: p.tgleksekusi || (status === 'Selesai Pangkas' ? new Date().toISOString().split('T')[0] : undefined),
      pelaksana: p.pelaksana || 'Tim ROW ULP Baguala',
      keterangan: cleanDesc ? `Catatan: ${cleanDesc}` : `Titik pohon ${rawJenisPohon} di ${rawNoTiang}`
    };
  });
}

// Convert Raw features to KonstruksiGisItem
export function convertToKonstruksiItems(
  features: RawGisFeature[],
  defaultPenyulang = 'PASSO'
): KonstruksiGisItem[] {
  return features.map((feat, idx) => {
    const p = feat.properties;
    const rawNamaProyek = p.namaproyek || p.judul || p.temuan || p.proyek || feat.name || `Temuan Konstruksi JTM ${defaultPenyulang}`;
    const rawSpk = p.nomorspk || p.nospk || p.nolaporan || p.spk || `INSP/KNST/${new Date().getFullYear()}/${Math.floor(Math.random() * 800 + 100)}`;
    const rawNoTiang = p.notiang || p.tiang || p.gardu || p.nogardu || `TG-${Math.floor(Math.random() * 80 + 10)}`;
    const rawPenyulang = p.penyulang || p.feeder || defaultPenyulang;
    const rawLokasi = p.lokasi || p.alamat || feat.description || `Jalur 20kV ${rawPenyulang}`;

    // Kategori Deteksi
    const combinedText = `${rawNamaProyek} ${feat.description || ''} ${JSON.stringify(p)}`.toLowerCase();
    let kategori: KonstruksiGisItem['kategoriKonstruksi'] = 'TRAVERS / Cross Arm';

    if (combinedText.includes('travers') || combinedText.includes('cross arm') || combinedText.includes('crossarm') || combinedText.includes('arm tie')) {
      kategori = 'TRAVERS / Cross Arm';
    } else if (combinedText.includes('beugel') || combinedText.includes('bugel') || combinedText.includes('baut') || combinedText.includes('guy wire') || combinedText.includes('trekschoor') || combinedText.includes('skur')) {
      kategori = 'BEUGEL & Aksesoris Tiang';
    } else if (combinedText.includes('gardu') || combinedText.includes('gtt') || combinedText.includes('trafo') || combinedText.includes('phb-tr') || combinedText.includes('phb tr') || combinedText.includes('bushing')) {
      kategori = 'GARDU DISTRIBUSI & GTT';
    } else if (combinedText.includes('kabel') || combinedText.includes('konduktor') || combinedText.includes('jumper') || combinedText.includes('cco') || combinedText.includes('rantas') || combinedText.includes('andongan') || combinedText.includes('a3c') || combinedText.includes('aaac')) {
      kategori = 'KABEL, Konduktor & Jumper';
    } else if (combinedText.includes('isolator') || combinedText.includes('arrester') || combinedText.includes('la') || combinedText.includes('flashover') || combinedText.includes('pin post')) {
      kategori = 'ISOLATOR & Arrester';
    } else if (combinedText.includes('tiang') || combinedText.includes('miring') || combinedText.includes('pondasi') || combinedText.includes('ambles') || combinedText.includes('retak')) {
      kategori = 'TIANG DISTRIBUSI';
    } else if (combinedText.includes('lbs') || combinedText.includes('fco') || combinedText.includes('cut out') || combinedText.includes('recloser') || combinedText.includes('ds') || combinedText.includes('saklar')) {
      kategori = 'PERALATAN HUBUNG (LBS/FCO/DS)';
    } else if (combinedText.includes('grounding') || combinedText.includes('pembumian') || combinedText.includes('animal guard') || combinedText.includes('anti climbing') || combinedText.includes('penghalang panjat')) {
      kategori = 'GROUNDING & Animal Guard';
    } else {
      kategori = 'MATERIAL / Konstruksi Lainnya';
    }

    // Tingkat Bahaya Detection
    let bahaya: KonstruksiGisItem['tingkatBahaya'] = 'Tinggi (Perlu Tindak Lanjut Cepat)';
    if (combinedText.includes('kritis') || combinedText.includes('segera') || combinedText.includes('padam') || combinedText.includes('putus') || combinedText.includes('patah') || combinedText.includes('meledak') || combinedText.includes('terbakar')) {
      bahaya = 'Kritis (Potensi Gangguan Segera)';
    } else if (combinedText.includes('sedang') || combinedText.includes('terjadwal') || combinedText.includes('berkala')) {
      bahaya = 'Sedang (Perbaikan Terjadwal)';
    } else if (combinedText.includes('ringan') || combinedText.includes('monitoring') || combinedText.includes('aman')) {
      bahaya = 'Ringan (Monitoring)';
    }

    // Status & Progres
    let status: KonstruksiGisItem['statusProyek'] = 'Sedang Dikerjakan';
    let progres = parseInt(p.progres || p.progrespersen || '40') || 40;
    if (combinedText.includes('selesai') || combinedText.includes('tuntas') || progres === 100) {
      status = 'Selesai Diperbaiki';
      progres = 100;
    } else if (combinedText.includes('belum') || combinedText.includes('baru') || progres === 0) {
      status = 'Belum Ditindaklanjuti';
      progres = 0;
    } else if (combinedText.includes('jadwal') || combinedText.includes('wo') || combinedText.includes('rencana')) {
      status = 'Terjadwal WO / Pemeliharaan';
      if (progres > 30) progres = 20;
    }

    const anggaran = parseFloat(p.anggaran || p.anggaranrp || p.biaya || '3500000') || 3500000;
    const vendor = p.pelaksanavendor || p.pelaksana || p.timhar || 'Tim Pemeliharaan JTM ULP Baguala';
    const pengawas = p.pengawaspln || p.pengawas || p.petugas || 'Samsul Bahri (Supervisor Teknik)';
    const volume = p.volumeaset || p.volume || '1 Titik Temuan Konstruksi';
    const kebutuhanMaterial = p.kebutuhanmaterial || p.material || p.alat || `Material perbaikan untuk kategori ${kategori}`;
    const jenisAnomali = p.jenisanomali || p.anomali || p.kondisi || feat.description || `Anomali konstruksi ${rawNamaProyek} pada ${rawNoTiang}`;

    return {
      id: `kst-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      namaProyek: rawNamaProyek,
      nomorSpk: rawSpk,
      noTiang: rawNoTiang,
      penyulang: rawPenyulang,
      section: p.section || '',
      lokasi: rawLokasi,
      lat: feat.lat,
      lng: feat.lng,
      kategoriKonstruksi: kategori,
      jenisAnomali: jenisAnomali,
      tingkatBahaya: bahaya,
      kebutuhanMaterial: kebutuhanMaterial,
      statusProyek: status,
      progresPersen: progres,
      targetSelesai: p.targetselesai || '2026-03-31',
      tglMulai: p.tglmulai || new Date().toISOString().split('T')[0],
      tglTemuan: p.tgltemuan || new Date().toISOString().split('T')[0],
      anggaranRp: anggaran,
      pelaksanaVendor: vendor,
      pengawasPln: pengawas,
      volumeAset: volume,
      keterangan: p.keterangan || feat.description || `Temuan inspeksi konstruksi [${feat.name}]`,
      coordinatesPolyline: feat.coordinates || [
        [feat.lat - 0.0008, feat.lng - 0.0008],
        [feat.lat, feat.lng],
        [feat.lat + 0.0008, feat.lng + 0.0008]
      ]
    };
  });
}

// Master File Reader with Full Validation supporting .kml, .kmz, .geojson, .json, .csv, .txt
export async function readGisFileWithValidation(file: File): Promise<GisValidationReport> {
  const fileName = file.name;
  const nameLower = fileName.toLowerCase();

  if (file.size === 0) {
    return {
      isValid: false,
      fileType: 'unknown',
      fileName,
      totalItems: 0,
      validCount: 0,
      invalidCount: 0,
      features: [],
      errors: ['File kosong (0 Byte). Silakan unggah file peta yang memiliki data.'],
      warnings: []
    };
  }

  try {
    // KMZ or Zip archive
    if (nameLower.endsWith('.kmz') || nameLower.endsWith('.zip')) {
      const zip = await JSZip.loadAsync(file);
      const kmlFile = Object.keys(zip.files).find((fn) => fn.toLowerCase().endsWith('.kml'));
      if (kmlFile) {
        const text = await zip.files[kmlFile].async('text');
        const report = validateAndParseKml(text, `${fileName} (${kmlFile})`);
        report.fileType = 'kmz';
        return report;
      }
      const jsonFile = Object.keys(zip.files).find((fn) => fn.toLowerCase().endsWith('.geojson') || fn.toLowerCase().endsWith('.json'));
      if (jsonFile) {
        const text = await zip.files[jsonFile].async('text');
        const report = validateAndParseGeoJson(text, `${fileName} (${jsonFile})`);
        report.fileType = 'kmz';
        return report;
      }
      return {
        isValid: false,
        fileType: 'kmz',
        fileName,
        totalItems: 0,
        validCount: 0,
        invalidCount: 0,
        features: [],
        errors: ['Arsip KMZ/ZIP tidak berisi file .kml atau .geojson yang valid.'],
        warnings: []
      };
    }

    const text = await file.text();

    // KML
    if (nameLower.endsWith('.kml') || text.includes('<kml') || text.includes('<Placemark')) {
      return validateAndParseKml(text, fileName);
    }

    // GeoJSON / JSON
    if (nameLower.endsWith('.geojson') || nameLower.endsWith('.json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      return validateAndParseGeoJson(text, fileName);
    }

    // CSV / TSV / Text
    return validateAndParseCsv(text, fileName);
  } catch (err: any) {
    return {
      isValid: false,
      fileType: 'unknown',
      fileName,
      totalItems: 0,
      validCount: 0,
      invalidCount: 0,
      features: [],
      errors: [`Gagal memproses file '${fileName}': ${err.message || 'Format tidak didukung'}`],
      warnings: []
    };
  }
}

// Master File Reader supporting .kml, .kmz, .geojson, .json, .csv, .txt
export async function readGisFile(file: File): Promise<RawGisFeature[]> {
  const report = await readGisFileWithValidation(file);
  if (!report.isValid && report.features.length === 0) {
    throw new Error(report.errors[0] || 'Format file GIS tidak valid');
  }
  return report.features;
}
