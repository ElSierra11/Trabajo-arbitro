import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tournamentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    set(val) {
      if (typeof val === 'string') {
        const cleaned = val.trim().replace(/\s+/g, ' ');
        this.setDataValue('name', cleaned);
      } else {
        this.setDataValue('name', val);
      }
    },
  },
}, {
  timestamps: true,
  tableName: 'teams',
  indexes: [
    { fields: ['tournamentId', 'name'] },
  ],
});

export default Team;
