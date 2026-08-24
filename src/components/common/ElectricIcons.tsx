import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

/**
 * 1. Icon Trafo / Gardu Distribusi (Teknis Line / Symbol style)
 * Berdasarkan gambar istockphoto-1199709741
 */
export const IconGarduTrafo: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Top Bushing 1 (Kiri) */}
    <path d="M 18 18 L 18 12 M 15 15 H 21 M 14 12 H 22 M 16 8 H 20 V 12 H 16 Z" />
    {/* Top Bushing 2 (Tengah) */}
    <path d="M 32 18 L 32 12 M 29 15 H 35 M 28 12 H 36 M 30 8 H 34 V 12 H 30 Z" />
    {/* Top Bushing 3 (Kanan) */}
    <path d="M 46 18 L 46 12 M 43 15 H 49 M 42 12 H 50 M 44 8 H 48 V 12 H 44 Z" />

    {/* Tangki Utama Trafo */}
    <rect x="12" y="24" width="40" height="28" rx="2" />
    <rect x="8" y="18" width="48" height="6" rx="1" />

    {/* Sirip Pendingin Kiri (Cooling Fins) */}
    <path d="M 16 30 H 22 M 16 34 H 22 M 16 38 H 22 M 16 42 H 22 M 16 46 H 22" />

    {/* Sirip Pendingin Kanan */}
    <path d="M 42 30 H 48 M 42 34 H 48 M 42 38 H 48 M 42 42 H 48 M 42 46 H 48" />

    {/* Simbol Kilat Listrik di Tengah */}
    <path d="M 33 28 L 29 37 H 34 L 30 46" fill="currentColor" stroke="currentColor" strokeWidth="1" />

    {/* Dudukan Bawah / Bracket */}
    <path d="M 16 52 V 57 H 24 V 52 M 40 52 V 57 H 48 V 52" />
  </svg>
);

/**
 * 2. Icon Tiang Listrik Single Crossarm (Tiang T / 1 Level Travers)
 * Berdasarkan gambar Gemini_Generated_Image_2e9k7u2e9k7u2e9k
 */
export const IconTiangSingleCrossarm: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Batang Utama Tiang Beton */}
    <path d="M 30 16 L 29 60 H 35 L 34 16 Z" />

    {/* Crossarm / Travers Tunggal */}
    <rect x="12" y="20" width="40" height="5" rx="1" />

    {/* Penopang Diagonal (Braces) */}
    <path d="M 22 25 L 30 35 M 42 25 L 34 35" />

    {/* Isolator Tumpu Kiri */}
    <path d="M 17 20 V 13 M 15 15 H 19 M 14 13 H 20" />
    {/* Isolator Tumpu Tengah */}
    <path d="M 32 20 V 13 M 30 15 H 34 M 29 13 H 35" />
    {/* Isolator Tumpu Kanan */}
    <path d="M 47 20 V 13 M 45 15 H 49 M 44 13 H 50" />
  </svg>
);

/**
 * 3. Icon Tiang Listrik Double Crossarm (Tiang 2 Level / Double Travers)
 * Berdasarkan gambar Gemini_Generated_Image_xsh8n5xsh8n5xsh8
 */
export const IconTiangDoubleCrossarm: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Tiang Beton */}
    <path d="M 30 8 L 29 60 H 35 L 34 8 Z" />

    {/* Travers Level 1 (Atas) */}
    <rect x="12" y="14" width="40" height="4" rx="1" />
    <path d="M 20 18 L 30 26 M 44 18 L 34 26" />

    {/* Isolator Atas (3 buah) */}
    <path d="M 17 14 V 9 M 15 11 H 19 M 32 14 V 9 M 30 11 H 34 M 47 14 V 9 M 45 11 H 49" />

    {/* Travers Level 2 (Bawah) */}
    <rect x="12" y="30" width="40" height="4" rx="1" />
    <path d="M 20 34 L 30 42 M 44 34 L 34 42" />

    {/* Isolator Bawah (3 buah) */}
    <path d="M 17 30 V 25 M 15 27 H 19 M 32 30 V 25 M 30 27 H 34 M 47 30 V 25 M 45 27 H 49" />
  </svg>
);

