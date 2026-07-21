import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type UserRole =
  | 'Admin'
  | 'Store Keeper'
  | 'Cashier'
  | 'Wholesale Sales'
  | 'Retail Sales';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  active: boolean;
  avatarColor?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'adamu-maspare-dev-secret-change-me';

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      active: user.active,
      avatarColor: user.avatarColor,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthUser;
    if (!payload.active) {
      return res.status(403).json({ error: 'Account inactive' });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role === 'Admin' || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  };
}

/** Mirror of Sidebar hasPermission for server enforcement */
export function canAccessScreen(role: UserRole, screen: string): boolean {
  if (role === 'Admin') return true;
  const map: Record<string, UserRole[]> = {
    dashboard: ['Admin', 'Store Keeper', 'Cashier', 'Wholesale Sales', 'Retail Sales'],
    inventory: ['Store Keeper'],
    low_stock: ['Store Keeper'],
    pos: ['Cashier'],
    wholesale_pos: ['Wholesale Sales'],
    retail_pos: ['Retail Sales'],
    customers: ['Wholesale Sales'],
    suppliers: ['Store Keeper'],
    goods_received: ['Store Keeper'],
    stock_transfer: ['Store Keeper'],
    stock_count: ['Store Keeper'],
    expenses: [],
    reports: ['Cashier', 'Wholesale Sales', 'Retail Sales'],
    profit_loss: [],
    stock_movement: ['Store Keeper'],
    warranty: ['Admin', 'Store Keeper', 'Cashier', 'Wholesale Sales', 'Retail Sales'],
    users: [],
    settings: [],
  };
  return (map[screen] || []).includes(role);
}
