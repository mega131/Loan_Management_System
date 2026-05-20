
const { Loan, Transaction, sequelize } = require("../models");

exports.getDashboardStats = async (req, res) => {
  try {

    const totalLoans = await Loan.count();

    const approvedLoans = await Loan.count({
      where: {
        status: "APPROVED",
      },
    });

    const pendingLoans = await Loan.count({
      where: {
        status: "PENDING",
      },
    });

    const rejectedLoans = await Loan.count({
      where: {
        status: "REJECTED",
      },
    });

    res.json({
      totalLoans,
      approvedLoans,
      pendingLoans,
      rejectedLoans,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message,
    });

  }
};

exports.getLoanTrends = async (req, res) => {
  try {
    const loans = await Loan.findAll({
      attributes: ['createdAt']
    });

    const monthCounts = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    loans.forEach(loan => {
      const date = new Date(loan.createdAt);
      const monthStr = monthNames[date.getMonth()];
      monthCounts[monthStr] = (monthCounts[monthStr] || 0) + 1;
    });

    const trends = Object.keys(monthCounts).map(month => ({
      month,
      loans: monthCounts[month]
    }));

    // Ensure they are somewhat ordered (or just return the mapping).
    res.json(trends.length > 0 ? trends : [
      { month: "Jan", loans: 0 },
      { month: "Feb", loans: 0 },
    ]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getRevenueAnalytics = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: {
        transactionType: 'EMI_PAYMENT',
        status: 'COMPLETED'
      },
      attributes: ['amount', 'transactionDate']
    });

    const monthRevenue = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    transactions.forEach(tx => {
      const date = new Date(tx.transactionDate || tx.createdAt);
      const monthStr = monthNames[date.getMonth()];
      monthRevenue[monthStr] = (monthRevenue[monthStr] || 0) + Number(tx.amount);
    });

    const revenue = Object.keys(monthRevenue).map(month => ({
      month,
      revenue: monthRevenue[month]
    }));

    res.json(revenue.length > 0 ? revenue : [
      { month: "Jan", revenue: 0 },
      { month: "Feb", revenue: 0 },
    ]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getStatusDistribution = async (req, res) => {
  try {
    const distribution = await Loan.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      group: ['status']
    });

    const statusData = distribution.map(d => ({
      name: d.status,
      value: parseInt(d.dataValues.count, 10)
    }));

    res.json(statusData.length > 0 ? statusData : [
      { name: "Approved", value: 0 },
      { name: "Pending", value: 0 },
    ]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