/**
 * 4. Icon Tiang Switching / LBS / FCO (Load Break Switch Pole)
 * Berdasarkan gambar Gemini_Generated_Image_yhb9akyhb9akyhb9
 */
export const IconTiangLBS: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Tiang Utama */}
    <path d="M 34 6 L 33 60 H 39 L 38 6 Z" />

    {/* Travers Atas */}
    <rect x="16" y="14" width="36" height="4" rx="1" />
    <path d="M 22 18 L 34 26 M 46 18 L 38 26" />

    {/* Isolator Atas Strain */}
    <path d="M 20 14 V 8 M 36 14 V 8 M 48 14 V 8" />

    {/* Unit LBS (Switching Box & FCO Fuse Bracket) di Samping Tiang */}
    <rect x="14" y="32" width="18" height="10" rx="1.5" />
    {/* 3 Isolator LBS */}
    <path d="M 17 32 V 26 M 23 32 V 26 M 29 32 V 26" />
    {/* Penopang Siku LBS */}
    <path d="M 14 42 L 33 50 M 32 38 H 34" />

    {/* Pipa/Stang Pengoperasian LBS Downward */}
    <path d="M 37 32 V 56" strokeDasharray="2 2" />
  </svg>
);

/**
 * 5. Icon Gardu Cantol / Gardu Portal 2-Tiang (GTT H-Frame / Portal Transformer)
 * Berdasarkan gambar Gemini_Generated_Image_utn3akutn3akutn3
 */
export const IconGarduPortal: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Tiang Portal Kiri & Kanan */}
    <path d="M 14 10 L 13 58 H 18 L 17 10 Z" />
    <path d="M 46 10 L 45 58 H 50 L 49 10 Z" />

    {/* Travers Atas Pengikat Portal */}
    <rect x="10" y="14" width="44" height="4" rx="1" />
    <path d="M 18 18 L 32 26 M 46 18 L 32 26" />

    {/* Isolator & Arrester Atas */}
    <path d="M 22 14 V 8 M 32 14 V 8 M 42 14 V 8" />

    {/* Platform Gelagar Dudukan Trafo Bawah */}
    <rect x="10" y="48" width="44" height="4" rx="1" />

    {/* Unit Trafo Distribusi Ditempatkan di Tengah Portal */}
    <rect x="22" y="30" width="20" height="18" rx="1.5" />
    {/* Bushing Trafo Portal */}
    <path d="M 26 30 V 25 M 32 30 V 25 M 38 30 V 25" />
    {/* Sirip Trafo */}
    <path d="M 25 35 H 39 M 25 39 H 39 M 25 43 H 39" />
  </svg>
);

/**
 * 6. Icon Gardu Beton / Kiosk Substation ("Listrik Pintar" PLN Building)
 * Berdasarkan gambar large_thumbnail-removebg-preview
 */
export const IconGarduBeton: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Pondasi Bawah */}
    <rect x="8" y="52" width="48" height="5" rx="1" />

    {/* Dinding Utama Bangunan Gardu */}
    <rect x="12" y="22" width="40" height="30" rx="1" />

    {/* Atap Canopy Overhang PLN Blue */}
    <path d="M 8 14 H 56 L 52 22 H 12 Z" fill="none" />
    <rect x="8" y="14" width="48" height="8" rx="1.5" />

    {/* Pintu Besi Ganda (Double Doors) */}
    <rect x="26" y="32" width="16" height="20" rx="1" />
    <path d="M 34 32 V 52" />
    {/* Gagang Pintu */}
    <circle cx="32" cy="42" r="1" fill="currentColor" />
    <circle cx="36" cy="42" r="1" fill="currentColor" />

    {/* Logo PLN / Kilat Listrik Pintar */}
    <path d="M 18 30 C 18 28 22 28 22 32 C 22 36 18 36 18 40" />
    <path d="M 19 28 L 21 24" />
    <path d="M 46 26 L 43 36 H 47 L 44 46" />
  </svg>
);

