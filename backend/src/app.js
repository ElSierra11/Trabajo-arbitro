import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import multer from 'multer';
import sequelize, { connectDB } from './config/db.js';
import User from './models/User.js';
import Profile from './models/Profile.js';
import Match from './models/Match.js';
import Tournament from './models/Tournament.js';
import Team from './models/Team.js';
import InvoiceSequence from './models/InvoiceSequence.js';
import { verifyToken, requireAdmin, JWT_SECRET } from './middleware/auth.js';

dotenv.config();

// ==========================================
// MODEL ASSOCIATIONS
// ==========================================
User.hasMany(Tournament, { foreignKey: 'userId' });
Tournament.belongsTo(User, { foreignKey: 'userId' });

Tournament.hasMany(Team, { foreignKey: 'tournamentId' });
Team.belongsTo(Tournament, { foreignKey: 'tournamentId' });

Tournament.hasMany(Match, { foreignKey: 'tournamentId' });
Match.belongsTo(Tournament, { foreignKey: 'tournamentId' });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for Render / Railway reverse proxies
app.set('trust proxy', 1);

// Helper for string sanitization
const sanitizeName = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
};

// ==========================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ==========================================
app.use(helmet());
app.use(compression());

// General Rate Limiter (15 min window, 150 requests)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict Rate Limiter for Login/Register (15 min window, 10 attempts)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
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
      name: sanitizeName(name),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      refNumber: refNumber ? sanitizeName(refNumber) : '',
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

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
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

// Update current user info (name, refNumber)
app.put('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const { name, refNumber } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (name && name.trim()) {
      user.name = sanitizeName(name.trim());
    }
    if (refNumber !== undefined) {
      user.refNumber = sanitizeName(refNumber.trim());
    }
    await user.save();

    // Also update user's profile records in Profile table
    await Profile.update(
      { 
        name: user.name, 
        refNumber: user.refNumber 
      },
      { where: { userId: user.id } }
    );

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      refNumber: user.refNumber
    });
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
// 2. TOURNAMENTS & TEAMS (Normalized Entities)
// ==========================================

