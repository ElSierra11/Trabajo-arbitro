import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Match = sequelize.define('Match', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  profileId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tournamentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  time: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tournament: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  homeTeam: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  awayTeam: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  homeGoals: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  awayGoals: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  yellowCards: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  redCards: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'Árbitro Central',
  },
  fee: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  paymentStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Pendiente', // 'Pagado' or 'Pendiente'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  goals: {
    type: DataTypes.JSONB, // Stores list of { id, player, team: 'local'|'visitante', minute }
    defaultValue: [],
  },
  cards: {
    type: DataTypes.JSONB, // Stores list of { id, player, type: 'amarilla'|'roja', minute, reason }
    defaultValue: [],
  },
  reportFiles: {
    type: DataTypes.JSONB, // Stores list of { id, name, type, size, data (base64), uploadedAt }
    defaultValue: [],
  },
}, {
  timestamps: true,
  tableName: 'Matches',
  indexes: [
    // Composite index for fast financial and dashboard aggregations
    {
      name: 'idx_matches_user_date_status',
      fields: ['userId', 'date', 'paymentStatus'],
    },
    {
      name: 'idx_matches_tournament',
      fields: ['tournamentId'],
    },
  ],
});

export default Match;
