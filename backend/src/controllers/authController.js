import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDbConnection, memoryStore } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kixcleen_super_secret_jwt_key_2026_monitor';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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

    if (db) {
      const [rows] = await db.query(
        'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE LIMIT 1',
        [identifier.trim(), identifier.trim()]
      );
      if (rows.length > 0) user = rows[0];
    } else {
      user = memoryStore.users.find(
        (u) =>
          (u.username.toLowerCase() === identifier.trim().toLowerCase() ||
            u.email.toLowerCase() === identifier.trim().toLowerCase()) &&
          u.is_active
      );
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password.',
      });
    }

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
        role: user.role,
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
        'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      if (rows.length > 0) user = rows[0];
    } else {
      user = memoryStore.users.find((u) => u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
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
