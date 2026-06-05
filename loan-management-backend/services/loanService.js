const { Loan, EMISchedule, Transaction, User } = require('../models');
const { Op } = require('sequelize');

class LoanService {
  calculateEMI(principal, annualRate, tenureMonths) {
    const r = annualRate / 12 / 100;
    if (r === 0) return principal / tenureMonths;
    const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
    return Math.round(emi * 100) / 100;
  }

  getInterestRate(loanType) {
    const rates = { PERSONAL: 12, BUSINESS: 14, HOME: 8.5, AUTO: 10, EDUCATION: 9 };
    return rates[loanType] || 12;
  }

  async createLoan(userId, data) {
    const interestRate = data.interestRate || this.getInterestRate(data.loanType);
    const loan = await Loan.create({
      userId, loanAmount: data.loanAmount, loanType: data.loanType,
      interestRate, tenure: data.tenure, purpose: data.purpose,
      monthlyIncome: data.monthlyIncome, employmentStatus: data.employmentStatus,
      status: 'PENDING',
    });
    return loan;
  }

  async generateEMISchedule(loan) {
    const principal = parseFloat(loan.loanAmount);
    const r = parseFloat(loan.interestRate) / 12 / 100;
    const n = loan.tenure;
    const emi = this.calculateEMI(principal, parseFloat(loan.interestRate), n);

    let balance = principal;
    const schedules = [];
    let startDate = loan.disbursalDate ? new Date(loan.disbursalDate) : new Date();

    for (let i = 1; i <= n; i++) {
      const interestAmount = Math.round(balance * r * 100) / 100;
      const principalAmount = Math.round((emi - interestAmount) * 100) / 100;
      balance = Math.round((balance - principalAmount) * 100) / 100;

      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedules.push({
        loanId: loan.id, emiNumber: i, dueDate,
        principalAmount, interestAmount,
        totalAmount: Math.round(emi * 100) / 100,
        balanceAmount: Math.max(0, balance),
        status: 'PENDING',
      });
    }
    await EMISchedule.bulkCreate(schedules);
    return schedules;
  }

  async approveLoan(loanId, processorId, notes, interestRate) {
    const loan = await Loan.findByPk(loanId);
    if (!loan) { const e = new Error('Loan not found'); e.statusCode = 404; throw e; }
    if (loan.status !== 'PENDING') { const e = new Error('Loan is not in PENDING state'); e.statusCode = 400; throw e; }
    await loan.update({ status: 'APPROVED', processorId, notes, approvalDate: new Date(), interestRate: interestRate || loan.interestRate || this.getInterestRate(loan.loanType) });
    return loan;
  }

  async rejectLoan(loanId, processorId, rejectionReason) {
    const loan = await Loan.findByPk(loanId);
    if (!loan) { const e = new Error('Loan not found'); e.statusCode = 404; throw e; }
    await loan.update({ status: 'REJECTED', processorId, rejectionReason, approvalDate: new Date() });
    return loan;
  }

  async disburseLoan(loanId, processorId, disbursalDate) {
    const loan = await Loan.findByPk(loanId);
    if (!loan) { const e = new Error('Loan not found'); e.statusCode = 404; throw e; }
    if (loan.status !== 'APPROVED') { const e = new Error('Loan must be APPROVED before disbursal'); e.statusCode = 400; throw e; }
    const date = disbursalDate ? new Date(disbursalDate) : new Date();
    await loan.update({ status: 'ACTIVE', disbursalDate: date, disbursedAmount: loan.loanAmount, expectedClosureDate: (() => { const d = new Date(date); d.setMonth(d.getMonth() + loan.tenure); return d; })() });
    // Create EMI schedule
    await this.generateEMISchedule(loan);
    // Create disbursement transaction
    await Transaction.create({ loanId: loan.id, userId: loan.userId, transactionType: 'DISBURSEMENT', amount: loan.loanAmount, status: 'COMPLETED', transactionDate: date });
    return loan;
  }

  async payEMI(loanId, userId, emiNumber, amount, paymentMethod, transactionReference) {
    const emi = await EMISchedule.findOne({ where: { loanId, emiNumber } });
    if (!emi) { const e = new Error('EMI not found'); e.statusCode = 404; throw e; }
    if (emi.status === 'PAID') { const e = new Error('EMI already paid'); e.statusCode = 400; throw e; }
    await emi.update({ status: 'PAID', paidDate: new Date(), paidAmount: amount });
    const tx = await Transaction.create({ loanId, userId, transactionType: 'EMI_PAYMENT', amount, status: 'COMPLETED', paymentMethod, transactionReference, transactionDate: new Date() });
    // Check if all EMIs paid
    const pending = await EMISchedule.count({ where: { loanId, status: { [Op.ne]: 'PAID' } } });
    if (pending === 0) await Loan.update({ status: 'COMPLETED' }, { where: { id: loanId } });
    return tx;
  }

  async getPortfolioSummary() {
    const total = await Loan.count();
    const approved = await Loan.count({ where: { status: 'APPROVED' } });
    const active = await Loan.count({ where: { status: 'ACTIVE' } });
    const completed = await Loan.count({ where: { status: 'COMPLETED' } });
    const rejected = await Loan.count({ where: { status: 'REJECTED' } });
    const defaulted = await Loan.count({ where: { status: 'DEFAULT' } });
    const pending = await Loan.count({ where: { status: 'PENDING' } });
    const totalDisbursed = await Loan.sum('disbursedAmount', {
      where: {
        status: {
          [Op.in]: ['ACTIVE', 'COMPLETED']
        }
      }
    });
    return { total, approved, active, completed, rejected, defaulted, pending, totalDisbursed: totalDisbursed || 0, approvalRate: total ? ((approved + active + completed) / total * 100).toFixed(1) : 0 };
  }
}

module.exports = new LoanService();
