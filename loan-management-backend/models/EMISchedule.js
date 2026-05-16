const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EMISchedule = sequelize.define('EMISchedule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  loanId: { type: DataTypes.UUID, allowNull: false },
  emiNumber: { type: DataTypes.INTEGER, allowNull: false },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  principalAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  interestAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  totalAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'OVERDUE', 'DEFAULTED'),
    defaultValue: 'PENDING',
  },
  paidDate: { type: DataTypes.DATE },
  paidAmount: { type: DataTypes.DECIMAL(15, 2) },
  balanceAmount: { type: DataTypes.DECIMAL(15, 2) },
  penaltyAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
}, { timestamps: true });

module.exports = EMISchedule;
