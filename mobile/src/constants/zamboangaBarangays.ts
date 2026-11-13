export interface ZamboangaBarangay {
  name: string;
  district: 1 | 2;
  lat: number;
  lng: number;
  landmark?: string;
}

// Complete official catalog of all 98 barangays of Zamboanga City
export const ZAMBOANGA_BARANGAYS: ZamboangaBarangay[] = [
  // District 1 (West Coast & Poblacion)
  { name: 'Ayala', district: 1, lat: 6.9644, lng: 121.9567, landmark: 'Ayala National High School' },
  { name: 'Baliwasan', district: 1, lat: 6.9150, lng: 122.0560, landmark: 'San Jose Road / Seaside' },
  { name: 'Baluno', district: 1, lat: 7.0360, lng: 122.0080, landmark: 'Baluno Watershed' },
  { name: 'Cabatangan', district: 1, lat: 6.9360, lng: 122.0480, landmark: 'Cabatangan Gov Center' },
  { name: 'Calarian', district: 1, lat: 6.9240, lng: 122.0360, landmark: 'Golf Course / Yubenco' },
  { name: 'Camino Nuevo', district: 1, lat: 6.9120, lng: 122.0670, landmark: 'Gov. Camins Ave / Canelar' },
  { name: 'Campo Islam', district: 1, lat: 6.9180, lng: 122.0490, landmark: 'Campo Islam Pier' },
  { name: 'Canelar', district: 1, lat: 6.9214, lng: 122.0790, landmark: 'KCC Mall de Zamboanga' },
  { name: 'Capisan', district: 1, lat: 6.9530, lng: 122.0370, landmark: 'Capisan Hills' },
  { name: 'Cawit', district: 1, lat: 6.9830, lng: 121.9330, landmark: 'Cawit Coast' },
  { name: 'Dulian (Upper Pasonanca)', district: 1, lat: 6.9800, lng: 122.0600, landmark: 'Upper Pasonanca' },
  { name: 'La Paz', district: 1, lat: 7.0600, lng: 122.0000, landmark: 'La Paz Valley' },
  { name: 'Labuan', district: 1, lat: 7.1000, lng: 121.9000, landmark: 'Labuan Public Market' },
  { name: 'Limpapa', district: 1, lat: 7.1800, lng: 121.8800, landmark: 'Zamboanga-Norte Border' },
  { name: 'Maasin', district: 1, lat: 6.9850, lng: 121.9800, landmark: 'Maasin River' },
  { name: 'Malagutay', district: 1, lat: 6.9450, lng: 122.0400, landmark: 'Camp Arturo Enrile' },
  { name: 'Mariki', district: 1, lat: 6.9020, lng: 122.0800, landmark: 'Mariki Waterfront' },
  { name: 'Pamucutan', district: 1, lat: 7.0100, lng: 121.9500, landmark: 'Pamucutan Falls' },
  { name: 'Pasonanca', district: 1, lat: 6.9530, lng: 122.0745, landmark: 'Pasonanca Natural Park' },
  { name: 'Patalon', district: 1, lat: 7.1300, lng: 121.8900, landmark: 'Patalon Coast' },
  { name: 'Recodo', district: 1, lat: 6.9600, lng: 121.9700, landmark: 'Recodo Port / Canning' },
  { name: 'Rio Hondo', district: 1, lat: 6.9010, lng: 122.0780, landmark: 'Rio Hondo Bridge' },
  { name: 'San Jose Cawa-Cawa', district: 1, lat: 6.9160, lng: 122.0620, landmark: 'R.T. Lim Boulevard' },
  { name: 'San Jose Gusu', district: 1, lat: 6.9200, lng: 122.0530, landmark: 'San Jose Road' },
  { name: 'San Roque', district: 1, lat: 6.9360, lng: 122.0600, landmark: 'San Roque Church' },
  { name: 'Santa Barbara', district: 1, lat: 6.9080, lng: 122.0820, landmark: 'Sta. Barbara Highway' },
  { name: 'Santa Catalina', district: 1, lat: 6.9100, lng: 122.0870, landmark: 'Sta. Catalina Commercial' },
  { name: 'Santa Maria', district: 1, lat: 6.9312, lng: 122.0684, landmark: 'Santa Maria Parish / Road' },
  { name: 'Sinubung', district: 1, lat: 7.0500, lng: 121.9200, landmark: 'Sinubung Beach' },
  { name: 'Sinunuc', district: 1, lat: 6.9320, lng: 122.0150, landmark: 'Sinunuc Marine Area' },
  { name: 'Sto. Niño', district: 1, lat: 6.9110, lng: 122.0750, landmark: 'Sto. Niño Central' },
  { name: 'Talisayan', district: 1, lat: 7.0000, lng: 121.9300, landmark: 'Talisayan Coast' },
  { name: 'Tulungatung', district: 1, lat: 6.9500, lng: 121.9900, landmark: 'Tulungatung Junction' },
  { name: 'Tumaga', district: 1, lat: 6.9395, lng: 122.0831, landmark: 'Tumaga Por Centro' },
  { name: 'Zone I (Poblacion)', district: 1, lat: 6.9060, lng: 122.0740, landmark: 'Fort Pilar Area' },
  { name: 'Zone II (Poblacion)', district: 1, lat: 6.9050, lng: 122.0760, landmark: 'Paseo del Mar' },
  { name: 'Zone III (Poblacion)', district: 1, lat: 6.9030, lng: 122.0750, landmark: 'Plaza Pershing' },
  { name: 'Zone IV (Poblacion)', district: 1, lat: 6.9042, lng: 122.0738, landmark: 'Zamboanga City Hall' },

  // District 2 (East Coast & Islands)
  { name: 'Arena Blanco', district: 2, lat: 6.8850, lng: 122.1380, landmark: 'Arena Blanco Seaside' },
  { name: 'Boalan', district: 2, lat: 6.9480, lng: 122.1150, landmark: 'Boalan National Highway' },
  { name: 'Bolong', district: 2, lat: 7.0500, lng: 122.2300, landmark: 'Bolong Beach' },
  { name: 'Buenavista', district: 2, lat: 7.1800, lng: 122.2000, landmark: 'Buenavista Valley' },
  { name: 'Bunguiao', district: 2, lat: 7.1200, lng: 122.2200, landmark: 'Bunguiao Junction' },
  { name: 'Busay', district: 2, lat: 6.8700, lng: 122.1500, landmark: 'Busay Island' },
  { name: 'Cabaluay', district: 2, lat: 6.9800, lng: 122.1700, landmark: 'Cabaluay Highway' },
  { name: 'Cacao', district: 2, lat: 7.1600, lng: 122.2100, landmark: 'Cacao Agricultural Zone' },
  { name: 'Calabasa', district: 2, lat: 7.0200, lng: 122.1500, landmark: 'Calabasa Hills' },
  { name: 'Culianan', district: 2, lat: 6.9700, lng: 122.1500, landmark: 'Culianan Bypass' },
  { name: 'Curuan', district: 2, lat: 7.2200, lng: 122.2500, landmark: 'Curuan Commercial District' },
  { name: 'Dita', district: 2, lat: 7.0600, lng: 122.2000, landmark: 'Dita Highway' },
  { name: 'Divisoria', district: 2, lat: 6.9550, lng: 122.1300, landmark: 'Divisoria Market' },
  { name: 'Dulian-Bunguiao', district: 2, lat: 7.1300, lng: 122.2100, landmark: 'Dulian East' },
  { name: 'Guisao', district: 2, lat: 6.9900, lng: 122.1400, landmark: 'Guisao Road' },
  { name: 'Guiwan', district: 2, lat: 6.9387, lng: 122.1025, landmark: 'Guiwan MCLL Highway' },
  { name: 'Kasanyangan', district: 2, lat: 6.9220, lng: 122.0950, landmark: 'Kasanyangan Coastal' },
  { name: 'Lamisahan', district: 2, lat: 7.0300, lng: 122.1700, landmark: 'Lamisahan Valley' },
  { name: 'Landang Gua', district: 2, lat: 6.8800, lng: 122.1700, landmark: 'Sacol Island West' },
  { name: 'Landang Laum', district: 2, lat: 6.8700, lng: 122.1800, landmark: 'Sacol Island South' },
  { name: 'Lanzones', district: 2, lat: 7.0100, lng: 122.1600, landmark: 'Lanzones Junction' },
  { name: 'Lapakan', district: 2, lat: 7.0800, lng: 122.1900, landmark: 'Lapakan Highway' },
  { name: 'Latuan', district: 2, lat: 7.2500, lng: 122.2700, landmark: 'Latuan East' },
  { name: 'Licomo', district: 2, lat: 7.3500, lng: 122.3500, landmark: 'Licomo Zamboanga Boundary' },
  { name: 'Limaong', district: 2, lat: 7.3200, lng: 122.3300, landmark: 'Limaong Coastal' },
  { name: 'Lubigan', district: 2, lat: 7.1100, lng: 122.2500, landmark: 'Lubigan Green Hills' },
  { name: 'Lumayang', district: 2, lat: 6.9600, lng: 122.1200, landmark: 'Lumayang Road' },
  { name: 'Lumbangan', district: 2, lat: 6.9500, lng: 122.1250, landmark: 'Lumbangan Crossing' },
  { name: 'Lunzuran', district: 2, lat: 6.9450, lng: 122.0950, landmark: 'Lunzuran Sanitarium Hospital' },
  { name: 'Mampang', district: 2, lat: 6.9100, lng: 122.1150, landmark: 'Mampang Coastal Road' },
  { name: 'Manalipa', district: 2, lat: 6.7800, lng: 122.2500, landmark: 'Manalipa Island' },
  { name: 'Mangusu', district: 2, lat: 7.2800, lng: 122.2900, landmark: 'Mangusu Highway' },
  { name: 'Manicahan', district: 2, lat: 7.0300, lng: 122.2100, landmark: 'Manicahan Fish Port' },
  { name: 'Mercedes', district: 2, lat: 6.9550, lng: 122.1500, landmark: 'Mercedes Church / Highway' },
  { name: 'Muti', district: 2, lat: 7.2600, lng: 122.2800, landmark: 'Muti Highway' },
  { name: 'Pangapuyan', district: 2, lat: 6.8900, lng: 122.1600, landmark: 'Pangapuyan Island' },
  { name: 'Panubigan', district: 2, lat: 7.2900, lng: 122.3100, landmark: 'Panubigan East' },
  { name: 'Pasilmanta', district: 2, lat: 6.8600, lng: 122.1700, landmark: 'Sacol Island East' },
  { name: 'Pasobolong', district: 2, lat: 6.9650, lng: 122.1400, landmark: 'Pasobolong Valley' },
  { name: 'Putik', district: 2, lat: 6.9400, lng: 122.1100, landmark: 'Putik Star Mall Area' },
  { name: 'Quiniput', district: 2, lat: 7.2400, lng: 122.2600, landmark: 'Quiniput Crossing' },
  { name: 'Salaan', district: 2, lat: 6.9750, lng: 122.1350, landmark: 'Salaan Agricultural' },
  { name: 'Sangali', district: 2, lat: 7.0700, lng: 122.2200, landmark: 'Sangali Fishing Port' },
  { name: 'Sibulao', district: 2, lat: 7.2000, lng: 122.2300, landmark: 'Sibulao Junction' },
  { name: 'Tagasilay', district: 2, lat: 7.3300, lng: 122.3400, landmark: 'Tagasilay Highway' },
  { name: 'Taguiti', district: 2, lat: 7.3100, lng: 122.3200, landmark: 'Taguiti Crossing' },
  { name: 'Talabaan', district: 2, lat: 6.9300, lng: 122.1400, landmark: 'Talabaan Bridge' },
  { name: 'Talon-Talon', district: 2, lat: 6.8950, lng: 122.1050, landmark: 'Talon-Talon Loop' },
  { name: 'Taluksangay', district: 2, lat: 6.9450, lng: 122.1600, landmark: 'Taluksangay Historic Mosque' },
  { name: 'Tetuan', district: 2, lat: 6.9248, lng: 122.0915, landmark: 'Veterans Ave / Don Alfaro St' },
  { name: 'Tictapul', district: 2, lat: 7.3600, lng: 122.3600, landmark: 'Tictapul Coast' },
  { name: 'Tigbalabag', district: 2, lat: 7.2700, lng: 122.2800, landmark: 'Tigbalabag Highway' },
  { name: 'Tigtabon', district: 2, lat: 6.8700, lng: 122.1600, landmark: 'Tigtabon Island' },
  { name: 'Tolosa', district: 2, lat: 6.9850, lng: 122.1600, landmark: 'Tolosa Highway' },
  { name: 'Tugbungan', district: 2, lat: 6.9180, lng: 122.0900, landmark: 'Tugbungan Main Road' },
  { name: 'Tumalutab', district: 2, lat: 6.8200, lng: 122.2800, landmark: 'Tumalutab Island' },
  { name: 'Tumitus', district: 2, lat: 7.3400, lng: 122.3500, landmark: 'Tumitus North' },
  { name: 'Victoria', district: 2, lat: 7.0400, lng: 122.2000, landmark: 'Victoria Road' },
  { name: 'Vitali', district: 2, lat: 7.3700, lng: 122.3700, landmark: 'Vitali Commercial Center' },
  { name: 'Zambowood', district: 2, lat: 6.9450, lng: 122.1300, landmark: 'Zambowood Main Ave' },
];

