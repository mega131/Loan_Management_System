const loanService = require('../services/loanService');
const { Loan, EMISchedule, Transaction, User } = require('../models');
const { Op } = require('sequelize');
const qrcode = require('qrcode');

exports.createLoan = async (req, res, next) => {
  try {
    const { loanAmount, loanType, tenure, purpose, monthlyIncome, employmentStatus } = req.body;
    if (!loanAmount || !loanType || !tenure) {
      return res.status(400).json({ success: false, error: { message: 'loanAmount, loanType, tenure are required' } });
    }
    const loan = await loanService.createLoan(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Loan application created', data: loan });
  } catch (err) { next(err); }
};

exports.getMyLoans = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;
    const offset = (page - 1) * limit;
    const { count, rows } = await Loan.findAndCountAll({ where, limit: parseInt(limit), offset: parseInt(offset), order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: { loans: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) } } });
  } catch (err) { next(err); }
};

exports.getLoanById = async (req, res, next) => {
  try {
    const loan = await Loan.findOne({ where: { id: req.params.loanId, userId: req.user.id }, include: [{ model: EMISchedule, as: 'emiSchedule', order: [['emiNumber', 'ASC']] }] });
    if (!loan) return res.status(404).json({ success: false, error: { message: 'Loan not found' } });
    res.json({ success: true, data: loan });
  } catch (err) { next(err); }
};

exports.getAllLoans = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const where = {};
    if (status) where.status = status;
    const offset = (page - 1) * limit;
    const { count, rows } = await Loan.findAndCountAll({
      where, limit: parseInt(limit), offset: parseInt(offset),
      include: [{ model: User, as: 'borrower', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'kycStatus'] }],
      order: [['createdAt', 'DESC']],
    });
    console.log('getAllLoans query returned:', { count, rowsCount: rows.length, status });
    res.json({ success: true, data: { loans: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, pages: Math.ceil(count / limit) } } });
  } catch (err) { next(err); }
};

exports.approveLoan = async (req, res, next) => {
  try {
    const { notes, interestRate } = req.body;
    const loan = await loanService.approveLoan(req.params.loanId, req.user.id, notes, interestRate);
    broadcastStatusChange(loan.id, loan.status);
    res.json({ success: true, message: 'Loan approved successfully', data: loan });
  } catch (err) { next(err); }
};

exports.rejectLoan = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const loan = await loanService.rejectLoan(req.params.loanId, req.user.id, rejectionReason);
    broadcastStatusChange(loan.id, loan.status);
    res.json({ success: true, message: 'Loan rejected', data: loan });
  } catch (err) { next(err); }
};

exports.disburseLoan = async (req, res, next) => {
  try {
    const loan = await loanService.disburseLoan(req.params.loanId, req.user.id, req.body.disbursalDate);
    broadcastStatusChange(loan.id, loan.status);
    res.json({ success: true, message: 'Loan disbursed successfully', data: loan });
  } catch (err) { next(err); }
};

exports.getEMISchedule = async (req, res, next) => {
  try {
    const loan = await Loan.findByPk(req.params.loanId);
    if (!loan) return res.status(404).json({ success: false, error: { message: 'Loan not found' } });
    const emis = await EMISchedule.findAll({ where: { loanId: req.params.loanId }, order: [['emiNumber', 'ASC']] });
    const monthlyEMI = emis.length > 0 ? emis[0].totalAmount : 0;
    res.json({ success: true, data: { loanId: loan.id, totalEMIs: loan.tenure, monthlyEMI, emis } });
  } catch (err) { next(err); }
};

exports.payEMI = async (req, res, next) => {
  try {
    const { emiNumber, amount, paymentMethod, transactionReference } = req.body;
    const tx = await loanService.payEMI(req.params.loanId, req.user.id, emiNumber, amount, paymentMethod, transactionReference);
    res.json({ success: true, message: 'EMI payment processed', data: tx });
  } catch (err) { next(err); }
};

