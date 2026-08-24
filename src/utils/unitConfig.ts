import { User, MasterUnitPLN } from '../types';

export interface UnitInfo {
  namaUnit: string;
  kodeUnit: string;
  singkatan: string;
  tipe: 'ULP' | 'UP3' | 'UIW' | 'PUSAT' | 'ANAK_PERUSAHAAN';
  alamat?: string;
  kabupaten?: string;
}

export const DAFTAR_UNIT_PLN: UnitInfo[] = [
  {
    namaUnit: 'ULP Baguala',
    kodeUnit: '54110',
    singkatan: 'BGL',
    tipe: 'ULP',
    alamat: 'Jl. Wolter Monginsidi, Passo, Ambon',
    kabupaten: 'Kota Ambon'
  },
  {
    namaUnit: 'ULP Namlea',
    kodeUnit: '54120',
    singkatan: 'NML',
    tipe: 'ULP',
    alamat: 'Jl. Danau Rana No. 12, Namlea',
    kabupaten: 'Kabupaten Buru'
  },
  {
    namaUnit: 'ULP Ambon Kota',
    kodeUnit: '54130',
    singkatan: 'ABK',
    tipe: 'ULP',
    alamat: 'Jl. Sultan Hairun No. 1, Ambon',
    kabupaten: 'Kota Ambon'
  },
  {
    namaUnit: 'ULP Piru',
    kodeUnit: '54140',
    singkatan: 'PIR',
    tipe: 'ULP',
    alamat: 'Jl. Trans Seram, Piru',
    kabupaten: 'Kabupaten Seram Bagian Barat'
  },
  {
    namaUnit: 'ULP Masohi',
    kodeUnit: '54150',
    singkatan: 'MSH',
    tipe: 'ULP',
    alamat: 'Jl. Abdullah Soulisa, Masohi',
    kabupaten: 'Kabupaten Maluku Tengah'
  },
  {
    namaUnit: 'ULP Saparua',
    kodeUnit: '54160',
    singkatan: 'SPR',
    tipe: 'ULP',
    alamat: 'Jl. Benteng Duurstede, Saparua',
    kabupaten: 'Kabupaten Maluku Tengah'
  },
  {
    namaUnit: 'ULP Kairatu',
    kodeUnit: '54170',
    singkatan: 'KRT',
    tipe: 'ULP',
    alamat: 'Jl. Dermaga Kairatu',
    kabupaten: 'Kabupaten Seram Bagian Barat'
  },
  {
    namaUnit: 'ULP Tual',
    kodeUnit: '54210',
    singkatan: 'TUL',
    tipe: 'ULP',
    alamat: 'Jl. Jenderal Sudirman, Tual',
    kabupaten: 'Kota Tual'
  },
  {
    namaUnit: 'ULP Saumlaki',
    kodeUnit: '54220',
    singkatan: 'SLK',
    tipe: 'ULP',
    alamat: 'Jl. Mathilda Batlayeri, Saumlaki',
    kabupaten: 'Kabupaten Kepulauan Tanimbar'
  },
  {
    namaUnit: 'ULP Dobo',
    kodeUnit: '54230',
    singkatan: 'DOB',
    tipe: 'ULP',
    alamat: 'Jl. Cenderawasih, Dobo',
    kabupaten: 'Kabupaten Kepulauan Aru'
  },
  {
    namaUnit: 'PLN Nusa Daya',
    kodeUnit: '54090',
    singkatan: 'PND',
    tipe: 'ANAK_PERUSAHAAN',
    alamat: 'Kantor Operasional Maluku',
    kabupaten: 'Kota Ambon'
  },
  {
    namaUnit: 'UP3 Ambon',
    kodeUnit: '54000',
    singkatan: 'UP3-ABN',
    tipe: 'UP3',
    alamat: 'Jl. Sultan Hairun No. 1, Kel Honipopu, Sirimau, Kota Ambon',
    kabupaten: 'Kota Ambon'
  },
  {
    namaUnit: 'UIW MMU',
    kodeUnit: '54001',
    singkatan: 'UIW-MMU',
    tipe: 'UIW',
    alamat: 'Jl. Diponegoro No. 2, Ambon',
    kabupaten: 'Wilayah Maluku & Maluku Utara'
  },
  {
    namaUnit: 'PLN Pusat',
    kodeUnit: '54999',
    singkatan: 'PUSAT',
    tipe: 'PUSAT',
    alamat: 'Jl. Trunojoyo Blok M - I No. 135, Jakarta',
    kabupaten: 'Jakarta Selatan'
  }
];

export const DEFAULT_UNIT = 'ULP Baguala';
export const DEFAULT_KODE_UNIT = '54110';

export interface FullUnitDetails {
  namaUnit: string;
  kodeUnit: string;
  singkatan: string;
  up3: string;
  uiw: string;
  alamat: string;
  kabupaten: string;
  timYantek: string;
  managerTitle: string;
  tlTeknikTitle: string;
  spkPrefix: string;
}

