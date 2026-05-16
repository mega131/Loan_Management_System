const User = require('./User');
const Loan = require('./Loan');
const EMISchedule = require('./EMISchedule');
const Transaction = require('./Transaction');
const AuditLog = require('./AuditLog');

// Associations
User.hasMany(Loan, { foreignKey: 'userId', as: 'loans' });
Loan.belongsTo(User, { foreignKey: 'userId', as: 'borrower' });

Loan.belongsTo(User, { foreignKey: 'processorId', as: 'processor' });

Loan.hasMany(EMISchedule, { foreignKey: 'loanId', as: 'emiSchedule' });
EMISchedule.belongsTo(Loan, { foreignKey: 'loanId', as: 'loan' });

Loan.hasMany(Transaction, { foreignKey: 'loanId', as: 'transactions' });
Transaction.belongsTo(Loan, { foreignKey: 'loanId', as: 'loan' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });

module.exports = { User, Loan, EMISchedule, Transaction, AuditLog };
