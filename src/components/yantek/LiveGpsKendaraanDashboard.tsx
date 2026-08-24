import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Car,
  Navigation,
  Smartphone,
  Radio,
  MapPin,
  Compass,
  BatteryCharging,
  Zap,
  PhoneCall,
  Play,
  Square,
  RefreshCw,
  Activity,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Sliders,
  ShieldCheck,
  Wifi,
  WifiOff,
  QrCode,
  Copy,
  ExternalLink,
  Mail,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { KendaraanOperasional, LiveGpsTrack, User } from '../../types';

interface LiveGpsKendaraanDashboardProps {
  currentUser?: User | null;
  kendaraanList: KendaraanOperasional[];
  onUpdateKendaraan: (kendaraan: KendaraanOperasional) => void;
}

// Predefined route waypoints for Ambon/Baguala GPS Simulation Demo
const SIMULATED_ROUTE = [
  { lat: -3.6490, lng: 128.2280, speed: 28, heading: 110, name: 'Kantor ULP Baguala Passo' },
  { lat: -3.6502, lng: 128.2305, speed: 35, heading: 125, name: 'Jl. Syaranamual Passo' },
  { lat: -3.6515, lng: 128.2325, speed: 42, heading: 130, name: 'Pertigaan Laitimor Passo' },
  { lat: -3.6530, lng: 128.2350, speed: 45, heading: 135, name: 'Depan RSUD Dr. Haulussy Passo' },
  { lat: -3.6521, lng: 128.2145, speed: 38, heading: 250, name: 'Jl. Laksdya Leo Wattimena Lateri' },
  { lat: -3.6395, lng: 128.2011, speed: 50, heading: 310, name: 'Kawasan Industri Waiheru' },
  { lat: -3.5871, lng: 128.3289, speed: 40, heading: 80,  name: 'Pasar Tulehu' },
  { lat: -3.6490, lng: 128.2280, speed: 0,  heading: 0,   name: 'Kembali ke Basecamp' }
];

// Helper to compute bearing between two points
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