export const getUnitDetails = (
  userOrUnitName?: User | string | null,
  masterUnitList?: MasterUnitPLN[]
): FullUnitDetails => {
  let unitQuery = DEFAULT_UNIT;

  if (typeof userOrUnitName === 'string') {
    if (userOrUnitName && userOrUnitName !== 'SEMUA UNIT' && userOrUnitName !== 'ALL') {
      unitQuery = userOrUnitName;
    }
  } else if (userOrUnitName && typeof userOrUnitName === 'object') {
    if (userOrUnitName.unit && userOrUnitName.unit !== 'SEMUA UNIT' && userOrUnitName.unit !== 'ALL') {
      unitQuery = userOrUnitName.unit;
    }
  }

  const list = getDynamicUnitList(masterUnitList);
  const normalized = unitQuery.toLowerCase().trim();

  let match = list.find(
    (u) =>
      u.namaUnit.toLowerCase() === normalized ||
      u.singkatan.toLowerCase() === normalized ||
      u.kodeUnit === normalized ||
      normalized.includes(u.namaUnit.toLowerCase()) ||
      u.namaUnit.toLowerCase().includes(normalized)
  );

  if (!match && normalized.includes('namlea')) {
    match = list.find((u) => u.namaUnit.toLowerCase().includes('namlea'));
  }
  if (!match && normalized.includes('baguala')) {
    match = list.find((u) => u.namaUnit.toLowerCase().includes('baguala'));
  }

  const namaUnit = match?.namaUnit || (unitQuery !== 'SEMUA UNIT' && unitQuery !== 'ALL' ? unitQuery : DEFAULT_UNIT);
  const kodeUnit = match?.kodeUnit || getKodeUnitByUnitName(namaUnit, masterUnitList);

  let singkatan = match?.singkatan || '';
  if (!singkatan || singkatan === kodeUnit) {
    const cleanName = namaUnit.replace(/^ULP\s+/i, '').replace(/^UP3\s+/i, '').trim().toUpperCase();
    if (cleanName.includes('BAGUALA')) singkatan = 'BGL';
    else if (cleanName.includes('NAMLEA')) singkatan = 'NML';
    else if (cleanName.includes('AMBON')) singkatan = 'ABK';
    else if (cleanName.includes('PIRU')) singkatan = 'PIR';
    else if (cleanName.includes('MASOHI')) singkatan = 'MSH';
    else if (cleanName.includes('SAPARUA')) singkatan = 'SPR';
    else if (cleanName.includes('KAIRATU')) singkatan = 'KRT';
    else if (cleanName.includes('TUAL')) singkatan = 'TUL';
    else if (cleanName.includes('SAUMLAKI')) singkatan = 'SLK';
    else if (cleanName.includes('DOBO')) singkatan = 'DOB';
    else singkatan = cleanName.substring(0, 3).toUpperCase();
  }

  const alamat = match?.alamat || `Jl. Operasional PLN ${namaUnit}`;
  const kabupaten = match?.kabupaten || 'Kota Ambon';
  const up3 = 'UP3 AMBON';
  const uiw = 'UIW MALUKU DAN MALUKU UTARA';
  const timYantek = `Tim Yantek ${namaUnit}`;
  const managerTitle = `Manager PLN ${namaUnit}`;
  const tlTeknikTitle = `TL Teknik ${namaUnit}`;
  const spkPrefix = `SPK/ULP-${singkatan}`;

  return {
    namaUnit,
    kodeUnit,
    singkatan,
    up3,
    uiw,
    alamat,
    kabupaten,
    timYantek,
    managerTitle,
    tlTeknikTitle,
    spkPrefix
  };
};

/**
 * Dynamically constructs the Unit list synchronized with Master Unit PLN data.
 * When items are added, edited, or deleted in Master Unit PLN, this reflects live updates.
 */
export const getDynamicUnitList = (masterUnitList?: MasterUnitPLN[]): UnitInfo[] => {
  let rawList: UnitInfo[] = [];
  if (masterUnitList && masterUnitList.length > 0) {
    const masterMapped: UnitInfo[] = masterUnitList.map((m) => ({
      namaUnit: m.ulp?.trim() || m.id,
      kodeUnit: m.kodeUlp?.trim() || '54110',
      singkatan: m.kodeUlp?.trim() || '',
      tipe: 'ULP',
      alamat: m.alamat,
      kabupaten: m.up3
    }));

    const existingNames = new Set<string>();
    const masterUnique: UnitInfo[] = [];

    for (const u of masterMapped) {
      const key = u.namaUnit.toLowerCase().trim();
      if (!existingNames.has(key)) {
        existingNames.add(key);
        masterUnique.push(u);
      }
    }

    const existingCodes = new Set(masterUnique.map((u) => u.kodeUnit));

    // Keep default administrative/regional units (UP3, UIW, Pusat, Nusadaya) if not already in master
    const additional = DAFTAR_UNIT_PLN.filter(
      (d) => !existingCodes.has(d.kodeUnit) && !existingNames.has(d.namaUnit.toLowerCase().trim())
    );

    rawList = [...masterUnique, ...additional];
  } else {
    rawList = DAFTAR_UNIT_PLN;
  }

  // Ensure ultimate uniqueness
  const seenKey = new Set<string>();
  const finalUniqueList: UnitInfo[] = [];
  for (const item of rawList) {
    const k = `${item.kodeUnit.trim()}_${item.namaUnit.toLowerCase().trim()}`;
    if (!seenKey.has(k)) {
      seenKey.add(k);
      finalUniqueList.push(item);
    }
  }

  return finalUniqueList;
};

