const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  loanId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  transactionType: {
    type: DataTypes.ENUM('DISBURSEMENT', 'EMI_PAYMENT', 'INTEREST_PAYMENT', 'PENALTY', 'REFUND'),
    allowNull: false,
  },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  dueDate: { type: DataTypes.DATE },
  transactionDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: {
    type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'OVERDUE'),
    defaultValue: 'PENDING',
  },
  paymentMethod: {
    type: DataTypes.ENUM('BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'UPI'),
    defaultValue: 'ONLINE',
  },
  transactionReference: { type: DataTypes.STRING },
  remarks: { type: DataTypes.TEXT },
}, { timestamps: true });

module.exports = Transaction;
