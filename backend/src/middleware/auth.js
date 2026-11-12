import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getDbConnection, memoryStore, normalizeUserRole } from '../config/db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'kixcleen_super_secret_jwt_key_2026_monitor';

export async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user is still active in DB / memoryStore
    const db = await getDbConnection();
    let dbUser = null;
    if (db) {
      const [rows] = await db.query(
        'SELECT id, username, email, full_name, role, is_active, account_status FROM users WHERE id = ? LIMIT 1',
        [decoded.id]
      );
      if (rows.length > 0) dbUser = rows[0];
    } else {
      dbUser = memoryStore.users.find((u) => u.id === decoded.id);
    }

    if (!dbUser || !dbUser.is_active || dbUser.account_status === 'deactivated') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated or is no longer active. Please contact the Super Admin.',
      });
    }

    req.user = {
      ...decoded,
      role: dbUser.role,
      normalizedRole: normalizeUserRole(dbUser.role),
    };
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication session. Please log in again.',
    });
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRawRole = String(req.user.role || '').toLowerCase();
    const userNormRole = normalizeUserRole(userRawRole);
    const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase());

    const isAllowed =
      normalizedAllowed.includes(userRawRole) ||
      normalizedAllowed.includes(userNormRole);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Your user role is not authorized for this action.',
      });
    }
    next();
  };
}
