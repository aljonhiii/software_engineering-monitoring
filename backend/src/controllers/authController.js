import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  getDbConnection,
  memoryStore,
  saveMemoryStore,
  getAuthorizedKioskIdsForUser,
  checkUserOnboardingStatus,
} from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kixcleen_super_secret_jwt_key_2026_monitor';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const KIOSK_BASE_URL = process.env.KIOSK_BASE_URL || 'http://localhost:8081';

export function hashInviteToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

export async function login(req, res) {
  try {
    const { identifier, password } = req.body; // identifier = username or email

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required.',
      });
    }

    let user = null;
    const db = await getDbConnection();
    const cleanId = identifier.trim();

    if (db) {
      const [rows] = await db.query(
        'SELECT * FROM users WHERE (username = ? OR email = ?) LIMIT 1',
        [cleanId, cleanId]
      );
      if (rows.length > 0) user = rows[0];
    } else {
      user = memoryStore.users.find(
        (u) =>
          u.username.toLowerCase() === cleanId.toLowerCase() ||
          u.email.toLowerCase() === cleanId.toLowerCase()
      );
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.',
      });
    }

    if (!user.is_active || user.account_status === 'deactivated') {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated by the Super Admin.',
      });
    }

    const isSampleUser =
      user.username?.toLowerCase() === 'sample' || user.id === 'USR-SAMPLE-BUYER';

    // Auto-activate and ensure password for sample buyer account during testing
    if (isSampleUser && (user.account_status === 'invited' || !user.password_hash)) {
      user.account_status = 'active';
      user.is_active = 1;
      if (!user.password_hash) {
        user.password_hash = '$2a$10$nEuhDfI0ry7J5Cwma2oyW.uEsvOqtkv8mDuX/Jhp1apwrAwy/PTeC';
      }
      saveMemoryStore();
    }

    if (user.account_status === 'invited' || !user.password_hash) {
      return res.status(403).json({
        success: false,
        message: 'Account setup is incomplete. Please use your invitation link to set your password first.',
      });
    }

    let isMatch = false;
    if (user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }
    // Flexible password matching for the test sample buyer account
    if (!isMatch && isSampleUser) {
      const allowedSamplePasswords = ['admin1234', 'sample', 'sample123', 'sample1234', 'password', '123456'];
      if (allowedSamplePasswords.includes(password)) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.',
      });
    }

    const assignedKioskIds = await getAuthorizedKioskIdsForUser(user);
    const onboardingCompleted = await checkUserOnboardingStatus(user, assignedKioskIds);

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone || null,
        companyName: user.company_name || null,
        role: user.role,
        accountStatus: user.account_status || 'active',
        assignedKioskIds,
        onboardingCompleted,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getMe(req, res) {
  try {
    const userId = req.user.id;
    let user = null;
    const db = await getDbConnection();

    if (db) {
      const [rows] = await db.query(
        'SELECT id, username, email, full_name, phone, company_name, role, is_active, account_status, created_at FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      if (rows.length > 0) user = rows[0];
    } else {
      user = memoryStore.users.find((u) => u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const assignedKioskIds = await getAuthorizedKioskIdsForUser(user);
    const onboardingCompleted = await checkUserOnboardingStatus(user, assignedKioskIds);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone || null,
        companyName: user.company_name || null,
        role: user.role,
        accountStatus: user.account_status || 'active',
        assignedKioskIds,
        onboardingCompleted,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('[Auth] getMe error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const db = await getDbConnection();
    let currentHash = null;

    if (db) {
      const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
      if (rows.length > 0) currentHash = rows[0].password_hash;
    } else {
      const u = memoryStore.users.find((u) => u.id === userId);
      if (u) currentHash = u.password_hash;
    }

    if (!currentHash) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, currentHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    if (db) {
      await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    } else {
      const u = memoryStore.users.find((u) => u.id === userId);
      if (u) u.password_hash = newHash;
      saveMemoryStore();
    }

    res.json({
      success: true,
      message: 'Password successfully changed.',
    });
  } catch (err) {
    console.error('[Auth] changePassword error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function resolveAssignedKiosksList(kioskIds) {
  if (!kioskIds || kioskIds.length === 0) return [];
  const db = await getDbConnection();
  if (db) {
    const [rows] = await db.query(
      'SELECT id, name, city, address, location, status FROM kiosks WHERE id IN (?)',
      [kioskIds]
    );
    return rows.map((k) => ({
      ...k,
      launcherUrl: `http://localhost:3000/api/launcher/kiosk?kioskId=${encodeURIComponent(k.id)}`,
    }));
  } else {
    return memoryStore.kiosks
      .filter((k) => kioskIds.includes(k.id))
      .map((k) => ({
        id: k.id,
        name: k.name,
        city: k.city,
        address: k.address,
        location: k.location,
        status: k.status,
        launcherUrl: `http://localhost:3000/api/launcher/kiosk?kioskId=${encodeURIComponent(k.id)}`,
      }));
  }
}

/**
 * Verify a buyer's one-time account invitation / password setup token.
 */
export async function verifyInviteToken(req, res) {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invitation token is required.',
      });
    }

    const tokenHash = hashInviteToken(token.trim());
    const db = await getDbConnection();
    let user = null;

    if (db) {
      const [rows] = await db.query(
        'SELECT id, username, email, full_name, phone, company_name, role, is_active, account_status, invite_expires_at FROM users WHERE invite_token_hash = ? LIMIT 1',
        [tokenHash]
      );
      if (rows.length > 0) user = rows[0];
    } else {
      user = memoryStore.users.find((u) => u.invite_token_hash === tokenHash);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'INVALID_OR_USED',
        message: 'This invitation link is invalid or has already been completed.',
      });
    }

    if (!user.is_active || user.account_status === 'deactivated') {
      return res.status(403).json({
        success: false,
        code: 'DEACTIVATED',
        message: 'This buyer account has been deactivated.',
      });
    }

    if (user.invite_expires_at && new Date(user.invite_expires_at).getTime() < Date.now()) {
      return res.status(410).json({
        success: false,
        code: 'EXPIRED',
        message: 'This invitation link has expired. Please ask the Super Admin to send a new invitation.',
      });
    }

    const assignedKioskIds = await getAuthorizedKioskIdsForUser(user);
    const assignedKiosks = await resolveAssignedKiosksList(assignedKioskIds);

    res.json({
      success: true,
      invitation: {
        userId: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        companyName: user.company_name || null,
        role: user.role,
        assignedKioskIds: assignedKioskIds || [],
        assignedKiosks: assignedKiosks || [],
      },
    });
  } catch (err) {
    console.error('[Auth] verifyInviteToken error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Complete buyer account setup by setting a password using the one-time invitation token.
 */
export async function completeAccountSetup(req, res) {
  try {
    const { token, password, username, fullName, phone } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Invitation token and password are required.',
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const tokenHash = hashInviteToken(String(token).trim());
    const db = await getDbConnection();
    let user = null;

    if (db) {
      const [rows] = await db.query(
        'SELECT * FROM users WHERE invite_token_hash = ? LIMIT 1',
        [tokenHash]
      );
      if (rows.length > 0) user = rows[0];
    } else {
      user = memoryStore.users.find((u) => u.invite_token_hash === tokenHash);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or already used invitation link.',
      });
    }

    if (user.invite_expires_at && new Date(user.invite_expires_at).getTime() < Date.now()) {
      return res.status(410).json({
        success: false,
        message: 'This invitation link has expired. Please request a new invitation from the Super Admin.',
      });
    }

    // Handle custom username if provided by the user
    let finalUsername = user.username;
    if (username && String(username).trim()) {
      const cleanUsername = String(username).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
      if (cleanUsername.length < 3 || cleanUsername.length > 30) {
        return res.status(400).json({
          success: false,
          message: 'Username must be between 3 and 30 characters.',
        });
      }

      // Check if username is already taken by another user
      if (cleanUsername !== user.username.toLowerCase()) {
        if (db) {
          const [exists] = await db.query(
            'SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1',
            [cleanUsername, user.id]
          );
          if (exists.length > 0) {
            return res.status(409).json({
              success: false,
              message: `Username '${cleanUsername}' is already taken. Please choose another username.`,
            });
          }
        } else {
          const exists = memoryStore.users.some(
            (u) => u.id !== user.id && u.username.toLowerCase() === cleanUsername
          );
          if (exists) {
            return res.status(409).json({
              success: false,
              message: `Username '${cleanUsername}' is already taken. Please choose another username.`,
            });
          }
        }
        finalUsername = cleanUsername;
      }
    }

    const finalFullName = fullName && String(fullName).trim() ? String(fullName).trim() : user.full_name;
    const finalPhone = phone !== undefined ? String(phone).trim() : user.phone;
    const passwordHash = await bcrypt.hash(String(password), 10);

    if (db) {
      await db.query(
        `UPDATE users 
         SET username = ?, full_name = ?, phone = ?, password_hash = ?, account_status = 'active', is_active = TRUE, invite_token_hash = NULL, invite_expires_at = NULL
         WHERE id = ?`,
        [finalUsername, finalFullName, finalPhone || null, passwordHash, user.id]
      );
      user.username = finalUsername;
      user.full_name = finalFullName;
      user.phone = finalPhone;
    } else {
      user.username = finalUsername;
      user.full_name = finalFullName;
      user.phone = finalPhone;
      user.password_hash = passwordHash;
      user.account_status = 'active';
      user.is_active = 1;
      user.invite_token_hash = null;
      user.invite_expires_at = null;
      user.updated_at = new Date().toISOString();
      saveMemoryStore();
    }

    const assignedKioskIds = await getAuthorizedKioskIdsForUser(user);
    const assignedKiosks = await resolveAssignedKiosksList(assignedKioskIds);
    const onboardingCompleted = await checkUserOnboardingStatus(user, assignedKioskIds);

    const jwtToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Account setup completed! You can now log in to the KixCleen Monitoring Mobile App.',
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        companyName: user.company_name || null,
        role: user.role,
        accountStatus: 'active',
        assignedKioskIds: assignedKioskIds || [],
        assignedKiosks: assignedKiosks || [],
        onboardingCompleted,
      },
    });
  } catch (err) {
    console.error('[Auth] completeAccountSetup error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