/**
 * 7. Icon Tiang Portal 3-Pole (H-Frame 3 Tiang)
 * Berdasarkan gambar Gemini_Generated_Image_ezsekzezsekzezse
 */
export const IconTiangPortal3Pole: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* 3 Tiang Paralel */}
    <path d="M 14 12 L 13 58 H 17 L 16 12 Z" />
    <path d="M 32 12 L 31 58 H 35 L 34 12 Z" />
    <path d="M 50 12 L 49 58 H 53 L 52 12 Z" />

    {/* Travers Atas */}
    <rect x="10" y="16" width="44" height="4" rx="1" />
    <path d="M 15 20 L 32 28 M 49 20 L 32 28" />

    {/* Isolator Atas (4 Titik) */}
    <path d="M 14 16 V 10 M 26 16 V 10 M 38 16 V 10 M 50 16 V 10" />

    {/* Travers Tengah */}
    <rect x="10" y="34" width="44" height="4" rx="1" />
    <path d="M 15 38 L 32 46 M 49 38 L 32 46" />

    {/* Isolator Tengah */}
    <path d="M 23 34 V 28 M 41 34 V 28" />
  </svg>
);

/**
 * Export Helper SVG Strings untuk Leaflet divIcon atau HTML canvas
 * Desain Realistis Tanpa Background Bulat/Warna Buatan (Format Icon PNG Style)
 */