/**
 * Gets the standard unit code for a given unit name.
 */
export const getKodeUnitByUnitName = (unitName?: string, masterUnitList?: MasterUnitPLN[]): string => {
  if (!unitName) return DEFAULT_KODE_UNIT;
  const list = getDynamicUnitList(masterUnitList);
  const normalized = unitName.toLowerCase().trim();
  const match = list.find(
    (u) =>
      u.namaUnit.toLowerCase() === normalized ||
      u.singkatan.toLowerCase() === normalized ||
      normalized.includes(u.namaUnit.toLowerCase()) ||
      u.namaUnit.toLowerCase().includes(normalized)
  );
  if (match) return match.kodeUnit;
  // If unitName already looks like a code
  if (/^\d{4,6}$/.test(unitName.trim())) return unitName.trim();
  return DEFAULT_KODE_UNIT;
};

/**
 * Gets the standard unit name for a given unit code.
 */
export const getUnitNameByKodeUnit = (kodeUnit?: string, masterUnitList?: MasterUnitPLN[]): string => {
  if (!kodeUnit) return DEFAULT_UNIT;
  const list = getDynamicUnitList(masterUnitList);
  const match = list.find((u) => u.kodeUnit === kodeUnit.trim());
  if (match) return match.namaUnit;
  return DEFAULT_UNIT;
};

/**
 * Validates whether an item is accessible to a given user based on Unit & Kode Unit.
 * 
 * Rules:
 * 1. If user is Owner (isOwnerUser or role Owner):
 *    - Has global access to all units.
 *    - If an active unitFilter is selected (not 'SEMUA'), filters strictly by that unit.
 * 2. If user is a Unit user (e.g. ULP Namlea, ULP Baguala):
 *    - Can ONLY access data belonging to their unit / kodeUnit.
 */
export const isDataAccessibleByUser = <T extends { unit?: string; kodeUnit?: string }>(
  item: T,
  currentUser: User | null | undefined,
  ownerSelectedUnitFilter: string = 'SEMUA'
): boolean => {
  if (!currentUser) return false;

  const isOwner =
    currentUser.isOwner === true ||
    (currentUser.username || '').toLowerCase() === 'owner' ||
    (currentUser.role || '').toLowerCase().includes('owner');

  // 1. OWNER GLOBAL ACCESS
  if (isOwner) {
    if (!ownerSelectedUnitFilter || ownerSelectedUnitFilter === 'SEMUA' || ownerSelectedUnitFilter === 'ALL') {
      return true;
    }
    const filterLower = ownerSelectedUnitFilter.toLowerCase().trim();
    const itemUnitLower = (item.unit || '').toLowerCase().trim();
    const itemKode = (item.kodeUnit || getKodeUnitByUnitName(item.unit)).trim();
    const filterKode = getKodeUnitByUnitName(ownerSelectedUnitFilter);

    return (
      itemUnitLower === filterLower ||
      itemKode === ownerSelectedUnitFilter.trim() ||
      itemKode === filterKode ||
      itemUnitLower.includes(filterLower) ||
      filterLower.includes(itemUnitLower)
    );
  }

  // 2. UNIT-RESTRICTED ACCESS (Non-Owner)
  const userUnit = (currentUser.unit || DEFAULT_UNIT).toLowerCase().trim();
  const userKodeUnit = (currentUser.kodeUnit || getKodeUnitByUnitName(currentUser.unit)).trim();

  const itemUnit = (item.unit || DEFAULT_UNIT).toLowerCase().trim();
  const itemKodeUnit = (item.kodeUnit || getKodeUnitByUnitName(item.unit)).trim();

  // Match by kodeUnit or exact unit name
  return (
    itemKodeUnit === userKodeUnit ||
    itemUnit === userUnit ||
    (itemUnit.includes('baguala') && userUnit.includes('baguala')) ||
    (itemUnit.includes('namlea') && userUnit.includes('namlea')) ||
    (itemUnit.includes('ambon kota') && userUnit.includes('ambon kota')) ||
    (itemUnit.includes('piru') && userUnit.includes('piru')) ||
    (itemUnit.includes('masohi') && userUnit.includes('masohi')) ||
    (itemUnit.includes('saparua') && userUnit.includes('saparua')) ||
    (itemUnit.includes('kairatu') && userUnit.includes('kairatu')) ||
    (itemUnit.includes('tual') && userUnit.includes('tual')) ||
    (itemUnit.includes('saumlaki') && userUnit.includes('saumlaki')) ||
    (itemUnit.includes('dobo') && userUnit.includes('dobo'))
  );
};
