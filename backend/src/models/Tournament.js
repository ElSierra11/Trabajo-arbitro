import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Tournament = sequelize.define('Tournament', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
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
  tableName: 'tournaments',
  indexes: [
    { fields: ['userId', 'name'] },
  ],
});

export default Tournament;
