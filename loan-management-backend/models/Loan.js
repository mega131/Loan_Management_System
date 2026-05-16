const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Loan = sequelize.define('Loan', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  processorId: { type: DataTypes.UUID },
  loanAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  disbursedAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  loanType: {
    type: DataTypes.ENUM('PERSONAL', 'BUSINESS', 'HOME', 'AUTO', 'EDUCATION'),
    allowNull: false,
  },
  interestRate: { type: DataTypes.DECIMAL(5, 2) },
  tenure: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'DEFAULT'),
    defaultValue: 'PENDING',
  },
  purpose: { type: DataTypes.TEXT },
  collateral: { type: DataTypes.TEXT, defaultValue: '{}',
    get() { try { return JSON.parse(this.getDataValue('collateral')); } catch { return {}; } },
    set(val) { this.setDataValue('collateral', JSON.stringify(val)); }
  },
  monthlyIncome: { type: DataTypes.DECIMAL(15, 2) },
  employmentStatus: { type: DataTypes.STRING },
  creditScore: { type: DataTypes.INTEGER },
  applicationDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  approvalDate: { type: DataTypes.DATE },
  disbursalDate: { type: DataTypes.DATE },
  expectedClosureDate: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT },
  rejectionReason: { type: DataTypes.TEXT },
}, { timestamps: true, paranoid: true });

module.exports = Loan;
