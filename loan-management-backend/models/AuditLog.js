const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID },
  action: { type: DataTypes.STRING, allowNull: false },
  entityType: { type: DataTypes.ENUM('LOAN', 'USER', 'TRANSACTION', 'SYSTEM') },
  entityId: { type: DataTypes.UUID },
  oldValues: { type: DataTypes.TEXT, get() { try { return JSON.parse(this.getDataValue('oldValues')); } catch { return null; } }, set(v) { this.setDataValue('oldValues', JSON.stringify(v)); } },
  newValues: { type: DataTypes.TEXT, get() { try { return JSON.parse(this.getDataValue('newValues')); } catch { return null; } }, set(v) { this.setDataValue('newValues', JSON.stringify(v)); } },
  ipAddress: { type: DataTypes.STRING },
}, { timestamps: true, updatedAt: false });

module.exports = AuditLog;