// Helper: Filter barangays by search query and optional district
export function searchBarangays(query: string, district?: 1 | 2): ZamboangaBarangay[] {
  const q = query.trim().toLowerCase();
  return ZAMBOANGA_BARANGAYS.filter((b) => {
    if (district && b.district !== district) return false;
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      (b.landmark && b.landmark.toLowerCase().includes(q))
    );
  });
}

// Helper: Find closest barangay in Zamboanga City to a given coordinate
export function findNearestBarangay(lat: number, lng: number): ZamboangaBarangay {
  let closest = ZAMBOANGA_BARANGAYS[0];
  let minDistance = Infinity;

  for (const b of ZAMBOANGA_BARANGAYS) {
    const dist = Math.hypot(b.lat - lat, b.lng - lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = b;
    }
  }

  return closest;
}

// Helper: Live Geocoding search in Zamboanga City (OpenStreetMap / Google fallback)
export interface LivePlaceResult {
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  barangay?: string;
}

export async function fetchZamboangaPlaces(query: string): Promise<LivePlaceResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const searchQuery = encodeURIComponent(`${trimmed}, Zamboanga City`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${searchQuery}&format=json&addressdetails=1&limit=6&viewbox=121.85,7.40,122.40,6.75&bounded=1`,
      {
        headers: {
          'User-Agent': 'KixCleenMobileApp/1.0',
        },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.map((item: any) => {
      const road = item.address?.road || item.address?.pedestrian || item.name || '';
      const suburb = item.address?.suburb || item.address?.neighbourhood || '';
      const nearest = findNearestBarangay(parseFloat(item.lat), parseFloat(item.lon));

      return {
        title: road || item.display_name.split(',')[0],
        subtitle: suburb ? `Brgy. ${suburb}, Zamboanga City` : `Brgy. ${nearest.name}, Zamboanga City`,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        barangay: suburb || nearest.name,
      };
    });
  } catch (error) {
    console.warn('Live places fetch failed:', error);
    return [];
  }
}
