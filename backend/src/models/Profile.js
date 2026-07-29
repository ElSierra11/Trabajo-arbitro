import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  refNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  defaultFee: {
    type: DataTypes.INTEGER,
    defaultValue: 50000,
  },
}, {
  timestamps: true,
});

export default Profile;
