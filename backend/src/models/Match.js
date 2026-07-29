import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Match = sequelize.define('Match', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // allowNull:true for backward compat with existing rows
  },
  profileId: {
    type: DataTypes.STRING,
    allowNull: false,
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
}, {
  timestamps: true,
});

export default Match;
