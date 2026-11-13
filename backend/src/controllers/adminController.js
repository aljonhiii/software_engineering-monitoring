import crypto from 'crypto';
import {
  getDbConnection,
  memoryStore,
  saveMemoryStore,
  hasValidCoordinates,
} from '../config/db.js';
import { hashInviteToken } from './authController.js';

const KIOSK_BASE_URL = process.env.KIOSK_BASE_URL || 'http://localhost:8081';

function parseCoordinate(val, min, max, label) {
  if (val === null || val === undefined || val === '') {
    return { value: null, error: null };
  }
  const num = Number(val);
  if (!Number.isFinite(num) || num < min || num > max) {
    return {
      value: null,
      error: `Invalid ${label}: must be a number between ${min} and ${max}.`,
    };
  }
  return { value: Number(num.toFixed(7)), error: null };
}

async function fetchAllDataForAdmin() {
  const db = await getDbConnection();
  if (db) {
    const [users] = await db.query(
      'SELECT id, username, email, full_name, phone, company_name, role, is_active, account_status, invite_expires_at, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    const [kiosks] = await db.query('SELECT * FROM kiosks ORDER BY created_at ASC');
    const [owners] = await db.query('SELECT * FROM kiosk_owners ORDER BY assigned_at DESC');
    const [machineStatuses] = await db.query('SELECT * FROM machine_status');
    return { db, users, kiosks, owners, machineStatuses };
  } else {
    saveMemoryStore();
    return {
      db: null,
      users: memoryStore.users,
      kiosks: memoryStore.kiosks,
      owners: memoryStore.kiosk_owners,
      machineStatuses: memoryStore.machine_status,
    };
  }
}

function formatAdminKiosk(k, owners, users, machineStatuses) {
  const ms = machineStatuses.find((m) => m.kiosk_id === k.id);
  const ownerRow = owners.find((o) => o.kiosk_id === k.id);
  const buyer = ownerRow ? users.find((u) => u.id === ownerRow.buyer_id) : null;

  const validCoords = hasValidCoordinates(k.latitude, k.longitude);
  const status = ms?.status || k.status || 'offline';

  return {
    id: k.id,
    name: k.name,
    address: k.address || '',
    city: k.city || '',
    location: k.location || '',
    latitude: validCoords ? Number(k.latitude) : null,
    longitude: validCoords ? Number(k.longitude) : null,
    hasValidCoordinates: validCoords,
    status,
    isActive: Boolean(k.is_active ?? 1),
    isPublic: Boolean(k.is_public ?? 1),
    operatingHours: k.operating_hours || '8:00 AM - 10:00 PM Daily',
    servicesOffered: k.services_offered || 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer',
    doorLocked: Boolean(ms?.door_locked ?? k.door_locked),
    waterLevelPercent: ms?.water_level_pct ?? k.water_level_pct ?? 100,
    soapLevelPercent: ms?.soap_level_pct ?? k.soap_level_pct ?? 100,
    currentOrderId: ms?.current_order_id ?? k.current_order_id ?? null,
    currentActivity: ms?.current_activity || k.current_activity || 'Idle',
    lastHeartbeat: ms?.last_heartbeat || k.last_heartbeat || null,
    createdAt: k.created_at,
    updatedAt: k.updated_at || k.created_at,
    owner: buyer
      ? {
          assignmentId: ownerRow.id,
          buyerId: buyer.id,
          fullName: buyer.full_name,
          email: buyer.email,
          username: buyer.username,
          companyName: buyer.company_name || null,
          isActive: Boolean(buyer.is_active),
          assignedAt: ownerRow.assigned_at,
          notes: ownerRow.notes || null,
        }
      : null,
  };
}

function formatAdminBuyer(u, owners, kiosks) {
  const userAssignments = owners.filter((o) => o.buyer_id === u.id);
  const assignedKiosks = userAssignments
    .map((o) => {
      const k = kiosks.find((kItem) => kItem.id === o.kiosk_id);
      if (!k) return null;
      return {
        id: k.id,
        name: k.name,
        city: k.city || '',
        address: k.address || k.location || '',
        status: k.status || 'offline',
        isActive: Boolean(k.is_active ?? 1),
        assignedAt: o.assigned_at,
        launcherUrl: `${KIOSK_BASE_URL}/?kioskId=${k.id}`,
      };
    })
    .filter(Boolean);

  return {
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.full_name,
    phone: u.phone || '',
    companyName: u.company_name || '',
    role: u.role === 'owner' ? 'buyer' : u.role,
    isActive: Boolean(u.is_active),
    accountStatus: !u.is_active
      ? 'deactivated'
      : u.account_status || 'active',
    inviteExpiresAt: u.invite_expires_at || null,
    assignedKiosksCount: assignedKiosks.length,
    assignedKiosks,
    createdAt: u.created_at,
    updatedAt: u.updated_at || u.created_at,
  };
}

/**
 * GET /api/admin/overview
 */
export async function getAdminOverview(req, res) {
  try {
    const { users, kiosks, owners, machineStatuses } = await fetchAllDataForAdmin();

    const formattedKiosks = kiosks.map((k) =>
      formatAdminKiosk(k, owners, users, machineStatuses)
    );
    const buyers = users
      .filter((u) => u.role === 'buyer' || u.role === 'owner')
      .map((u) => formatAdminBuyer(u, owners, kiosks));

    const activeKiosks = formattedKiosks.filter((k) => k.isActive).length;
    const inactiveKiosks = formattedKiosks.filter((k) => !k.isActive).length;
    const assignedKiosks = formattedKiosks.filter((k) => k.owner !== null).length;
    const unassignedKiosks = formattedKiosks.filter((k) => k.owner === null).length;

    const statusBreakdown = {
      online: formattedKiosks.filter((k) => k.isActive && k.status === 'online').length,
      busy: formattedKiosks.filter((k) => k.isActive && k.status === 'busy').length,
      maintenance: formattedKiosks.filter((k) => k.isActive && k.status === 'maintenance').length,
      offline: formattedKiosks.filter((k) => !k.isActive || k.status === 'offline' || k.status === 'error').length,
    };

    const activeBuyers = buyers.filter((b) => b.isActive && b.accountStatus === 'active').length;
    const invitedBuyers = buyers.filter((b) => b.accountStatus === 'invited').length;
    const deactivatedBuyers = buyers.filter((b) => !b.isActive || b.accountStatus === 'deactivated').length;

    res.json({
      success: true,
      overview: {
        totalKiosks: formattedKiosks.length,
        activeKiosks,
        inactiveKiosks,
        assignedKiosks,
        unassignedKiosks,
        statusBreakdown,
        totalBuyers: buyers.length,
        activeBuyers,
        invitedBuyers,
        deactivatedBuyers,
        kiosks: formattedKiosks,
        recentBuyers: buyers.slice(0, 5),
      },
    });
  } catch (err) {
    console.error('[Admin] Error fetching overview:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * GET /api/admin/kiosks
 */
export async function getAdminKiosks(req, res) {
  try {
    const { users, kiosks, owners, machineStatuses } = await fetchAllDataForAdmin();
    const formatted = kiosks.map((k) =>
      formatAdminKiosk(k, owners, users, machineStatuses)
    );
    res.json({
      success: true,
      count: formatted.length,
      kiosks: formatted,
    });
  } catch (err) {
    console.error('[Admin] Error listing kiosks:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * POST /api/admin/kiosks
 */
export async function createAdminKiosk(req, res) {
  try {
    const {
      id,
      name,
      address = '',
      city = '',
      location = '',
      latitude = null,
      longitude = null,
      status = 'online',
      isActive = true,
      isPublic = true,
      operatingHours = '8:00 AM - 10:00 PM Daily',
      servicesOffered = 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer',
      buyerId = null,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Kiosk name is required.',
      });
    }

    if (!address && !location) {
      return res.status(400).json({
        success: false,
        message: 'Kiosk street address or location description is required.',
      });
    }

    const latCheck = parseCoordinate(latitude, -90, 90, 'latitude');
    if (latCheck.error) {
      return res.status(400).json({ success: false, message: latCheck.error });
    }
    const lngCheck = parseCoordinate(longitude, -180, 180, 'longitude');
    if (lngCheck.error) {
      return res.status(400).json({ success: false, message: lngCheck.error });
    }

    if ((latCheck.value !== null && lngCheck.value === null) || (latCheck.value === null && lngCheck.value !== null)) {
      return res.status(400).json({
        success: false,
        message: 'Both latitude and longitude must be provided together, or both left blank.',
      });
    }

    const kioskId = (id && String(id).trim().toUpperCase()) || `KIOSK-${Date.now().toString().slice(-5)}`;
    const cleanName = String(name).trim();
    const cleanAddress = String(address || location).trim();
    const cleanCity = String(city || 'Metro Manila').trim();
    const cleanLocation = String(location || address).trim();
    const validStatuses = ['online', 'offline', 'busy', 'error', 'maintenance'];
    const cleanStatus = validStatuses.includes(status) ? status : 'online';

    const db = await getDbConnection();

    if (db) {
      const [existing] = await db.query('SELECT id FROM kiosks WHERE id = ? LIMIT 1', [kioskId]);
      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: `A kiosk with ID '${kioskId}' is already registered.`,
        });
      }

      await db.query(
        `INSERT INTO kiosks 
         (id, name, address, city, location, latitude, longitude, status, is_active, is_public, operating_hours, services_offered, door_locked, water_level_pct, soap_level_pct, current_activity, last_heartbeat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, 100, 100, 'Idle - Ready for customer', NOW())`,
        [
          kioskId,
          cleanName,
          cleanAddress,
          cleanCity,
          cleanLocation,
          latCheck.value,
          lngCheck.value,
          cleanStatus,
          Boolean(isActive),
          Boolean(isPublic),
          operatingHours,
          servicesOffered,
        ]
      );

      await db.query(
        `INSERT INTO machine_status (kiosk_id, status, door_locked, water_level_pct, soap_level_pct, current_activity, last_heartbeat)
         VALUES (?, ?, FALSE, 100, 100, 'Idle - Ready for customer', NOW())
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [kioskId, cleanStatus]
      );

      if (buyerId) {
        await db.query(
          'INSERT INTO kiosk_owners (kiosk_id, buyer_id, assigned_by, notes) VALUES (?, ?, ?, ?)',
          [kioskId, buyerId, req.user.id, 'Assigned during kiosk registration']
        );
      }
    } else {
      if (memoryStore.kiosks.some((k) => k.id.toLowerCase() === kioskId.toLowerCase())) {
        return res.status(409).json({
          success: false,
          message: `A kiosk with ID '${kioskId}' is already registered.`,
        });
      }

      const nowIso = new Date().toISOString();
      memoryStore.kiosks.push({
        id: kioskId,
        name: cleanName,
        address: cleanAddress,
        city: cleanCity,
        location: cleanLocation,
        latitude: latCheck.value,
        longitude: lngCheck.value,
        status: cleanStatus,
        is_active: isActive ? 1 : 0,
        is_public: isPublic ? 1 : 0,
        operating_hours: operatingHours,
        services_offered: servicesOffered,
        door_locked: 0,
        water_level_pct: 100,
        soap_level_pct: 100,
        current_order_id: null,
        current_activity: 'Idle - Ready for customer',
        last_heartbeat: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
      });

      memoryStore.machine_status.push({
        kiosk_id: kioskId,
        status: cleanStatus,
        door_locked: 0,
        water_level_pct: 100,
        soap_level_pct: 100,
        current_order_id: null,
        current_activity: 'Idle - Ready for customer',
        error_code: null,
        last_heartbeat: nowIso,
        updated_at: nowIso,
      });

      if (buyerId) {
        memoryStore.kiosk_owners.push({
          id: Date.now(),
          kiosk_id: kioskId,
          buyer_id: buyerId,
          assigned_by: req.user.id,
          notes: 'Assigned during kiosk registration',
          assigned_at: nowIso,
        });
      }
    }

    const { users, kiosks, owners, machineStatuses } = await fetchAllDataForAdmin();
    const createdRaw = kiosks.find((k) => k.id === kioskId);

    res.status(201).json({
      success: true,
      message: `Kiosk '${cleanName}' (${kioskId}) registered successfully.`,
      kiosk: formatAdminKiosk(createdRaw, owners, users, machineStatuses),
    });
  } catch (err) {
    console.error('[Admin] Error creating kiosk:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/kiosks/:id
 */
export async function updateAdminKiosk(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      city,
      location,
      latitude,
      longitude,
      status,
      isActive,
      isPublic,
      operatingHours,
      servicesOffered,
    } = req.body;

    const latCheck = parseCoordinate(latitude, -90, 90, 'latitude');
    if (latCheck.error) {
      return res.status(400).json({ success: false, message: latCheck.error });
    }
    const lngCheck = parseCoordinate(longitude, -180, 180, 'longitude');
    if (lngCheck.error) {
      return res.status(400).json({ success: false, message: lngCheck.error });
    }

    if ((latCheck.value !== null && lngCheck.value === null) || (latCheck.value === null && lngCheck.value !== null)) {
      return res.status(400).json({
        success: false,
        message: 'Both latitude and longitude must be provided together, or both left blank.',
      });
    }

    const db = await getDbConnection();

    if (db) {
      const [rows] = await db.query('SELECT * FROM kiosks WHERE id = ? LIMIT 1', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Kiosk not found.' });
      }
      const existing = rows[0];

      const nextName = name !== undefined ? String(name).trim() : existing.name;
      const nextAddress = address !== undefined ? String(address).trim() : existing.address;
      const nextCity = city !== undefined ? String(city).trim() : existing.city;
      const nextLocation = location !== undefined ? String(location).trim() : existing.location;
      const nextLat = latitude !== undefined ? latCheck.value : existing.latitude;
      const nextLng = longitude !== undefined ? lngCheck.value : existing.longitude;
      const nextStatus = status !== undefined ? status : existing.status;
      const nextActive = isActive !== undefined ? Boolean(isActive) : Boolean(existing.is_active);
      const nextPublic = isPublic !== undefined ? Boolean(isPublic) : Boolean(existing.is_public);
      const nextHours = operatingHours !== undefined ? operatingHours : existing.operating_hours;
      const nextServices = servicesOffered !== undefined ? servicesOffered : existing.services_offered;

      await db.query(
        `UPDATE kiosks
         SET name = ?, address = ?, city = ?, location = ?, latitude = ?, longitude = ?, status = ?, is_active = ?, is_public = ?, operating_hours = ?, services_offered = ?
         WHERE id = ?`,
        [
          nextName,
          nextAddress,
          nextCity,
          nextLocation,
          nextLat,
          nextLng,
          nextStatus,
          nextActive,
          nextPublic,
          nextHours,
          nextServices,
          id,
        ]
      );

      if (status !== undefined) {
        await db.query('UPDATE machine_status SET status = ? WHERE kiosk_id = ?', [nextStatus, id]);
      }
    } else {
      const k = memoryStore.kiosks.find((item) => item.id === id);
      if (!k) {
        return res.status(404).json({ success: false, message: 'Kiosk not found.' });
      }

      if (name !== undefined) k.name = String(name).trim();
      if (address !== undefined) k.address = String(address).trim();
      if (city !== undefined) k.city = String(city).trim();
      if (location !== undefined) k.location = String(location).trim();
      if (latitude !== undefined) k.latitude = latCheck.value;
      if (longitude !== undefined) k.longitude = lngCheck.value;
      if (status !== undefined) {
        k.status = status;
        const ms = memoryStore.machine_status.find((m) => m.kiosk_id === id);
        if (ms) ms.status = status;
      }
      if (isActive !== undefined) k.is_active = isActive ? 1 : 0;
      if (isPublic !== undefined) k.is_public = isPublic ? 1 : 0;
      if (operatingHours !== undefined) k.operating_hours = operatingHours;
      if (servicesOffered !== undefined) k.services_offered = servicesOffered;
      k.updated_at = new Date().toISOString();
    }

    const { users, kiosks, owners, machineStatuses } = await fetchAllDataForAdmin();
    const updatedRaw = kiosks.find((k) => k.id === id);

    res.json({
      success: true,
      message: 'Kiosk updated successfully.',
      kiosk: formatAdminKiosk(updatedRaw, owners, users, machineStatuses),
    });
  } catch (err) {
    console.error('[Admin] Error updating kiosk:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * PATCH /api/admin/kiosks/:id/status
 */
export async function updateAdminKioskStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, isActive, isPublic } = req.body;

    const db = await getDbConnection();
    if (db) {
      const [rows] = await db.query('SELECT * FROM kiosks WHERE id = ? LIMIT 1', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Kiosk not found.' });
      }
      const existing = rows[0];
      const nextStatus = status !== undefined ? status : existing.status;
      const nextActive = isActive !== undefined ? Boolean(isActive) : Boolean(existing.is_active);
      const nextPublic = isPublic !== undefined ? Boolean(isPublic) : Boolean(existing.is_public);

      await db.query(
        'UPDATE kiosks SET status = ?, is_active = ?, is_public = ? WHERE id = ?',
        [nextStatus, nextActive, nextPublic, id]
      );
      if (status !== undefined) {
        await db.query('UPDATE machine_status SET status = ? WHERE kiosk_id = ?', [nextStatus, id]);
      }
    } else {
      const k = memoryStore.kiosks.find((item) => item.id === id);
      if (!k) {
        return res.status(404).json({ success: false, message: 'Kiosk not found.' });
      }
      if (status !== undefined) {
        k.status = status;
        const ms = memoryStore.machine_status.find((m) => m.kiosk_id === id);
        if (ms) ms.status = status;
      }
      if (isActive !== undefined) k.is_active = isActive ? 1 : 0;
      if (isPublic !== undefined) k.is_public = isPublic ? 1 : 0;
      k.updated_at = new Date().toISOString();
    }

    const { users, kiosks, owners, machineStatuses } = await fetchAllDataForAdmin();
    const updatedRaw = kiosks.find((k) => k.id === id);

    res.json({
      success: true,
      message: 'Kiosk status updated.',
      kiosk: formatAdminKiosk(updatedRaw, owners, users, machineStatuses),
    });
  } catch (err) {
    console.error('[Admin] Error updating kiosk status:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * GET /api/admin/buyers
 */
export async function getAdminBuyers(req, res) {
  try {
    const { users, kiosks, owners } = await fetchAllDataForAdmin();
    const buyers = users
      .filter((u) => u.role === 'buyer' || u.role === 'owner')
      .map((u) => formatAdminBuyer(u, owners, kiosks));

    res.json({
      success: true,
      count: buyers.length,
      buyers,
    });
  } catch (err) {
    console.error('[Admin] Error listing buyers:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * POST /api/admin/buyers
 * Implements the Buyer Account Creation & Invitation Workflow:
 * - Creates buyer account without Super Admin setting/viewing plaintext password
 * - Generates secure one-time invitation token & setup link
 * - Optionally assigns selected kiosks immediately
 */
export async function createAdminBuyer(req, res) {
  try {
    const {
      fullName,
      email,
      username,
      phone = '',
      companyName = '',
      kioskIds = [],
      allowTransfer = false,
      createDedicatedKiosk = false,
      dedicatedKioskId,
      dedicatedKioskName,
      dedicatedKioskCity,
      dedicatedKioskAddress,
    } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Buyer full name and email address are required.',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    const cleanUsername =
      (username && String(username).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')) ||
      cleanEmail.split('@')[0].replace(/[^a-z0-9._-]/g, '') +
        Math.floor(10 + Math.random() * 90);

    const { db, users, kiosks, owners } = await fetchAllDataForAdmin();

    // Check duplicate email or username
    const duplicate = users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.username.toLowerCase() === cleanUsername
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `An account with email '${cleanEmail}' or username '${cleanUsername}' already exists.`,
      });
    }

    const buyerId = `USR-BUYER-${Date.now().toString().slice(-6)}`;
    const rawInviteToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = hashInviteToken(rawInviteToken);
    const expiresAtDate = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days

    // Dedicated Kiosk Provisioning for this Owner
    let provisionedKiosk = null;
    const requestedKioskIds = Array.isArray(kioskIds) ? [...kioskIds.filter(Boolean)] : [];

    const shouldCreateDedicated = Boolean(
      createDedicatedKiosk === true ||
      createDedicatedKiosk === 'true' ||
      dedicatedKioskId ||
      dedicatedKioskName
    );

    if (shouldCreateDedicated) {
      let targetKioskId =
        (dedicatedKioskId && String(dedicatedKioskId).trim().toUpperCase()) ||
        `KIOSK-${cleanUsername.toUpperCase().replace(/[^A-Z0-9]/g, '')}-01`;

      let counter = 1;
      while (kiosks.some((k) => k.id.toLowerCase() === targetKioskId.toLowerCase())) {
        counter++;
        targetKioskId = `KIOSK-${cleanUsername.toUpperCase().replace(/[^A-Z0-9]/g, '')}-0${counter}`;
      }

      const targetKioskName =
        (dedicatedKioskName && String(dedicatedKioskName).trim()) ||
        `KixCleen Vendo — ${String(fullName).trim()} Branch`;
      const targetCity = (dedicatedKioskCity && String(dedicatedKioskCity).trim()) || 'Metro Manila';
      const targetAddress =
        (dedicatedKioskAddress && String(dedicatedKioskAddress).trim()) || 'Main Commercial Station';

      provisionedKiosk = {
        id: targetKioskId,
        name: targetKioskName,
        city: targetCity,
        address: targetAddress,
        location: targetAddress,
        status: 'online',
        is_active: 1,
        is_public: 1,
        operating_hours: '8:00 AM - 10:00 PM Daily',
        services_offered: 'Sanitation, Disinfection, Deodorize, UV Light Bacterial Removal, Dryer',
        door_locked: 0,
        water_level_pct: 100,
        soap_level_pct: 100,
        current_activity: 'Idle - Ready for customer',
      };

      if (!requestedKioskIds.includes(targetKioskId)) {
        requestedKioskIds.push(targetKioskId);
      }
    }

    // Validate any other requested kiosk assignments if provided
    for (const kId of requestedKioskIds) {
      if (provisionedKiosk && kId === provisionedKiosk.id) continue;
      const kExists = kiosks.some((k) => k.id === kId);
      if (!kExists) {
        return res.status(404).json({
          success: false,
          message: `Kiosk '${kId}' does not exist.`,
        });
      }
      const existingOwner = owners.find((o) => o.kiosk_id === kId);
      if (existingOwner && !allowTransfer) {
        const currentBuyer = users.find((u) => u.id === existingOwner.buyer_id);
        return res.status(409).json({
          success: false,
          message: `Kiosk '${kId}' is already assigned to ${currentBuyer?.full_name || existingOwner.buyer_id}. Enable ownership transfer to reassign it.`,
        });
      }
    }

    if (db) {
      await db.query(
        `INSERT INTO users 
         (id, username, email, password_hash, full_name, phone, company_name, role, is_active, account_status, invite_token_hash, invite_expires_at)
         VALUES (?, ?, ?, NULL, ?, ?, ?, 'buyer', TRUE, 'invited', ?, ?)`,
        [
          buyerId,
          cleanUsername,
          cleanEmail,
          String(fullName).trim(),
          String(phone).trim() || null,
          String(companyName).trim() || null,
          tokenHash,
          expiresAtDate,
        ]
      );

      if (provisionedKiosk) {
        await db.query(
          `INSERT INTO kiosks 
           (id, name, address, city, location, latitude, longitude, status, is_active, is_public, operating_hours, services_offered, door_locked, water_level_pct, soap_level_pct, current_activity, last_heartbeat)
           VALUES (?, ?, ?, ?, ?, NULL, NULL, 'online', TRUE, TRUE, ?, ?, FALSE, 100, 100, 'Idle - Ready for customer', NOW())`,
          [
            provisionedKiosk.id,
            provisionedKiosk.name,
            provisionedKiosk.address,
            provisionedKiosk.city,
            provisionedKiosk.location,
            provisionedKiosk.operating_hours,
            provisionedKiosk.services_offered,
          ]
        );

        await db.query(
          `INSERT INTO machine_status (kiosk_id, status, door_locked, water_level_pct, soap_level_pct, current_activity, last_heartbeat)
           VALUES (?, 'online', FALSE, 100, 100, 'Idle - Ready for customer', NOW())
           ON DUPLICATE KEY UPDATE status = 'online'`,
          [provisionedKiosk.id]
        );
      }

      for (const kId of requestedKioskIds) {
        await db.query(
          `INSERT INTO kiosk_owners (kiosk_id, buyer_id, assigned_by, notes)
           VALUES (?, ?, ?, 'Dedicated kiosk assigned on owner onboarding')
           ON DUPLICATE KEY UPDATE buyer_id = VALUES(buyer_id), assigned_by = VALUES(assigned_by), assigned_at = NOW()`,
          [kId, buyerId, req.user.id]
        );
      }
    } else {
      const nowIso = new Date().toISOString();
      memoryStore.users.unshift({
        id: buyerId,
        username: cleanUsername,
        email: cleanEmail,
        password_hash: null,
        full_name: String(fullName).trim(),
        phone: String(phone).trim() || null,
        company_name: String(companyName).trim() || null,
        role: 'buyer',
        is_active: 1,
        account_status: 'invited',
        invite_token_hash: tokenHash,
        invite_expires_at: expiresAtDate.toISOString(),
        created_at: nowIso,
        updated_at: nowIso,
      });

      if (provisionedKiosk) {
        memoryStore.kiosks.push({
          ...provisionedKiosk,
          latitude: null,
          longitude: null,
          last_heartbeat: nowIso,
          created_at: nowIso,
          updated_at: nowIso,
        });

        memoryStore.machine_status.push({
          kiosk_id: provisionedKiosk.id,
          status: 'online',
          door_locked: 0,
          water_level_pct: 100,
          soap_level_pct: 100,
          current_order_id: null,
          current_activity: 'Idle - Ready for customer',
          error_code: null,
          last_heartbeat: nowIso,
          updated_at: nowIso,
        });
      }

      for (const kId of requestedKioskIds) {
        const existingIdx = memoryStore.kiosk_owners.findIndex((o) => o.kiosk_id === kId);
        if (existingIdx >= 0) {
          memoryStore.kiosk_owners[existingIdx].buyer_id = buyerId;
          memoryStore.kiosk_owners[existingIdx].assigned_by = req.user.id;
          memoryStore.kiosk_owners[existingIdx].assigned_at = nowIso;
        } else {
          memoryStore.kiosk_owners.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            kiosk_id: kId,
            buyer_id: buyerId,
            assigned_by: req.user.id,
            notes: 'Dedicated kiosk assigned on owner onboarding',
            assigned_at: nowIso,
          });
        }
      }
    }

    const updatedData = await fetchAllDataForAdmin();
    const createdBuyer = updatedData.users.find((u) => u.id === buyerId);
    const invitationPath = `/setup-account?token=${rawInviteToken}`;

    const launcherUrl = provisionedKiosk
      ? `${KIOSK_BASE_URL}/?kioskId=${provisionedKiosk.id}`
      : requestedKioskIds[0]
      ? `${KIOSK_BASE_URL}/?kioskId=${requestedKioskIds[0]}`
      : KIOSK_BASE_URL;

    res.status(201).json({
      success: true,
      message: `Owner account created for ${fullName} with dedicated kiosk ${provisionedKiosk?.id || requestedKioskIds[0] || 'assigned'}.`,
      buyer: formatAdminBuyer(createdBuyer, updatedData.owners, updatedData.kiosks),
      dedicatedKiosk: provisionedKiosk
        ? {
            id: provisionedKiosk.id,
            name: provisionedKiosk.name,
            city: provisionedKiosk.city,
            address: provisionedKiosk.address,
            launcherUrl,
          }
        : null,
      launcherUrl,
      invitation: {
        token: rawInviteToken,
        setupPath: invitationPath,
        expiresAt: expiresAtDate.toISOString(),
      },
    });
  } catch (err) {
    console.error('[Admin] Error creating buyer:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/buyers/:id
 */
export async function updateAdminBuyer(req, res) {
  try {
    const { id } = req.params;
    const { fullName, email, username, phone, companyName } = req.body;

    const { db, users } = await fetchAllDataForAdmin();
    const target = users.find((u) => u.id === id);

    if (!target) {
      return res.status(404).json({ success: false, message: 'Buyer account not found.' });
    }

    const nextEmail = email !== undefined ? String(email).trim().toLowerCase() : target.email;
    const nextUsername = username !== undefined ? String(username).trim() : target.username;
    const nextFullName = fullName !== undefined ? String(fullName).trim() : target.full_name;
    const nextPhone = phone !== undefined ? String(phone).trim() : target.phone || '';
    const nextCompany = companyName !== undefined ? String(companyName).trim() : target.company_name || '';

    const conflict = users.find(
      (u) =>
        u.id !== id &&
        (u.email.toLowerCase() === nextEmail.toLowerCase() ||
          u.username.toLowerCase() === nextUsername.toLowerCase())
    );
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Another user already uses that email or username.',
      });
    }

    if (db) {
      await db.query(
        'UPDATE users SET full_name = ?, email = ?, username = ?, phone = ?, company_name = ? WHERE id = ?',
        [nextFullName, nextEmail, nextUsername, nextPhone || null, nextCompany || null, id]
      );
    } else {
      target.full_name = nextFullName;
      target.email = nextEmail;
      target.username = nextUsername;
      target.phone = nextPhone || null;
      target.company_name = nextCompany || null;
      target.updated_at = new Date().toISOString();
    }

    const refreshed = await fetchAllDataForAdmin();
    const updatedUser = refreshed.users.find((u) => u.id === id);

    res.json({
      success: true,
      message: 'Buyer information updated.',
      buyer: formatAdminBuyer(updatedUser, refreshed.owners, refreshed.kiosks),
    });
  } catch (err) {
    console.error('[Admin] Error updating buyer:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * PATCH /api/admin/buyers/:id/status
 * Activate or deactivate buyer access.
 */
export async function updateAdminBuyerStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive (boolean) is required.',
      });
    }

    const { db, users } = await fetchAllDataForAdmin();
    const target = users.find((u) => u.id === id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Buyer account not found.' });
    }

    if (target.role === 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate a Super Admin account.',
      });
    }

    const nextAccountStatus = !isActive
      ? 'deactivated'
      : target.password_hash
      ? 'active'
      : 'invited';

    if (db) {
      await db.query(
        'UPDATE users SET is_active = ?, account_status = ? WHERE id = ?',
        [isActive, nextAccountStatus, id]
      );
    } else {
      target.is_active = isActive ? 1 : 0;
      target.account_status = nextAccountStatus;
      target.updated_at = new Date().toISOString();
    }

    const refreshed = await fetchAllDataForAdmin();
    const updatedUser = refreshed.users.find((u) => u.id === id);

    res.json({
      success: true,
      message: isActive
        ? `Buyer account '${target.full_name}' has been activated.`
        : `Buyer account '${target.full_name}' has been deactivated.`,
      buyer: formatAdminBuyer(updatedUser, refreshed.owners, refreshed.kiosks),
    });
  } catch (err) {
    console.error('[Admin] Error toggling buyer status:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * POST /api/admin/buyers/:id/invite
 * Initiate or resend account invitation / password setup link for a buyer.
 */
export async function generateBuyerInvite(req, res) {
  try {
    const { id } = req.params;
    const { db, users } = await fetchAllDataForAdmin();
    const target = users.find((u) => u.id === id);

    if (!target) {
      return res.status(404).json({ success: false, message: 'Buyer account not found.' });
    }

    const rawInviteToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = hashInviteToken(rawInviteToken);
    const expiresAtDate = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const nextStatus = target.password_hash ? 'active' : 'invited';

    if (db) {
      await db.query(
        'UPDATE users SET invite_token_hash = ?, invite_expires_at = ?, is_active = TRUE, account_status = ? WHERE id = ?',
        [tokenHash, expiresAtDate, nextStatus, id]
      );
    } else {
      target.invite_token_hash = tokenHash;
      target.invite_expires_at = expiresAtDate.toISOString();
      target.is_active = 1;
      target.account_status = nextStatus;
      target.updated_at = new Date().toISOString();
    }

    const refreshed = await fetchAllDataForAdmin();
    const updatedUser = refreshed.users.find((u) => u.id === id);

    res.json({
      success: true,
      message: `Generated a new secure password setup invitation link for ${target.full_name}.`,
      buyer: formatAdminBuyer(updatedUser, refreshed.owners, refreshed.kiosks),
      invitation: {
        token: rawInviteToken,
        setupPath: `/setup-account?token=${rawInviteToken}`,
        expiresAt: expiresAtDate.toISOString(),
      },
    });
  } catch (err) {
    console.error('[Admin] Error generating buyer invite:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * GET /api/admin/assignments
 */
export async function getAdminAssignments(req, res) {
  try {
    const { users, kiosks, owners, machineStatuses } = await fetchAllDataForAdmin();

    const formattedAssignments = owners.map((o) => {
      const k = kiosks.find((item) => item.id === o.kiosk_id);
      const b = users.find((item) => item.id === o.buyer_id);
      const assignedByUser = users.find((item) => item.id === o.assigned_by);

      return {
        id: o.id,
        kioskId: o.kiosk_id,
        kioskName: k?.name || o.kiosk_id,
        kioskCity: k?.city || '',
        kioskAddress: k?.address || k?.location || '',
        kioskStatus: k?.status || 'offline',
        buyerId: o.buyer_id,
        buyerName: b?.full_name || o.buyer_id,
        buyerEmail: b?.email || '',
        buyerCompany: b?.company_name || '',
        buyerIsActive: Boolean(b?.is_active ?? 1),
        assignedBy: assignedByUser?.full_name || 'Super Admin',
        notes: o.notes || '',
        assignedAt: o.assigned_at,
      };
    });

    const unassignedKiosks = kiosks
      .filter((k) => !owners.some((o) => o.kiosk_id === k.id))
      .map((k) => formatAdminKiosk(k, owners, users, machineStatuses));

    res.json({
      success: true,
      count: formattedAssignments.length,
      assignments: formattedAssignments,
      unassignedKiosks,
    });
  } catch (err) {
    console.error('[Admin] Error fetching assignments:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * POST /api/admin/assignments
 * Assign one or multiple kiosks to a buyer.
 * Enforces ownership rules to prevent conflicting assignments unless allowTransfer === true.
 */
export async function assignKiosksToBuyer(req, res) {
  try {
    const {
      buyerId,
      kioskId,
      kioskIds,
      allowTransfer = false,
      notes = '',
    } = req.body;

    const targetKioskIds = Array.isArray(kioskIds)
      ? kioskIds.filter(Boolean)
      : kioskId
      ? [kioskId]
      : [];

    if (!buyerId || targetKioskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'buyerId and at least one kioskId are required.',
      });
    }

    const { db, users, kiosks, owners } = await fetchAllDataForAdmin();

    const buyer = users.find(
      (u) => u.id === buyerId && (u.role === 'buyer' || u.role === 'owner')
    );
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Target buyer account not found.',
      });
    }

    // Validate every kiosk and check for conflicting ownership
    const conflicts = [];
    for (const kId of targetKioskIds) {
      const k = kiosks.find((item) => item.id === kId);
      if (!k) {
        return res.status(404).json({
          success: false,
          message: `Kiosk '${kId}' not found.`,
        });
      }

      const existingOwner = owners.find((o) => o.kiosk_id === kId);
      if (existingOwner && existingOwner.buyer_id !== buyerId) {
        const currentOwnerUser = users.find((u) => u.id === existingOwner.buyer_id);
        conflicts.push({
          kioskId: kId,
          kioskName: k.name,
          currentBuyerId: existingOwner.buyer_id,
          currentBuyerName: currentOwnerUser?.full_name || existingOwner.buyer_id,
        });
      }
    }

    if (conflicts.length > 0 && !allowTransfer) {
      return res.status(409).json({
        success: false,
        code: 'CONFLICTING_ASSIGNMENT',
        message: `Cannot assign ${conflicts.map((c) => c.kioskId).join(', ')} because ${
          conflicts.length === 1 ? 'it is' : 'they are'
        } already assigned to another buyer (${conflicts
          .map((c) => c.currentBuyerName)
          .join(', ')}). Confirm ownership transfer to reassign.`,
        conflicts,
      });
    }

    const cleanNotes = String(notes || 'Assigned by Super Admin').trim();

    if (db) {
      for (const kId of targetKioskIds) {
        await db.query(
          `INSERT INTO kiosk_owners (kiosk_id, buyer_id, assigned_by, notes)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE buyer_id = VALUES(buyer_id), assigned_by = VALUES(assigned_by), notes = VALUES(notes), assigned_at = NOW()`,
          [kId, buyerId, req.user.id, cleanNotes]
        );
      }
    } else {
      const nowIso = new Date().toISOString();
      for (const kId of targetKioskIds) {
        const idx = memoryStore.kiosk_owners.findIndex((o) => o.kiosk_id === kId);
        if (idx >= 0) {
          memoryStore.kiosk_owners[idx].buyer_id = buyerId;
          memoryStore.kiosk_owners[idx].assigned_by = req.user.id;
          memoryStore.kiosk_owners[idx].notes = cleanNotes;
          memoryStore.kiosk_owners[idx].assigned_at = nowIso;
        } else {
          memoryStore.kiosk_owners.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            kiosk_id: kId,
            buyer_id: buyerId,
            assigned_by: req.user.id,
            notes: cleanNotes,
            assigned_at: nowIso,
          });
        }
      }
    }

    const refreshed = await fetchAllDataForAdmin();
    const updatedBuyer = refreshed.users.find((u) => u.id === buyerId);

    res.json({
      success: true,
      message: `Assigned ${targetKioskIds.length} kiosk(s) to ${buyer.full_name}.`,
      buyer: formatAdminBuyer(updatedBuyer, refreshed.owners, refreshed.kiosks),
    });
  } catch (err) {
    console.error('[Admin] Error assigning kiosks:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * DELETE /api/admin/assignments/:kioskId
 * Remove kiosk ownership assignment.
 */
export async function removeKioskAssignment(req, res) {
  try {
    const { kioskId } = req.params;
    const db = await getDbConnection();

    if (db) {
      const [existing] = await db.query(
        'SELECT * FROM kiosk_owners WHERE kiosk_id = ? LIMIT 1',
        [kioskId]
      );
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No active buyer assignment found for kiosk '${kioskId}'.`,
        });
      }
      await db.query('DELETE FROM kiosk_owners WHERE kiosk_id = ?', [kioskId]);
    } else {
      const idx = memoryStore.kiosk_owners.findIndex((o) => o.kiosk_id === kioskId);
      if (idx === -1) {
        return res.status(404).json({
          success: false,
          message: `No active buyer assignment found for kiosk '${kioskId}'.`,
        });
      }
      memoryStore.kiosk_owners.splice(idx, 1);
      saveMemoryStore();
    }

    res.json({
      success: true,
      message: `Kiosk '${kioskId}' has been unassigned.`,
    });
  } catch (err) {
    console.error('[Admin] Error removing assignment:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
