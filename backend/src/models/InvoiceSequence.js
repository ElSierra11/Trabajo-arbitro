import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const InvoiceSequence = sequelize.define('InvoiceSequence', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currentNumber: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'invoice_sequences',
  indexes: [
    { unique: true, fields: ['userId', 'year'] },
  ],
});

export default InvoiceSequence;
