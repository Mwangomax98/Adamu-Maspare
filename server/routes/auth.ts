import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { AuthRequest, requireAuth, signToken, AuthUser } from '../middleware/auth.js';
import { RowDataPacket } from 'mysql2';

const router = Router();

function mapUser(row: RowDataPacket): AuthUser {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    active: Boolean(row.active),
    avatarColor: row.avatar_color || undefined,
  };
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
      [username]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Mtumiaji au nenosiri si sahihi' });
    }
    const row = rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Mtumiaji au nenosiri si sahihi' });
    }
    if (!row.active) {
      return res.status(403).json({ error: 'Mtumiaji huyu amesitishwa (Inactive)' });
    }
    const user = mapUser(row);
    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
