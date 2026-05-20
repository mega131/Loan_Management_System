const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  role: {
    type: DataTypes.ENUM('CUSTOMER', 'LOAN_OFFICER', 'MANAGER', 'ADMIN'),
    defaultValue: 'CUSTOMER',
  },
  kycStatus: {
    type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
    defaultValue: 'PENDING',
  },
  kycDocuments: { type: DataTypes.TEXT, defaultValue: '{}', get() {
    try { return JSON.parse(this.getDataValue('kycDocuments')); } catch { return {}; }
  }, set(val) { this.setDataValue('kycDocuments', JSON.stringify(val)); } },
  address: { type: DataTypes.TEXT, defaultValue: '{}', get() {
    try { return JSON.parse(this.getDataValue('address')); } catch { return {}; }
  }, set(val) { this.setDataValue('address', JSON.stringify(val)); } },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  creditScore: { type: DataTypes.INTEGER, defaultValue: null },
  lastLogin: { type: DataTypes.DATE },
  loginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  lockUntil: { type: DataTypes.DATE },
  refreshToken: { type: DataTypes.TEXT },
}, {
  timestamps: true,
  paranoid: true,
});

const hashPassword = async (user) => {
  if (user.isNewRecord || user.changed('passwordHash')) {
    if (user.passwordHash) {
      const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
      user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
    }
  }
};

User.beforeCreate(hashPassword);
User.beforeUpdate(hashPassword);

User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = User;
