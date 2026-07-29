import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import sequelize, { connectDB } from './config/db.js';
import User from './models/User.js';
import Profile from './models/Profile.js';
import Match from './models/Match.js';
import { verifyToken, requireAdmin, JWT_SECRET } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for Render / Railway reverse proxies
app.set('trust proxy', 1);

// ==========================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ==========================================
app.use(helmet());
app.use(compression());

// General Rate Limiter (15 min window, 100 requests)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { error: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict Rate Limiter for Login/Register (15 min window, 10 attempts)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de acceso. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ==========================================
// CORS: Allow frontend origin
// ==========================================
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor COARC RefManager activo' });
});

// ==========================================
// 1. AUTH ROUTES (Public)
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, refNumber } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo electrónico.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // First user ever becomes admin
    const userCount = await User.count();
    const role = userCount === 0 ? 'admin' : 'user';

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      refNumber: refNumber || '',
      role,
    });

    // Auto-create default profile for the new user
    await Profile.create({
      id: `profile-${user.id}`,
      userId: user.id,
      name: user.name,
      refNumber: user.refNumber || '',
      defaultFee: 50000,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, refNumber: user.refNumber }
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, refNumber: user.refNumber }
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get current user info
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'refNumber']
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password (for logged in user)
app.post('/api/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'La contraseña actual y la nueva contraseña son requeridas.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Contraseña actualizada con éxito.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Reset Password (for any user)
app.post('/api/users/:id/reset-password', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Usuario no encontrado.' });

    targetUser.password = await bcrypt.hash(newPassword, 10);
    await targetUser.save();

    res.json({ message: `Contraseña de ${targetUser.name} reestablecida con éxito.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. PROFILES API (Protected)
// ==========================================

// Get profiles for current user (admin gets all)
app.get('/api/profiles', verifyToken, async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
    let list = await Profile.findAll({ where });

    // Auto-create default profile if user has none
    if (list.length === 0) {
      const defaultProfile = await Profile.create({
        id: `profile-${req.user.id}`,
        userId: req.user.id,
        name: req.user.name,
        refNumber: '',
        defaultFee: 50000
      });
      list = [defaultProfile];
    }
    res.json(list);
  } catch (err) {
    console.error('Error fetching profiles:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add a new profile
app.post('/api/profiles', verifyToken, async (req, res) => {
  try {
    const { id, name, refNumber, defaultFee } = req.body;
    const newProfile = await Profile.create({
      id: id || `profile-${Date.now()}`,
      userId: req.user.id,
      name,
      refNumber: refNumber || '',
      defaultFee: Number(defaultFee) || 0
    });
    res.status(201).json(newProfile);
  } catch (err) {
    console.error('Error creating profile:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update profile (only owner or admin)
app.put('/api/profiles/:id', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });
    if (profile.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permiso para editar este perfil.' });
    }

    const { name, refNumber, defaultFee } = req.body;
    await profile.update({
      name: name ?? profile.name,
      refNumber: refNumber ?? profile.refNumber,
      defaultFee: defaultFee !== undefined ? Number(defaultFee) : profile.defaultFee
    });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete profile (only owner or admin)
app.delete('/api/profiles/:id', verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });
    if (profile.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permiso para eliminar este perfil.' });
    }

    await Match.destroy({ where: { profileId: profile.id } });
    await profile.destroy();
    res.json({ message: 'Perfil eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. MATCHES API (Protected)
// ==========================================

// Get matches for current user
app.get('/api/matches', verifyToken, async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const list = await Match.findAll({
      where,
      order: [['date', 'DESC'], ['time', 'DESC']]
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a match
app.post('/api/matches', verifyToken, async (req, res) => {
  try {
    const d = req.body;
    const newMatch = await Match.create({
      id: d.id || `match-${Date.now()}`,
      userId: req.user.id,
      profileId: d.profileId,
      date: d.date,
      time: d.time || '',
      tournament: d.tournament || '',
      category: d.category || '',
      homeTeam: d.homeTeam,
      awayTeam: d.awayTeam,
      homeGoals: Number(d.homeGoals) || 0,
      awayGoals: Number(d.awayGoals) || 0,
      yellowCards: Number(d.yellowCards) || 0,
      redCards: Number(d.redCards) || 0,
      role: d.role || 'Árbitro Central',
      fee: Number(d.fee) || 0,
      paymentStatus: d.paymentStatus || 'Pendiente',
      notes: d.notes || '',
      goals: d.goals || [],
      cards: d.cards || []
    });
    res.status(201).json(newMatch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a match
app.put('/api/matches/:id', verifyToken, async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    if (match.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permiso para editar este partido.' });
    }

    const d = req.body;
    await match.update({
      date: d.date ?? match.date,
      time: d.time ?? match.time,
      tournament: d.tournament ?? match.tournament,
      category: d.category ?? match.category,
      homeTeam: d.homeTeam ?? match.homeTeam,
      awayTeam: d.awayTeam ?? match.awayTeam,
      homeGoals: d.homeGoals !== undefined ? Number(d.homeGoals) : match.homeGoals,
      awayGoals: d.awayGoals !== undefined ? Number(d.awayGoals) : match.awayGoals,
      yellowCards: d.yellowCards !== undefined ? Number(d.yellowCards) : match.yellowCards,
      redCards: d.redCards !== undefined ? Number(d.redCards) : match.redCards,
      role: d.role ?? match.role,
      fee: d.fee !== undefined ? Number(d.fee) : match.fee,
      paymentStatus: d.paymentStatus ?? match.paymentStatus,
      notes: d.notes ?? match.notes,
      goals: d.goals ?? match.goals,
      cards: d.cards ?? match.cards,
    });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a match
app.delete('/api/matches/:id', verifyToken, async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    if (match.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permiso para eliminar este partido.' });
    }
    await match.destroy();
    res.json({ message: 'Partido eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk import (replaces user's own data only)
app.post('/api/import', verifyToken, async (req, res) => {
  try {
    const { profiles: newProfiles, matches: newMatches } = req.body;
    if (!newProfiles || !newMatches) {
      return res.status(400).json({ error: 'Formato de importación inválido.' });
    }

    const userId = req.user.id;
    await Match.destroy({ where: { userId } });
    await Profile.destroy({ where: { userId } });

    const profilesWithUser = newProfiles.map(p => ({ ...p, userId }));
    const matchesWithUser = newMatches.map(m => ({ ...m, userId }));

    await Profile.bulkCreate(profilesWithUser, { ignoreDuplicates: true });
    await Match.bulkCreate(matchesWithUser, { ignoreDuplicates: true });

    res.json({ message: 'Datos restaurados correctamente.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: list all users with match stats
app.get('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'refNumber', 'createdAt']
    });
    // Enrich each user with their match count and total earnings
    const enriched = await Promise.all(users.map(async (u) => {
      const userMatches = await Match.findAll({ where: { userId: u.id } });
      const matchCount = userMatches.length;
      const totalEarnings = userMatches.reduce((sum, m) => sum + (Number(m.fee) || 0), 0);
      const paidEarnings = userMatches.filter(m => m.paymentStatus === 'Pagado').reduce((sum, m) => sum + (Number(m.fee) || 0), 0);
      return { ...u.toJSON(), matchCount, totalEarnings, paidEarnings };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create a new user account
app.post('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, refNumber, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo electrónico.' });
    }
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);
    const user = await User.create({
      name, email, password: hashedPassword,
      refNumber: refNumber || '',
      role: role || 'user',
    });
    // Auto-create profile for new user
    await Profile.create({
      id: `profile-${user.id}`,
      userId: user.id,
      name: user.name,
      refNumber: user.refNumber || '',
      defaultFee: 50000,
    });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, refNumber: user.refNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SERVER START
// ==========================================
const startServer = async () => {
  try {
    await connectDB();
    // alter:true keeps existing data while adding new columns
    await sequelize.sync({ alter: true });
    console.log('✅ Tablas de la base de datos sincronizadas.');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor COARC ejecutándose en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar el servidor:', err.message);
    process.exit(1);
  }
};

startServer();