export const LiveGpsKendaraanDashboard: React.FC<LiveGpsKendaraanDashboardProps> = ({
  currentUser,
  kendaraanList,
  onUpdateKendaraan
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const polylineRef = useRef<Record<string, L.Polyline>>({});
  const wakeLockRef = useRef<any>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Default initial vehicle selection with local storage fallback
  const initialVehicleId = () => {
    const saved = localStorage.getItem('pln_yantek_paired_vehicle');
    if (saved && kendaraanList.some((k) => k.id === saved)) return saved;
    return kendaraanList[0]?.id || '';
  };

  // State for paired vehicle and officer email
  const [selectedVehicleForGps, setSelectedVehicleForGps] = useState<string>(initialVehicleId);
  const [driverEmail, setDriverEmail] = useState<string>(() => {
    return (
      localStorage.getItem('pln_yantek_hp_email') ||
      currentUser?.username ||
      'thetakanome318@gmail.com'
    );
  });
  const [driverName, setDriverName] = useState<string>(() => {
    return currentUser?.name || 'Owner Sistem ULP Baguala';
  });
  const [driverPhone, setDriverPhone] = useState<string>('081240123456');

  // GPS Transmitter State (Mobile Phone GPS)
  const [isTransmitterActive, setIsTransmitterActive] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [pingCount, setPingCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);

  // Telemetry stats
  const [myGpsStats, setMyGpsStats] = useState<{
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    accuracy: number;
    altitude: number;
    battery: number;
    lastPingTime: string;
  } | null>(null);

  // GPS Simulation State (Demo Mode)
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);

  // Active Map View Filter & Selected Vehicle detail
  const [selectedKendaraanId, setSelectedKendaraanId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  // QR Code / Mobile Share Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Keep selectedVehicleForGps in sync if vehicle list arrives later
  useEffect(() => {
    if (!selectedVehicleForGps && kendaraanList.length > 0) {
      setSelectedVehicleForGps(kendaraanList[0].id);
    }
  }, [kendaraanList, selectedVehicleForGps]);

  // Sync current user email/name when user changes
  useEffect(() => {
    if (currentUser?.name) {
      setDriverName(currentUser.name);
    }
    if (currentUser?.username && !localStorage.getItem('pln_yantek_hp_email')) {
      const emailCandidate = currentUser.username.includes('@')
        ? currentUser.username
        : `${currentUser.username}@pln.co.id`;
      setDriverEmail(emailCandidate);
    }
  }, [currentUser]);

  // Save preferences
  useEffect(() => {
    if (selectedVehicleForGps) {
      localStorage.setItem('pln_yantek_paired_vehicle', selectedVehicleForGps);
    }
  }, [selectedVehicleForGps]);

  useEffect(() => {
    if (driverEmail) {
      localStorage.setItem('pln_yantek_hp_email', driverEmail);
    }
  }, [driverEmail]);

  // Play audio beep / haptic feedback
  const triggerPingFeedback = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(80);
      } catch (e) {}
    }
    if (soundEnabled && typeof window !== 'undefined' && (window as any).AudioContext) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch notification ping
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch (e) {}
    }
  };

  // Screen WakeLock management
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setIsWakeLockActive(true);
        wakeLockRef.current.addEventListener('release', () => {
          setIsWakeLockActive(false);
        });
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsWakeLockActive(false);
      } catch (e) {}
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on ULP Baguala / Passo Ambon
    const map = L.map(mapContainerRef.current, {
      center: [-3.6495, 128.2285],
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Dark high-contrast tile layer for modern GIS feel
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; PLN ULP Baguala Live GPS System'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      releaseWakeLock();
    };
  }, []);

  // Update Markers & Trail Lines on Map when kendaraanList updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove obsolete markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!kendaraanList.find((k) => k.id === id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    // Remove obsolete polylines
    Object.keys(polylineRef.current).forEach((id) => {
      if (!kendaraanList.find((k) => k.id === id)) {
        map.removeLayer(polylineRef.current[id]);
        delete polylineRef.current[id];
      }
    });

    // Draw / Update markers for each vehicle
    kendaraanList.forEach((k) => {
      const track = k.gpsTrack;
      if (!track || typeof track.lat !== 'number' || typeof track.lng !== 'number') return;

      const position: [number, number] = [track.lat, track.lng];
      const status = track.statusTrack || 'Berdiam';
      const isCar = k.jenisKendaraan === 'Mobil Operasional';
      const isTransmittingVehicle = isTransmitterActive && k.id === selectedVehicleForGps;

      // Badge color based on status
      let statusColor = '#10B981'; // Green = Moving
      if (status === 'Berdiam' || status === 'Siaga') statusColor = '#3B82F6'; // Blue
      if (status === 'Penanganan Gangguan') statusColor = '#EF4444'; // Red
      if (status === 'Patroli') statusColor = '#F59E0B'; // Amber

      // Custom HTML Marker Icon with Pulsing Halo & Speed Tag
      const customIcon = L.divIcon({
        className: 'custom-vehicle-gps-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            ${
              isTransmittingVehicle
                ? `<div style="
                    position: absolute;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: #10B98133;
                    border: 2px dashed #10B981;
                    animation: spin 6s linear infinite;
                  "></div>`
                : ''
            }
            <div style="
              position: absolute;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: ${statusColor}33;
              border: 2px solid ${statusColor};
              animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: #0F172A;
              border: 2.5px solid ${statusColor};
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
              transform: rotate(${track.heading || 0}deg);
              transition: transform 0.4s ease;
            ">
              ${isCar ? '🚗' : '🏍️'}
            </div>
            <div style="
              position: absolute;
              bottom: -20px;
              background: #0F172A;
              color: white;
              font-size: 9px;
              font-weight: 800;
              padding: 1px 6px;
              border-radius: 6px;
              border: 1px solid ${statusColor};
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            ">
              ${k.noPolisi} • ${(track.speedKmH || 0).toFixed(0)} km/h
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      if (markersRef.current[k.id]) {
        // Move existing marker
        markersRef.current[k.id].setLatLng(position);
        markersRef.current[k.id].setIcon(customIcon);
      } else {
        // Create new marker
        const marker = L.marker(position, { icon: customIcon }).addTo(map);

        // Bind rich popup
        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; width: 230px;">
            <div style="font-size: 10px; font-weight: 800; color: #0284C7; text-transform: uppercase; display: flex; justify-content: space-between;">
              <span>${k.jenisKendaraan}</span>
              <span style="color: #10B981; font-weight: 900;">LIVE GPS</span>
            </div>
            <div style="font-size: 13px; font-weight: 900; color: #0F172A; margin-top: 2px;">
              ${k.namaKendaraan}
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #475569;">
              No. Polisi: <span style="color: #0F172A;">${k.noPolisi}</span>
            </div>
            
            ${
              track.driverEmail
                ? `<div style="margin-top: 4px; font-size: 10px; color: #0369A1; background: #F0F9FF; padding: 3px 6px; border-radius: 6px; font-weight: 700; word-break: break-all;">
                    📧 Email HP: <strong>${track.driverEmail}</strong>
                   </div>`
                : ''
            }

            <div style="margin-top: 8px; padding: 6px; background: #F8FAFC; border-radius: 8px; font-size: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <div>
                <span style="color: #64748B;">Kecepatan:</span><br/>
                <strong style="color: #0F172A; font-size: 11px;">${(track.speedKmH || 0).toFixed(1)} km/h</strong>
              </div>
              <div>
                <span style="color: #64748B;">Baterai HP:</span><br/>
                <strong style="color: #0F172A; font-size: 11px;">${track.batteryLevel || 85}% 🔋</strong>
              </div>
              <div>
                <span style="color: #64748B;">Status:</span><br/>
                <strong style="color: ${statusColor}; font-size: 10px;">${status}</strong>
              </div>
              <div>
                <span style="color: #64748B;">Presisi GPS:</span><br/>
                <strong style="color: #0F172A; font-size: 10px;">±${(track.accuracyMeters || 5).toFixed(1)}m</strong>
              </div>
            </div>
            <div style="margin-top: 8px; font-size: 10px; color: #475569;">
              👤 Petugas: <strong>${track.driverName || k.penanggungJawab}</strong>
            </div>
            <a 
              href="https://wa.me/${(track.driverPhone || '081240123456').replace(/\D/g,'')}?text=Halo%20${encodeURIComponent(track.driverName || 'Petugas')},%20mohon%20pemberitahuan%20lokasi%20gangguan%20Yantek"
              target="_blank"
              style="
                margin-top: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                background: #10B981;
                color: white;
                font-weight: 800;
                font-size: 11px;
                padding: 6px 12px;
                border-radius: 8px;
                text-decoration: none;
              "
            >
              💬 Hubungi Petugas via WhatsApp
            </a>
          </div>
        `);

        marker.on('click', () => {
          setSelectedKendaraanId(k.id);
        });

        markersRef.current[k.id] = marker;
      }

      // Draw breadcrumbs polyline if coordinates trail exists
      if (track.breadcrumbs && track.breadcrumbs.length > 1) {
        const trailCoords: [number, number][] = track.breadcrumbs.map((b) => [b.lat, b.lng]);
        if (polylineRef.current[k.id]) {
          polylineRef.current[k.id].setLatLngs(trailCoords);
        } else {
          const polyline = L.polyline(trailCoords, {
            color: statusColor,
            weight: 3.5,
            dashArray: '6, 8',
            opacity: 0.85
          }).addTo(map);
          polylineRef.current[k.id] = polyline;
        }
      }
    });
  }, [kendaraanList, isTransmitterActive, selectedVehicleForGps]);

  // Handle HTML5 Mobile Phone Geolocation Transmitter
  const togglePhoneGpsTransmitter = async () => {
    if (isTransmitterActive) {
      // Stop tracking
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      releaseWakeLock();
      setIsTransmitterActive(false);
      setGpsError(null);
    } else {
      // Start tracking using browser / smartphone geolocation API
      if (!('geolocation' in navigator)) {
        setGpsError('Perangkat HP / Browser ini tidak mendukung HTML5 Geolocation API.');
        return;
      }

      setGpsError(null);

      // Safe fallback: grab target vehicle from selected or first in list
      const targetVehicle =
        kendaraanList.find((k) => k.id === selectedVehicleForGps) || kendaraanList[0];

      if (!targetVehicle) {
        setGpsError('Belum ada armada terdaftar. Tambahkan kendaraan operasional terlebih dahulu.');
        return;
      }

      // Update selection if fallback was used
      if (targetVehicle.id !== selectedVehicleForGps) {
        setSelectedVehicleForGps(targetVehicle.id);
      }

      // Request Screen WakeLock so phone doesn't sleep while moving
      await requestWakeLock();

      // Get initial battery if API is supported
      let batteryPct = 90;
      if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
        try {
          const b = await (navigator as any).getBattery();
          batteryPct = Math.round(b.level * 100);
        } catch (e) {}
      }

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracyMeters = pos.coords.accuracy || 3;
          const altitude = pos.coords.altitude || 12;

          // Compute realistic speed: from GPS API or calculate delta
          let speedKmH = pos.coords.speed !== null && pos.coords.speed !== undefined
            ? Math.max(0, pos.coords.speed * 3.6)
            : 0;

          // Compute heading: from GPS or bearing between last coordinate
          let heading = pos.coords.heading || 0;
          if (lastCoordsRef.current) {
            const computedHeading = calculateBearing(
              lastCoordsRef.current.lat,
              lastCoordsRef.current.lng,
              lat,
              lng
            );
            if (computedHeading > 0) heading = computedHeading;
          }
          lastCoordsRef.current = { lat, lng };

          const timeNow = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          setMyGpsStats({
            lat,
            lng,
            speed: speedKmH,
            heading,
            accuracy: accuracyMeters,
            altitude,
            battery: batteryPct,
            lastPingTime: timeNow
          });

          setPingCount((p) => p + 1);
          triggerPingFeedback();

          // Create updated track
          const existingTrail = targetVehicle.gpsTrack?.breadcrumbs || [];
          const newTrail = [
            ...existingTrail.slice(-18),
            { lat, lng, time: timeNow }
          ];

          const updatedVehicle: KendaraanOperasional = {
            ...targetVehicle,
            gpsTrack: {
              lat,
              lng,
              speedKmH,
              heading,
              accuracyMeters,
              altitude,
              batteryLevel: batteryPct,
              statusTrack: speedKmH > 4 ? 'Bergerak' : 'Berdiam',
              lastUpdated: new Date().toISOString(),
              driverName: driverName || currentUser?.name || targetVehicle.penanggungJawab,
              driverPhone: driverPhone || currentUser?.username || '081240123456',
              driverEmail: driverEmail || currentUser?.username || 'thetakanome318@gmail.com',
              breadcrumbs: newTrail
            }
          };

          // Broadcast to Firestore / App state immediately
          onUpdateKendaraan(updatedVehicle);
          setIsTransmitterActive(true);

          // Pan map to current phone location
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo([lat, lng]);
          }
        },
        (err) => {
          console.error('GPS Error:', err);
          let errMsg = 'Gagal mengakses GPS HP.';
          if (err.code === 1) errMsg = 'Izin lokasi/GPS ditolak di browser HP. Silakan aktifkan izin lokasi di Pengaturan Browser.';
          if (err.code === 2) errMsg = 'Sinyal GPS HP tidak tersedia / sedang mencari sinyal satelit.';
          if (err.code === 3) errMsg = 'Waktu permintaan GPS HP habis (timeout). Mencoba kembali...';
          setGpsError(`${errMsg} (${err.message})`);
          setIsTransmitterActive(false);
          releaseWakeLock();
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      );

      setWatchId(id);
    }
  };

  // Handle Live GPS Route Simulator for Demo / Testing
  useEffect(() => {
    let simInterval: any = null;
    if (isSimulating) {
      simInterval = setInterval(() => {
        setSimStep((prevStep) => {
          const nextIndex = (prevStep + 1) % SIMULATED_ROUTE.length;
          const waypoint = SIMULATED_ROUTE[nextIndex];

          const vehicleIdToSimulate = selectedVehicleForGps || kendaraanList[0]?.id || 'knd-01';
          const targetVehicle =
            kendaraanList.find((k) => k.id === vehicleIdToSimulate) || kendaraanList[0];

          if (targetVehicle) {
            const existingTrail = targetVehicle.gpsTrack?.breadcrumbs || [];
            const timeNow = new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            const newTrail = [
              ...existingTrail.slice(-18),
              {
                lat: waypoint.lat,
                lng: waypoint.lng,
                time: timeNow
              }
            ];

            const updatedVehicle: KendaraanOperasional = {
              ...targetVehicle,
              gpsTrack: {
                lat: waypoint.lat,
                lng: waypoint.lng,
                speedKmH: waypoint.speed,
                heading: waypoint.heading,
                accuracyMeters: 2.8,
                altitude: 18,
                batteryLevel: Math.max(45, 94 - nextIndex * 2),
                statusTrack: waypoint.speed > 0 ? 'Bergerak' : 'Berdiam',
                lastUpdated: new Date().toISOString(),
                driverName: driverName || currentUser?.name || targetVehicle.penanggungJawab,
                driverEmail: driverEmail || 'thetakanome318@gmail.com',
                breadcrumbs: newTrail
              }
            };

            onUpdateKendaraan(updatedVehicle);

            if (mapInstanceRef.current) {
              mapInstanceRef.current.panTo([waypoint.lat, waypoint.lng]);
            }
          }

          return nextIndex;
        });
      }, 3000);
    }

    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [isSimulating, selectedVehicleForGps, kendaraanList, currentUser, driverName, driverEmail]);

  // Center Map on specific vehicle
  const handleFocusVehicleOnMap = (k: KendaraanOperasional) => {
    setSelectedKendaraanId(k.id);
    if (k.gpsTrack && mapInstanceRef.current) {
      mapInstanceRef.current.setView([k.gpsTrack.lat, k.gpsTrack.lng], 16, {
        animate: true
      });
      // Open marker popup
      if (markersRef.current[k.id]) {
        markersRef.current[k.id].openPopup();
      }
    }
  };

  // Filtered vehicles
  const activeGpsList = kendaraanList.filter((k) => {
    if (!k.gpsTrack) return false;
    if (filterStatus === 'Semua') return true;
    return k.gpsTrack.statusTrack === filterStatus;
  });

  const movingCount = kendaraanList.filter(
    (k) => k.gpsTrack && (k.gpsTrack.speedKmH || 0) > 4
  ).length;
  const idleCount = kendaraanList.filter(
    (k) => k.gpsTrack && (k.gpsTrack.speedKmH || 0) <= 4
  ).length;

  const currentVehicleObj =
    kendaraanList.find((k) => k.id === selectedVehicleForGps) || kendaraanList[0];

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="space-y-5 text-slate-800">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase text-sky-400 tracking-wider">
              Total Armada GPS Live
            </div>
            <div className="text-2xl font-black text-white mt-0.5">
              {kendaraanList.length} <span className="text-xs font-normal text-slate-400">Unit</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Terhubung Cloud Firestore</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">
              Sedang Bergerak
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              {movingCount} <span className="text-xs font-normal text-slate-500">Unit</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-bold mt-1">
              Kecepatan &gt; 4 km/h (Live GPS)
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Navigation className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">
              Berdiam / Siaga
            </div>
            <div className="text-2xl font-black text-blue-700 mt-0.5">
              {idleCount} <span className="text-xs font-normal text-slate-500">Unit</span>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-1">
              Basecamp / Lokasi Gangguan
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div
          className={`rounded-2xl p-4 shadow-md flex items-center justify-between transition-all ${
            isTransmitterActive
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
              : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
          }`}
        >
          <div>
            <div className="text-[10px] font-extrabold uppercase text-white/80 tracking-wider">
              Status Transmiter HP
            </div>
            <div className="text-sm font-black text-white mt-0.5 flex items-center gap-1.5">
              {isTransmitterActive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>GPS ON (PANCAR LIVE)</span>
                </>
              ) : (
                <span>GPS HP NON-AKTIF</span>
              )}
            </div>
            <div className="text-[10px] text-white/90 font-semibold mt-1 truncate max-w-[130px]">
              {isTransmitterActive
                ? `Pings: ${pingCount} Sinyal`
                : 'Klik Aktifkan di bawah'}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-xs text-white">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Panel: Transmiter HP GPS & Email Connection */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-sky-500/30 shadow-xl space-y-4 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  Koneksi Transmiter GPS Smartphone Yantek
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase">
                  Realtime Cloud Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Koneksikan email akun HP petugas sehingga ketika HP bergerak di lapangan, posisi GPS armada di peta otomatis bergerak secara live.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 text-sky-300 border-sky-500/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={soundEnabled ? 'Suara Ping Aktif' : 'Suara Ping Senyap'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* QR Code / Share Link */}
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Buka atau Scan QR di HP Petugas"
            >
              <QrCode className="w-3.5 h-3.5 text-sky-400" />
              <span>📱 Buka di HP / Scan QR</span>
            </button>

            {/* Simulation Toggle Button */}
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isSimulating
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Simulasikan pergerakan rute patroli Yantek untuk demo"
            >
              {isSimulating ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? 'Stop Simulasi' : 'Simulasi Demo'}</span>
            </button>
          </div>
        </div>

        {/* Email & Vehicle Binding Form */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* 1. Vehicle Selector */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-sky-300 mb-1 flex items-center gap-1">
              <Car className="w-3 h-3 text-sky-400" />
              <span>1. Pilih Kendaraan Yantek:</span>
            </label>
            <select
              value={selectedVehicleForGps || currentVehicleObj?.id || ''}
              onChange={(e) => setSelectedVehicleForGps(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              {kendaraanList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.namaKendaraan} ({k.noPolisi}) - {k.jenisKendaraan}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Email HP Connection Input */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-sky-300 mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3 text-emerald-400" />
              <span>2. Email HP / Akun Petugas:</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={driverEmail}
                onChange={(e) => setDriverEmail(e.target.value)}
                placeholder="contoh: thetakanome318@gmail.com"
                className="w-full bg-slate-950/90 border border-slate-700 text-emerald-300 font-mono rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold focus:outline-none focus:border-emerald-500"
              />
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
            </div>
          </div>

          {/* 3. Driver Name / Regu */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-sky-300 mb-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-sky-400" />
              <span>3. Nama Petugas / Pengemudi:</span>
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Nama Petugas On Duty"
              className="w-full bg-slate-950/90 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* 4. Main Transmitter Trigger Button */}
          <div>
            <button
              onClick={togglePhoneGpsTransmitter}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer border ${
                isTransmitterActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-rose-950/50'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black border-emerald-300 shadow-emerald-950/50'
              }`}
            >
              <Radio className={`w-4 h-4 ${isTransmitterActive ? 'animate-ping' : ''}`} />
              <span>
                {isTransmitterActive
                  ? 'Matikan Transmiter GPS HP'
                  : '((•)) Aktifkan Transmiter GPS HP Saya'}
              </span>
            </button>
          </div>
        </div>

        {/* Verified Email Pairing Badge */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px]">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Terkoneksi ke Email Akun:</span>
            <strong className="text-emerald-400 font-mono">{driverEmail || 'thetakanome318@gmail.com'}</strong>
            <span className="text-slate-500">|</span>
            <span>Armada:</span>
            <strong className="text-sky-300">{currentVehicleObj?.namaKendaraan} ({currentVehicleObj?.noPolisi})</strong>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            {isWakeLockActive && (
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Layar HP Tetap Menyala (WakeLock ON)
              </span>
            )}
            <span>Setiap HP bergerak, koordinat GPS otomatis memutakhirkan peta secara live.</span>
          </div>
        </div>

        {/* GPS Error Alert */}
        {gpsError && (
          <div className="relative z-10 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs p-3.5 rounded-xl flex items-start gap-2.5 animate-in fade-in duration-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold">Pemberitahuan Izin Lokasi GPS:</strong>
              <p>{gpsError}</p>
              <p className="text-[10px] text-rose-300">
                💡 <strong>Tips:</strong> Pastikan Anda membuka halaman ini di browser HP (Chrome/Safari) dan memberikan izin <em>&quot;Allow Location Access / Izinkan Lokasi Saat Menggunakan Aplikasi&quot;</em>.
              </p>
            </div>
          </div>
        )}

        {/* My Live GPS Stats Bar */}
        {myGpsStats && isTransmitterActive && (
          <div className="relative z-10 bg-slate-950/95 border border-emerald-500/40 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-6 gap-3 text-center text-xs animate-in fade-in duration-300 shadow-inner">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Koordinat HP</span>
              <strong className="text-emerald-400 font-mono text-xs">
                {myGpsStats.lat.toFixed(5)}, {myGpsStats.lng.toFixed(5)}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Kecepatan Gerak</span>
              <strong className="text-white font-black text-sm">
                {myGpsStats.speed.toFixed(1)} km/h
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Arah Arah (Bearing)</span>
              <strong className="text-sky-300 font-bold text-xs flex items-center justify-center gap-1">
                <Compass className="w-3.5 h-3.5" /> {myGpsStats.heading.toFixed(0)}°
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Presisi GPS</span>
              <strong className="text-amber-300 font-bold text-xs">
                ±{myGpsStats.accuracy.toFixed(1)} meter
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Baterai HP</span>
              <strong className="text-emerald-300 font-bold text-xs flex items-center justify-center gap-1">
                <BatteryCharging className="w-3.5 h-3.5" /> {myGpsStats.battery}%
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Telemetri Pings</span>
              <strong className="text-purple-300 font-bold text-xs flex items-center justify-center gap-1">
                <Send className="w-3.5 h-3.5" /> {pingCount} Transmisi
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Map (Left) & Fleet List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Leaflet Live Map Container (2 Columns on desktop) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[560px] relative">
          <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Peta Monitoring Live GPS Armada Yantek (Ambon - ULP Baguala)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Satelit / Street Voyager GIS
              </span>
            </div>
          </div>

          {/* Map canvas */}
          <div ref={mapContainerRef} className="w-full flex-1 z-0" />

          {/* Map Floating Legend */}
          <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white p-3 rounded-2xl shadow-xl text-[10px] space-y-1.5">
            <div className="font-bold text-sky-400 uppercase tracking-wider mb-1 flex items-center justify-between gap-3">
              <span>Legenda Armada Live:</span>
              <span className="text-[9px] text-slate-400">{kendaraanList.length} Kendaraan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Bergerak (&gt; 4 km/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Berdiam / Standby Basecamp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Penanganan Gangguan</span>
            </div>
            <div className="pt-1 border-t border-slate-800 text-[9px] text-slate-400">
              📧 Terkoneksi: <span className="text-sky-300 font-mono">{driverEmail || 'thetakanome318@gmail.com'}</span>
            </div>
          </div>
        </div>

        {/* Fleet List Sidebar (1 Column) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3 h-[560px] flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Daftar Armada Yantek
              </h3>
              <span className="text-[10px] text-slate-500">
                Klik kartu untuk memfokuskan lokasi di peta
              </span>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-[10px] bg-slate-100 font-bold border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Bergerak">Bergerak</option>
              <option value="Berdiam">Berdiam</option>
              <option value="Penanganan Gangguan">Penanganan Gangguan</option>
            </select>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {activeGpsList.map((k) => {
              const track = k.gpsTrack;
              const isSelected = k.id === selectedKendaraanId;
              const isCar = k.jenisKendaraan === 'Mobil Operasional';
              const isMoving = (track?.speedKmH || 0) > 4;

              return (
                <div
                  key={k.id}
                  onClick={() => handleFocusVehicleOnMap(k)}
                  className={`p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 border-sky-400 shadow-md ring-2 ring-sky-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-900 text-white shrink-0">
                        {isCar ? <Car className="w-4 h-4 text-sky-400" /> : <Navigation className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 leading-tight">
                          {k.namaKendaraan}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold">
                          {k.noPolisi} • {k.unit || 'ULP Baguala'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        isMoving
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {track?.statusTrack || 'Siaga'}
                    </span>
                  </div>

                  {/* Connected Email Tag */}
                  {track?.driverEmail && (
                    <div className="mt-2 text-[10px] text-sky-700 bg-sky-50/80 px-2 py-1 rounded-lg border border-sky-100 font-mono truncate">
                      📧 {track.driverEmail}
                    </div>
                  )}

                  {/* GPS Metrics */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-[10px]">
                    <div>
                      <span className="text-slate-400 block font-medium">Speed</span>
                      <span className="font-black text-slate-800">
                        {(track?.speedKmH || 0).toFixed(0)} km/h
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Baterai HP</span>
                      <span className="font-bold text-emerald-600">
                        {track?.batteryLevel || 85}% 🔋
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Driver</span>
                      <span className="font-bold text-sky-700 truncate block">
                        {track?.driverName?.split(' ')[0] || 'Tim'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Updated: {track?.lastUpdated ? new Date(track.lastUpdated).toLocaleTimeString('id-ID') : 'Baru saja'}</span>
                    </span>
                    <span className="text-sky-600 font-extrabold hover:underline">
                      Lihat Peta →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* QR Code / Share Link Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Buka GPS di Smartphone Petugas</h3>
                  <p className="text-xs text-slate-500">Scan QR atau salin tautan untuk dibuka di HP</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
              {/* QR Code generator placeholder using standard Google Chart / QR API */}
              <div className="p-2 bg-white rounded-2xl shadow-md border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(appUrl)}`}
                  alt="QR Code GPS Transmitter"
                  className="w-44 h-44 rounded-lg"
                />
              </div>

              <div className="text-xs text-slate-600">
                Arahkan kamera HP Anda ke QR Code ini untuk membuka halaman monitoring di browser smartphone.
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-500">Tautan Langsung Transmiter:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(appUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