export const ELECTRIC_ICON_SVG_STRINGS = {
  tiangSingle: `
    <svg width="28" height="32" viewBox="0 0 48 54" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));">
      <!-- Ground Shadow -->
      <ellipse cx="24" cy="52" rx="10" ry="2" fill="#000000" opacity="0.35"/>
      <!-- Pole Shaft (Beton Silinder Realistis) -->
      <path d="M22 14 L20 51 H28 L26 14 Z" fill="url(#poleGrad)" stroke="#1e293b" stroke-width="1"/>
      <line x1="22.5" y1="20" x2="22.5" y2="48" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1"/>
      <!-- Crossarm Travers Baja -->
      <rect x="6" y="14" width="36" height="5" rx="1" fill="#334155" stroke="#0f172a" stroke-width="1"/>
      <!-- Diagonal Braces / Penopang Besi -->
      <line x1="14" y1="19" x2="22" y2="28" stroke="#1e293b" stroke-width="1.8"/>
      <line x1="34" y1="19" x2="26" y2="28" stroke="#1e293b" stroke-width="1.8"/>
      <!-- Isolator Keramik / Porcelain Kiri -->
      <path d="M10 14 V7 H14 V14 Z" fill="#b45309" stroke="#78350f" stroke-width="0.8"/>
      <ellipse cx="12" cy="7" rx="3" ry="1.5" fill="#f59e0b"/>
      <ellipse cx="12" cy="10" rx="2.5" ry="1" fill="#d97706"/>
      <!-- Isolator Keramik Tengah -->
      <path d="M22 14 V5 H26 V14 Z" fill="#b45309" stroke="#78350f" stroke-width="0.8"/>
      <ellipse cx="24" cy="5" rx="3" ry="1.5" fill="#f59e0b"/>
      <ellipse cx="24" cy="8" rx="2.5" ry="1" fill="#d97706"/>
      <!-- Isolator Keramik Kanan -->
      <path d="M34 14 V7 H38 V14 Z" fill="#b45309" stroke="#78350f" stroke-width="0.8"/>
      <ellipse cx="36" cy="7" rx="3" ry="1.5" fill="#f59e0b"/>
      <ellipse cx="36" cy="10" rx="2.5" ry="1" fill="#d97706"/>
      <!-- Gradients -->
      <defs>
        <linearGradient id="poleGrad" x1="20" y1="14" x2="28" y2="14" gradientUnits="userSpaceOnUse">
          <stop stop-color="#94a3b8"/>
          <stop offset="0.3" stop-color="#cbd5e1"/>
          <stop offset="0.7" stop-color="#64748b"/>
          <stop offset="1" stop-color="#475569"/>
        </linearGradient>
      </defs>
    </svg>
  `,

  tiangDouble: `
    <svg width="28" height="32" viewBox="0 0 48 54" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));">
      <ellipse cx="24" cy="52" rx="10" ry="2" fill="#000000" opacity="0.35"/>
      <path d="M22 8 L20 51 H28 L26 8 Z" fill="url(#poleGradD)" stroke="#1e293b" stroke-width="1"/>
      <!-- Travers Atas -->
      <rect x="6" y="8" width="36" height="4.5" rx="1" fill="#334155" stroke="#0f172a" stroke-width="1"/>
      <line x1="14" y1="12.5" x2="22" y2="19" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="34" y1="12.5" x2="26" y2="19" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Isolator Atas -->
      <rect x="10.5" y="3" width="3" height="5" fill="#f59e0b" stroke="#78350f" stroke-width="0.8"/>
      <rect x="22.5" y="2" width="3" height="6" fill="#f59e0b" stroke="#78350f" stroke-width="0.8"/>
      <rect x="34.5" y="3" width="3" height="5" fill="#f59e0b" stroke="#78350f" stroke-width="0.8"/>
      <!-- Travers Bawah -->
      <rect x="8" y="22" width="32" height="4" rx="1" fill="#334155" stroke="#0f172a" stroke-width="1"/>
      <line x1="15" y1="26" x2="22" y2="33" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="33" y1="26" x2="26" y2="33" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Isolator Bawah -->
      <rect x="12" y="18" width="3" height="4" fill="#f59e0b" stroke="#78350f" stroke-width="0.8"/>
      <rect x="33" y="18" width="3" height="4" fill="#f59e0b" stroke="#78350f" stroke-width="0.8"/>
      <defs>
        <linearGradient id="poleGradD" x1="20" y1="8" x2="28" y2="8" gradientUnits="userSpaceOnUse">
          <stop stop-color="#94a3b8"/>
          <stop offset="0.3" stop-color="#cbd5e1"/>
          <stop offset="0.7" stop-color="#64748b"/>
          <stop offset="1" stop-color="#475569"/>
        </linearGradient>
      </defs>
    </svg>
  `,

  garduTrafo: `
    <svg width="30" height="34" viewBox="0 0 52 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.75));">
      <ellipse cx="26" cy="53" rx="12" ry="2" fill="#000000" opacity="0.35"/>
      <!-- Tiang Utama -->
      <path d="M24 6 L22 52 H30 L28 6 Z" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
      <!-- Travers Atas & Isolator -->
      <rect x="8" y="8" width="36" height="4" rx="1" fill="#334155"/>
      <rect x="12" y="3" width="3" height="5" fill="#f59e0b"/>
      <rect x="24.5" y="2" width="3" height="6" fill="#f59e0b"/>
      <rect x="37" y="3" width="3" height="5" fill="#f59e0b"/>
      <!-- Tangki Trafo Distribusi Cantol -->
      <rect x="11" y="21" width="30" height="23" rx="2" fill="#475569" stroke="#0f172a" stroke-width="1.2"/>
      <rect x="8" y="17" width="36" height="4" rx="1" fill="#334155" stroke="#0f172a" stroke-width="1"/>
      <!-- Sirip Pendingin (Cooling Fins) -->
      <line x1="15" y1="24" x2="15" y2="40" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="19" y1="24" x2="19" y2="40" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="33" y1="24" x2="33" y2="40" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="37" y1="24" x2="37" y2="40" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Bushing Trafo -->
      <rect x="16" y="13" width="3" height="4" fill="#b45309"/>
      <rect x="25" y="13" width="3" height="4" fill="#b45309"/>
      <rect x="33" y="13" width="3" height="4" fill="#b45309"/>
      <!-- Kilat Kuning Simbol Listrik -->
      <path d="M28 26 L23 33 H28 L24 40" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Dudukan Bawah Bracket -->
      <rect x="14" y="44" width="24" height="3" fill="#1e293b"/>
    </svg>
  `,

  garduPortal: `
    <svg width="32" height="34" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.75));">
      <ellipse cx="28" cy="53" rx="16" ry="2.5" fill="#000000" opacity="0.35"/>
      <!-- 2 Tiang Portal -->
      <path d="M12 6 L10 52 H17 L16 6 Z" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
      <path d="M40 6 L39 52 H46 L44 6 Z" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
      <!-- Crossbeam Atas -->
      <rect x="6" y="8" width="44" height="4.5" rx="1" fill="#334155" stroke="#0f172a" stroke-width="1"/>
      <!-- 4 Isolator Gantung/Tumpu -->
      <rect x="10" y="3" width="3" height="5" fill="#f59e0b"/>
      <rect x="20" y="3" width="3" height="5" fill="#f59e0b"/>
      <rect x="33" y="3" width="3" height="5" fill="#f59e0b"/>
      <rect x="43" y="3" width="3" height="5" fill="#f59e0b"/>
      <!-- Platform Meja Trafo Portal -->
      <rect x="6" y="38" width="44" height="4.5" rx="1" fill="#1e293b"/>
      <!-- Trafo Besar di Platform -->
      <rect x="18" y="20" width="20" height="18" rx="2" fill="#475569" stroke="#0f172a" stroke-width="1"/>
      <rect x="15" y="16" width="26" height="4" rx="1" fill="#334155"/>
      <path d="M29 24 L26 29 H29 L27 34" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `,

  garduBeton: `
    <svg width="30" height="32" viewBox="0 0 52 54" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.75));">
      <ellipse cx="26" cy="51" rx="14" ry="2.5" fill="#000000" opacity="0.35"/>
      <!-- Pondasi & Bangunan Gardu Beton -->
      <rect x="6" y="46" width="40" height="5" rx="1" fill="#334155" stroke="#0f172a" stroke-width="1"/>
      <rect x="9" y="16" width="34" height="30" rx="1.5" fill="#64748b" stroke="#0f172a" stroke-width="1.2"/>
      <!-- Atap Beton -->
      <path d="M6 16 L26 8 L46 16 Z" fill="#475569" stroke="#0f172a" stroke-width="1.2"/>
      <!-- Pintu Besi Gardu -->
      <rect x="14" y="24" width="11" height="22" fill="#334155" stroke="#1e293b" stroke-width="1"/>
      <rect x="27" y="24" width="11" height="22" fill="#334155" stroke="#1e293b" stroke-width="1"/>
      <circle cx="23" cy="35" r="1" fill="#f8fafc"/>
      <circle cx="29" cy="35" r="1" fill="#f8fafc"/>
      <!-- Ventilasi Udara / Louver -->
      <line x1="16" y1="28" x2="22" y2="28" stroke="#94a3b8" stroke-width="1"/>
      <line x1="16" y1="30" x2="22" y2="30" stroke="#94a3b8" stroke-width="1"/>
      <line x1="30" y1="28" x2="36" y2="28" stroke="#94a3b8" stroke-width="1"/>
      <line x1="30" y1="30" x2="36" y2="30" stroke="#94a3b8" stroke-width="1"/>
      <!-- Simbol Bahaya Listrik Kilat -->
      <polygon points="26,10 24,14 27,14 25,18 28,13 25.5,13" fill="#fbbf24"/>
    </svg>
  `,

  tiangLBS: `
    <svg width="28" height="32" viewBox="0 0 48 54" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));">
      <ellipse cx="24" cy="52" rx="10" ry="2" fill="#000000" opacity="0.35"/>
      <path d="M22 6 L20 51 H28 L26 6 Z" fill="#64748b" stroke="#1e293b" stroke-width="1"/>
      <!-- Travers -->
      <rect x="6" y="8" width="36" height="4" rx="1" fill="#334155"/>
      <rect x="10" y="4" width="3" height="4" fill="#f59e0b"/>
      <rect x="22.5" y="4" width="3" height="4" fill="#f59e0b"/>
      <rect x="35" y="4" width="3" height="4" fill="#f59e0b"/>
      <!-- Kotak Unit Saklar LBS / Switch -->
      <rect x="10" y="20" width="16" height="11" rx="1.5" fill="#0284c7" stroke="#0369a1" stroke-width="1"/>
      <circle cx="18" cy="25.5" r="3" fill="#ffffff"/>
      <circle cx="18" cy="25.5" r="1.5" fill="#0284c7"/>
      <!-- Pipa Operasi / Rod -->
      <line x1="26" y1="20" x2="26" y2="48" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="2 2"/>
    </svg>
  `,

  tiangPortal3Pole: `
    <svg width="34" height="34" viewBox="0 0 58 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.75));">
      <ellipse cx="29" cy="53" rx="18" ry="2.5" fill="#000000" opacity="0.35"/>
      <path d="M10 8 L9 52 H14 L13 8 Z" fill="#64748b" stroke="#1e293b" stroke-width="0.8"/>
      <path d="M27 8 L26 52 H31 L30 8 Z" fill="#64748b" stroke="#1e293b" stroke-width="0.8"/>
      <path d="M44 8 L43 52 H48 L47 8 Z" fill="#64748b" stroke="#1e293b" stroke-width="0.8"/>
      <rect x="6" y="12" width="46" height="4" rx="1" fill="#334155"/>
      <rect x="9" y="7" width="2.5" height="5" fill="#f59e0b"/>
      <rect x="20" y="7" width="2.5" height="5" fill="#f59e0b"/>
      <rect x="35" y="7" width="2.5" height="5" fill="#f59e0b"/>
      <rect x="46" y="7" width="2.5" height="5" fill="#f59e0b"/>
      <rect x="6" y="28" width="46" height="4" rx="1" fill="#334155"/>
    </svg>
  `,

  trees: `
    <svg width="28" height="30" viewBox="0 0 48 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
      <ellipse cx="24" cy="48" rx="8" ry="2" fill="#000000" opacity="0.3"/>
      <!-- Batang Pohon -->
      <path d="M21 30 L20 48 H28 L27 30 Z" fill="#78350f" stroke="#451a03" stroke-width="1"/>
      <!-- Mahkota Daun Rimbun Hijau -->
      <circle cx="24" cy="18" r="14" fill="#15803d"/>
      <circle cx="15" cy="24" r="10" fill="#16a34a"/>
      <circle cx="33" cy="24" r="10" fill="#16a34a"/>
      <circle cx="24" cy="26" r="12" fill="#22c55e"/>
      <circle cx="21" cy="14" r="7" fill="#4ade80"/>
    </svg>
  `,

  wrench: `
    <svg width="26" height="28" viewBox="0 0 44 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
      <ellipse cx="22" cy="44" rx="8" ry="2" fill="#000000" opacity="0.3"/>
      <!-- Kunci Pas Teknik -->
      <path d="M28 6 C24 3 18 5 16 9 L20 13 L17 16 L13 12 C9 14 7 20 10 24 L29 43 C31 45 34 45 36 43 C38 41 38 38 36 36 L17 17" fill="#94a3b8" stroke="#334155" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="33" cy="40" r="2.5" fill="#f8fafc" stroke="#334155" stroke-width="1"/>
    </svg>
  `,

  activity: `
    <svg width="28" height="30" viewBox="0 0 48 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(220,38,38,0.8));">
      <ellipse cx="24" cy="47" rx="8" ry="2" fill="#000000" opacity="0.35"/>
      <!-- Segitiga Danger / Flash Gangguan -->
      <path d="M24 4 L44 42 H4 L24 4 Z" fill="#ef4444" stroke="#991b1b" stroke-width="2"/>
      <path d="M24 10 L40 40 H8 L24 10 Z" fill="#fee2e2"/>
      <!-- Kilat Merah / Hitam -->
      <path d="M26 15 L19 27 H25 L21 37 L30 25 H24 L27 15 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1"/>
    </svg>
  `,

  zap: `
    <svg width="26" height="28" viewBox="0 0 44 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
      <path d="M24 2 L8 24 H22 L18 44 L36 20 H22 L26 2 Z" fill="#eab308" stroke="#ca8a04" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `
};