exports.generateEMIQRPaycode = async (req, res, next) => {
  try {
    const { loanId, emiId } = req.params;
    const emi = await EMISchedule.findOne({ where: { id: emiId, loanId } });
    if (!emi) return res.status(404).json({ success: false, error: { message: 'EMI not found' } });
    
    // Simulate a UPI payment link
    const upiLink = `upi://pay?pa=lms@upi&pn=LoanManagementSystem&am=${emi.totalAmount}&tr=${emiId}&cu=INR`;
    const qrDataUrl = await qrcode.toDataURL(upiLink, { errorCorrectionLevel: 'H', type: 'image/png' });
    
    res.json({ success: true, data: { qrDataUrl, amount: emi.totalAmount } });
  } catch (err) { next(err); }
};

exports.predictLoanApproval = async (req, res, next) => {
  try {
    const { loanAmount, monthlyIncome } = req.body;
    if (loanAmount === undefined || monthlyIncome === undefined) {
      return res.status(400).json({ success: false, error: { message: 'loanAmount and monthlyIncome are required' } });
    }
    const { generateCreditScore } = require('../services/creditScoreService');
    const { predictLoanApproval } = require('../services/aiPredictorService');
    
    // Check if user has a credit score
    const user = await User.findByPk(req.user.id);
    let creditScore = user.creditScore;
    
    // Use heuristic logic to predict
    const prediction = predictLoanApproval({ 
      loanAmount: parseFloat(loanAmount), 
      monthlyIncome: parseFloat(monthlyIncome), 
      creditScore 
    });
    
    res.json({ success: true, data: prediction });
  } catch (err) { next(err); }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({ where: { loanId: req.params.loanId }, order: [['transactionDate', 'DESC']] });
    res.json({ success: true, data: transactions });
  } catch (err) { next(err); }
};

exports.getPortfolioSummary = async (req, res, next) => {
  try {
    const summary = await loanService.getPortfolioSummary();
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['passwordHash', 'refreshToken', 'loginAttempts'] }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    await user.update({ role });
    res.json({ success: true, message: 'User role updated', data: { id: user.id, role: user.role } });
  } catch (err) { next(err); }
};

exports.updateKYCStatus = async (req, res, next) => {
  try {
    const { kycStatus } = req.body;
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    
    let updateData = { kycStatus };
    
    if (kycStatus === 'VERIFIED' && !user.creditScore) {
      const { generateCreditScore } = require('../services/creditScoreService');
      updateData.creditScore = generateCreditScore(user);
    }

    await user.update(updateData);
    res.json({ success: true, message: 'KYC status updated', data: { id: user.id, kycStatus: user.kycStatus, creditScore: user.creditScore } });
  } catch (err) { next(err); }
};

exports.calculateEMI = async (req, res, next) => {
  try {
    const { principal, annualRate, tenureMonths } = req.body;
    if (!principal || !annualRate || !tenureMonths) {
      return res.status(400).json({ success: false, error: { message: 'principal, annualRate, tenureMonths are required' } });
    }
    const emi = loanService.calculateEMI(parseFloat(principal), parseFloat(annualRate), parseInt(tenureMonths));
    const totalPayable = emi * tenureMonths;
    const totalInterest = totalPayable - principal;
    res.json({ success: true, data: { emi: Math.round(emi * 100) / 100, totalPayable: Math.round(totalPayable * 100) / 100, totalInterest: Math.round(totalInterest * 100) / 100 } });
  } catch (err) { next(err); }
};

exports.getLoanStatus = async (req, res) => {
  try {

    const { id } = req.params;

    const loan = await Loan.findByPk(id);

    if (!loan) {
      return res.status(404).json({
        message: "Loan not found",
      });
    }

    res.json({
      status: loan.status,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

const clients = new Map();

const broadcastStatusChange = (loanId, newStatus) => {
  const idStr = loanId.toString();
  const list = clients.get(idStr);
  if (list) {
    list.forEach(client => {
      client.write(`data: ${JSON.stringify({ status: newStatus })}\n\n`);
    });
  }
};

exports.streamLoanStatus = (req, res) => {
  const { id } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify({ status: 'CONNECTED' })}\n\n`);

  if (!clients.has(id)) {
    clients.set(id, []);
  }
  clients.get(id).push(res);

  req.on('close', () => {
    const list = clients.get(id);
    if (list) {
      clients.set(id, list.filter(c => c !== res));
      if (clients.get(id).length === 0) clients.delete(id);
    }
  });
};
