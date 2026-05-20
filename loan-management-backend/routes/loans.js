const router = require('express').Router();
const loanController = require('../controllers/loanController');
const { authMiddleware, authorize } = require('../middleware/auth');
const {
  getLoanStatus,
  streamLoanStatus
} = require("../controllers/loanController");

router.get("/:id/status", getLoanStatus);
router.get("/:id/status-stream", streamLoanStatus);

// Customer routes
router.post('/apply', authMiddleware, loanController.createLoan);
router.post('/predict', authMiddleware, loanController.predictLoanApproval);
router.get('/my-loans', authMiddleware, loanController.getMyLoans);
router.get('/my-loans/:loanId', authMiddleware, loanController.getLoanById);
router.get('/:loanId/emi-schedule', authMiddleware, loanController.getEMISchedule);
router.post('/:loanId/pay-emi', authMiddleware, loanController.payEMI);
router.get('/:loanId/emi/:emiId/pay-qr', authMiddleware, loanController.generateEMIQRPaycode);
router.get('/:loanId/transactions', authMiddleware, loanController.getTransactions);

// Officer/Admin routes
router.get('/all', authMiddleware, authorize('LOAN_OFFICER', 'MANAGER', 'ADMIN'), loanController.getAllLoans);
router.post('/:loanId/approve', authMiddleware, authorize('LOAN_OFFICER', 'MANAGER', 'ADMIN'), loanController.approveLoan);
router.post('/:loanId/reject', authMiddleware, authorize('LOAN_OFFICER', 'MANAGER', 'ADMIN'), loanController.rejectLoan);
router.post('/:loanId/disburse', authMiddleware, authorize('MANAGER', 'ADMIN'), loanController.disburseLoan);

// Utility
router.post('/calculate-emi', loanController.calculateEMI);

// Admin routes
router.get('/reports/portfolio', authMiddleware, authorize('LOAN_OFFICER', 'MANAGER', 'ADMIN'), loanController.getPortfolioSummary);
router.get('/admin/users', authMiddleware, authorize('LOAN_OFFICER', 'MANAGER', 'ADMIN'), loanController.getAllUsers);
router.put('/admin/users/:userId/role', authMiddleware, authorize('ADMIN'), loanController.updateUserRole);
router.put('/admin/users/:userId/kyc', authMiddleware, authorize('ADMIN', 'LOAN_OFFICER'), loanController.updateKYCStatus);

module.exports = router;