// Get all tournaments for current user
app.get('/api/tournaments', verifyToken, async (req, res) => {
  try {
    const list = await Tournament.findAll({
      where: { userId: req.user.id },
      order: [['name', 'ASC']],
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or get tournament (sanitized)
app.post('/api/tournaments', verifyToken, async (req, res) => {
  try {
    const name = sanitizeName(req.body.name);
    if (!name) return res.status(400).json({ error: 'El nombre del torneo es requerido' });

    const [t] = await Tournament.findOrCreate({
      where: { userId: req.user.id, name },
      defaults: { userId: req.user.id, name },
    });
    res.status(201).json(t);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get teams (filtered by current user's tournaments only)
app.get('/api/teams', verifyToken, async (req, res) => {
  try {
    const where = {};
    if (req.query.tournamentId) {
      // Verify the tournament belongs to this user before listing its teams
      const tournament = await Tournament.findOne({
        where: { id: req.query.tournamentId, userId: req.user.id }
      });
      if (!tournament) return res.json([]); // tournament not found or not theirs
      where.tournamentId = req.query.tournamentId;
    } else {
      // Without tournamentId filter, only show teams from user's own tournaments
      const userTournaments = await Tournament.findAll({
        where: { userId: req.user.id },
        attributes: ['id']
      });
      where.tournamentId = userTournaments.map(t => t.id);
    }
    const list = await Team.findAll({ where, order: [['name', 'ASC']] });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. PROFILES API (Protected)
// ==========================================

// Get profiles for current user (admin gets all)
app.get('/api/profiles', verifyToken, async (req, res) => {
  try {
    // Each user (including admin) sees only their own profiles from the main app
    const where = { userId: req.user.id };
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
      name: sanitizeName(name),
      refNumber: refNumber ? sanitizeName(refNumber) : '',
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
      name: name ? sanitizeName(name) : profile.name,
      refNumber: refNumber !== undefined ? sanitizeName(refNumber) : profile.refNumber,
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
// 4. MATCHES API (Protected)
// ==========================================

// Helper to normalize and associate tournament
const resolveTournamentId = async (userId, tournamentName) => {
  const cleanName = sanitizeName(tournamentName);
  if (!cleanName) return null;
  try {
    const [t] = await Tournament.findOrCreate({
      where: { userId, name: cleanName },
      defaults: { userId, name: cleanName },
    });
    return t.id;
  } catch (e) {
    return null;
  }
};

// Get matches for current user only
app.get('/api/matches', verifyToken, async (req, res) => {
  try {
    // Admin gets all matches; regular users only get their own
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const list = await Match.findAll({
      where,
      order: [['date', 'DESC'], ['time', 'DESC']]
    });
    res.json(list || []);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a match
app.post('/api/matches', verifyToken, async (req, res) => {
  try {
    const d = req.body;
    const tournamentName = sanitizeName(d.tournament);
    const tournamentId = d.tournamentId || (await resolveTournamentId(req.user.id, tournamentName));
    const isPaid = d.paymentStatus === 'Pagado';

    const newMatch = await Match.create({
      id: d.id || `match-${Date.now()}`,
      userId: req.user.id,
      profileId: d.profileId,
      tournamentId,
      date: d.date,
      time: d.time || '',
      tournament: tournamentName,
      category: d.category || '',
      homeTeam: sanitizeName(d.homeTeam),
      awayTeam: sanitizeName(d.awayTeam),
      homeGoals: Number(d.homeGoals) || 0,
      awayGoals: Number(d.awayGoals) || 0,
      yellowCards: Number(d.yellowCards) || 0,
      redCards: Number(d.redCards) || 0,
      role: d.role || 'Árbitro Central',
      fee: Number(d.fee) || 0,
      paymentStatus: d.paymentStatus || 'Pendiente',
      paidAt: isPaid ? (d.paidAt || new Date()) : null,
      paymentMethod: isPaid ? (d.paymentMethod || 'Transferencia') : null,
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
    const tournamentName = d.tournament !== undefined ? sanitizeName(d.tournament) : match.tournament;
    const tournamentId = d.tournamentId !== undefined
      ? d.tournamentId
      : (d.tournament ? await resolveTournamentId(req.user.id, tournamentName) : match.tournamentId);

    const isPaid = (d.paymentStatus ?? match.paymentStatus) === 'Pagado';
    const wasPaid = match.paymentStatus === 'Pagado';
    let paidAt = match.paidAt;
    if (isPaid && !wasPaid) paidAt = new Date();
    else if (!isPaid) paidAt = null;

    await match.update({
      date: d.date ?? match.date,
      time: d.time ?? match.time,
      tournamentId,
      tournament: tournamentName,
      category: d.category ?? match.category,
      homeTeam: d.homeTeam ? sanitizeName(d.homeTeam) : match.homeTeam,
      awayTeam: d.awayTeam ? sanitizeName(d.awayTeam) : match.awayTeam,
      homeGoals: d.homeGoals !== undefined ? Number(d.homeGoals) : match.homeGoals,
      awayGoals: d.awayGoals !== undefined ? Number(d.awayGoals) : match.awayGoals,
      yellowCards: d.yellowCards !== undefined ? Number(d.yellowCards) : match.yellowCards,
      redCards: d.redCards !== undefined ? Number(d.redCards) : match.redCards,
      role: d.role ?? match.role,
      fee: d.fee !== undefined ? Number(d.fee) : match.fee,
      paymentStatus: d.paymentStatus ?? match.paymentStatus,
      paidAt: d.paidAt !== undefined ? d.paidAt : paidAt,
      paymentMethod: d.paymentMethod !== undefined ? d.paymentMethod : match.paymentMethod,
      notes: d.notes ?? match.notes,
      goals: d.goals ?? match.goals,
      cards: d.cards ?? match.cards,
    });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle / update payment status with audit trail
app.patch('/api/matches/:id/payment', verifyToken, async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    if (match.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permiso para modificar este partido.' });
    }

    const { paymentStatus, paymentMethod } = req.body;
    const newStatus = paymentStatus || (match.paymentStatus === 'Pagado' ? 'Pendiente' : 'Pagado');
    const isNowPaid = newStatus === 'Pagado';

    await match.update({
      paymentStatus: newStatus,
      paidAt: isNowPaid ? (match.paidAt || new Date()) : null,
      paymentMethod: isNowPaid ? (paymentMethod || match.paymentMethod || 'Transferencia') : null,
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

// ==========================================
// 4b. MATCH REPORT FILES (Planillas oficiales)
// ==========================================

// Multer: memory storage, max 5MB per file
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Solo JPG, PNG, WebP y PDF.'));
    }
  },
});

// Upload a report file for a match
app.post('/api/matches/:id/reports', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    if (match.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permiso para modificar este partido.' });
    }
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });

    const existing = Array.isArray(match.reportFiles) ? match.reportFiles : [];
    if (existing.length >= 10) {
      return res.status(400).json({ error: 'Máximo 10 archivos por partido.' });
    }

    const base64 = req.file.buffer.toString('base64');
    const newFile = {
      id: `rf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      data: base64,
      uploadedAt: new Date().toISOString(),
    };

    const updatedFiles = [...existing, newFile];
    await match.update({ reportFiles: updatedFiles });

    // Return without the base64 data to keep response small
    const { data: _d, ...fileMeta } = newFile;
    res.status(201).json({ file: fileMeta, totalFiles: updatedFiles.length });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo supera el límite de 5 MB.' });
    }
    console.error('Error subiendo planilla:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get report files for a match (returns base64 data)
app.get('/api/matches/:id/reports', verifyToken, async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    if (match.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permiso.' });
    }
    const files = Array.isArray(match.reportFiles) ? match.reportFiles : [];
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a report file from a match
app.delete('/api/matches/:id/reports/:fileId', verifyToken, async (req, res) => {
  try {
    const match = await Match.findByPk(req.params.id);
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    if (match.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sin permiso para modificar este partido.' });
    }

    const existing = Array.isArray(match.reportFiles) ? match.reportFiles : [];
    const updated = existing.filter(f => f.id !== req.params.fileId);
    if (updated.length === existing.length) {
      return res.status(404).json({ error: 'Archivo no encontrado.' });
    }

    await match.update({ reportFiles: updated });
    res.json({ message: 'Archivo eliminado.', totalFiles: updated.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. OPTIMIZED FINANCIAL STATS AGGREGATION
// ==========================================
app.get('/api/stats/summary', verifyToken, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user.id;

    // 1. Overall Totals with PostgreSQL direct aggregation
    const [overall] = await sequelize.query(`
      SELECT 
        COUNT(*)::int AS "totalMatches",
        COALESCE(SUM(fee), 0)::int AS "totalEarnings",
        COALESCE(SUM(CASE WHEN "paymentStatus" = 'Pagado' THEN fee ELSE 0 END), 0)::int AS "paidEarnings",
        COALESCE(SUM(CASE WHEN "paymentStatus" = 'Pendiente' THEN fee ELSE 0 END), 0)::int AS "pendingEarnings",
        COALESCE(SUM("yellowCards"), 0)::int AS "totalYellowCards",
        COALESCE(SUM("redCards"), 0)::int AS "totalRedCards",
        COALESCE(SUM("homeGoals" + "awayGoals"), 0)::int AS "totalGoals"
      FROM "Matches"
      WHERE "userId" = :userId
    `, { replacements: { userId }, type: sequelize.QueryTypes.SELECT });

    // 2. Monthly breakdown
    const monthlyStats = await sequelize.query(`
      SELECT 
        SUBSTRING("date", 1, 7) AS "monthKey",
        COUNT(*)::int AS count,
        COALESCE(SUM(fee), 0)::int AS total,
        COALESCE(SUM(CASE WHEN "paymentStatus" = 'Pagado' THEN fee ELSE 0 END), 0)::int AS paid,
        COALESCE(SUM(CASE WHEN "paymentStatus" = 'Pendiente' THEN fee ELSE 0 END), 0)::int AS pending
      FROM "Matches"
      WHERE "userId" = :userId AND "date" IS NOT NULL
      GROUP BY SUBSTRING("date", 1, 7)
      ORDER BY "monthKey" DESC
    `, { replacements: { userId }, type: sequelize.QueryTypes.SELECT });

    // 3. Tournament breakdown
    const tournamentStats = await sequelize.query(`
      SELECT 
        COALESCE(NULLIF(tournament, ''), 'Sin Torneo') AS name,
        COUNT(*)::int AS count,
        COALESCE(SUM(fee), 0)::int AS total,
        COALESCE(SUM(CASE WHEN "paymentStatus" = 'Pagado' THEN fee ELSE 0 END), 0)::int AS paid,
        COALESCE(SUM(CASE WHEN "paymentStatus" = 'Pendiente' THEN fee ELSE 0 END), 0)::int AS pending
      FROM "Matches"
      WHERE "userId" = :userId
      GROUP BY COALESCE(NULLIF(tournament, ''), 'Sin Torneo')
      ORDER BY pending DESC, total DESC
    `, { replacements: { userId }, type: sequelize.QueryTypes.SELECT });

    res.json({
      ...(overall || {}),
      monthlyStats,
      tournamentStats,
    });
  } catch (err) {
    console.error('Error fetching stats summary:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. ATOMIC INVOICE CONSECUTIVE GENERATION
// ==========================================
app.post('/api/invoices/next-number', verifyToken, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const year = req.body.year || new Date().getFullYear();

    let seq = await InvoiceSequence.findOne({
      where: { userId, year },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!seq) {
      seq = await InvoiceSequence.create(
        { userId, year, currentNumber: 1 },
        { transaction: t }
      );
    } else {
      seq.currentNumber += 1;
      await seq.save({ transaction: t });
    }

    await t.commit();
    const formatted = `CC-${year}-${String(seq.currentNumber).padStart(3, '0')}`;
    res.json({ invoiceNumber: formatted, number: seq.currentNumber, year });
  } catch (err) {
    await t.rollback();
    console.error('Error generating invoice number:', err);
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: sanitizeName(name),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      refNumber: refNumber ? sanitizeName(refNumber) : '',
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
// 7. DIAGNOSTIC & DATA INTEGRITY ENDPOINTS
// ==========================================
// PROTECTED: Only admins can access the debug endpoint
app.get('/api/debug/db', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

    let matchesCount = null;
    let usersCount = null;

    try {
      const [r] = await sequelize.query('SELECT COUNT(*)::int AS count FROM "Matches";');
      matchesCount = r[0]?.count;
    } catch (e) { matchesCount = 'error: ' + e.message; }

    try {
      const [r] = await sequelize.query('SELECT COUNT(*)::int AS count FROM "Users";');
      usersCount = r[0]?.count;
    } catch (e) { usersCount = 'error: ' + e.message; }

    res.json({
      status: 'ok',
      tables: tables.map(t => t.table_name),
      counts: {
        'Matches': matchesCount,
        'Users': usersCount,
      },
    });
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
    
    // Safely sync without killing server process if alter has PostgreSQL conflicts
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Tablas e índices de la base de datos sincronizados con alter.');
    } catch (alterErr) {
      console.warn('⚠️ Advertencia en sync({ alter }):', alterErr.message);
      try {
        await sequelize.sync();
        console.log('✅ Tablas de la base de datos sincronizadas en modo seguro.');
      } catch (safeErr) {
        console.warn('⚠️ Advertencia en sync seguro:', safeErr.message);
      }
    }

    // Migration safety: copy any rows from lowercase 'matches' back into '"Matches"' and vice versa
    try {
      await sequelize.query(`
        INSERT INTO "Matches" (id, "userId", "profileId", date, time, tournament, category, "homeTeam", "awayTeam", "homeGoals", "awayGoals", "yellowCards", "redCards", role, fee, "paymentStatus", notes, goals, cards, "createdAt", "updatedAt")
        SELECT id, "userId", "profileId", date, time, tournament, category, "homeTeam", "awayTeam", "homeGoals", "awayGoals", "yellowCards", "redCards", role, fee, "paymentStatus", notes, goals, cards, "createdAt", "updatedAt"
        FROM matches
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('✅ Migración matches -> "Matches" verificada.');
    } catch (_) {}

    try {
      await sequelize.query(`
        INSERT INTO matches (id, "userId", "profileId", date, time, tournament, category, "homeTeam", "awayTeam", "homeGoals", "awayGoals", "yellowCards", "redCards", role, fee, "paymentStatus", notes, goals, cards, "createdAt", "updatedAt")
        SELECT id, "userId", "profileId", date, time, tournament, category, "homeTeam", "awayTeam", "homeGoals", "awayGoals", "yellowCards", "redCards", role, fee, "paymentStatus", notes, goals, cards, "createdAt", "updatedAt"
        FROM "Matches"
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('✅ Migración "Matches" -> matches verificada.');
    } catch (_) {}

    app.listen(PORT, () => {
      console.log(`🚀 Servidor COARC ejecutándose en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar el servidor:', err.message);
    process.exit(1);
  }
};

startServer();
