import {
  getDbConnection,
  memoryStore,
  saveMemoryStore,
  hasValidCoordinates,
} from '../config/db.js';

function sanitizePublicKiosk(k) {
  const validCoords = hasValidCoordinates(k.latitude, k.longitude);
  const lat = validCoords ? Number(k.latitude) : null;
  const lng = validCoords ? Number(k.longitude) : null;

  // Determine live operating status
  const now = Date.now();
  const thresholdMs = (Number(process.env.HEARTBEAT_TIMEOUT_SECONDS) || 3600) * 1000;
  const lastHbTime = k.last_heartbeat ? new Date(k.last_heartbeat).getTime() : 0;
  const isRecentlySeen = lastHbTime > 0 && now - lastHbTime <= thresholdMs;

  let effectiveStatus = k.status || 'online';
  if (effectiveStatus !== 'maintenance' && effectiveStatus !== 'error' && !isRecentlySeen && k.status === 'offline') {
    effectiveStatus = 'offline';
  }

  return {
    id: k.id,
    name: k.name,
    address: k.address || k.location || '',
    city: k.city || 'Zamboanga City',
    location: k.location || '',
    latitude: lat,
    longitude: lng,
    hasValidCoordinates: validCoords,
    status: effectiveStatus,
    operatingHours: k.operating_hours || '8:00 AM - 10:00 PM Daily',
    servicesOffered: (
      k.services_offered ||
      'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer'
    )
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    currentActivity:
      effectiveStatus === 'busy'
        ? 'In Use — Cleaning Cycle Active'
        : effectiveStatus === 'maintenance'
        ? 'Scheduled Maintenance'
        : effectiveStatus === 'online'
        ? 'Available for Cleaning'
        : 'Currently Offline',
    lastHeartbeat: k.last_heartbeat || null,
  };
}

export async function getPublicKiosks(req, res) {
  try {
    const { search = '', city = '', status = '' } = req.query;
    const db = await getDbConnection();
    let rawKiosks = [];

    if (db) {
      const [rows] = await db.query(
        'SELECT id, name, address, city, location, latitude, longitude, status, is_active, is_public, operating_hours, services_offered, last_heartbeat FROM kiosks WHERE is_public = TRUE AND is_active = TRUE ORDER BY name ASC'
      );
      rawKiosks = rows;
    } else {
      rawKiosks = memoryStore.kiosks.filter(
        (k) => Boolean(k.is_public ?? 1) && Boolean(k.is_active ?? 1)
      );
    }

    const sanitizedAll = rawKiosks.map(sanitizePublicKiosk);

    // Distinct cities for filtering
    const cities = Array.from(
      new Set(sanitizedAll.map((k) => k.city).filter(Boolean))
    ).sort();

    // Apply search, city, and status filters
    const searchLower = String(search).trim().toLowerCase();
    const cityLower = String(city).trim().toLowerCase();
    const statusLower = String(status).trim().toLowerCase();

    const filtered = sanitizedAll.filter((k) => {
      if (cityLower && cityLower !== 'all' && k.city.toLowerCase() !== cityLower) {
        return false;
      }
      if (statusLower && statusLower !== 'all' && k.status.toLowerCase() !== statusLower) {
        return false;
      }
      if (searchLower) {
        const hay = `${k.name} ${k.city} ${k.address} ${k.location} ${k.id}`.toLowerCase();
        if (!hay.includes(searchLower)) return false;
      }
      return true;
    });

    res.json({
      success: true,
      count: filtered.length,
      totalPublicKiosks: sanitizedAll.length,
      cities,
      kiosks: filtered,
    });
  } catch (err) {
    console.error('[Public] Error fetching public kiosks:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getPublicKioskById(req, res) {
  try {
    const { id } = req.params;
    const db = await getDbConnection();
    let rawKiosk = null;

    if (db) {
      const [rows] = await db.query(
        'SELECT id, name, address, city, location, latitude, longitude, status, is_active, is_public, operating_hours, services_offered, last_heartbeat FROM kiosks WHERE id = ? AND is_public = TRUE AND is_active = TRUE LIMIT 1',
        [id]
      );
      if (rows.length > 0) rawKiosk = rows[0];
    } else {
      rawKiosk = memoryStore.kiosks.find(
        (k) => k.id === id && Boolean(k.is_public ?? 1) && Boolean(k.is_active ?? 1)
      );
    }

    if (!rawKiosk) {
      return res.status(404).json({
        success: false,
        message: 'Public kiosk not found.',
      });
    }

    res.json({
      success: true,
      kiosk: sanitizePublicKiosk(rawKiosk),
    });
  } catch (err) {
    console.error('[Public] Error fetching public kiosk detail:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Handles incoming customer orders and franchise / kiosk inquiries from the public landing page.
 */
export async function createInquiry(req, res) {
  try {
    const {
      fullName,
      email,
      phone,
      preferredLocation,
      inquiryType,
      estimatedPairs,
      message,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Your full name is required.' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'A contact phone number is required.' });
    }

    const cleanLocation = String(preferredLocation || 'Zamboanga City').trim();
    const cleanType = String(inquiryType || 'Order Shoe Cleaning Service').trim();
    const cleanMessage = String(message || '').trim();
    const cleanPairs = String(estimatedPairs || '1-2 pairs').trim();

    const inquiryId = `INQ-ZAM-${Date.now().toString().slice(-4)}`;
    const newInquiry = {
      id: inquiryId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      preferredLocation: cleanLocation,
      inquiryType: cleanType,
      estimatedPairs: cleanPairs,
      message: cleanMessage,
      status: 'pending', // 'pending' | 'contacted' | 'completed' | 'cancelled'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!Array.isArray(memoryStore.inquiries)) {
      memoryStore.inquiries = [];
    }
    memoryStore.inquiries.unshift(newInquiry);
    saveMemoryStore();

    res.status(201).json({
      success: true,
      message: 'Thank you! Your order request has been submitted. Our Zamboanga operations team will contact you shortly.',
      inquiry: newInquiry,
    });
  } catch (err) {
    console.error('[Public] Error submitting inquiry:', err);
    res.status(500).json({ success: false, message: 'Could not submit your request. Please try again.' });
  }
}
