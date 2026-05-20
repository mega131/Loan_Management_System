console.log("Dashboard Router File Loaded");
const express = require("express");

const router = express.Router();

const {
  getDashboardStats,
  getLoanTrends,
  getRevenueAnalytics,
  getStatusDistribution,
} = require("../controllers/dashboardController");

router.get("/stats", getDashboardStats);

router.get("/loan-trends", getLoanTrends);

router.get("/revenue", getRevenueAnalytics);

router.get(
  "/status-distribution",
  getStatusDistribution
);

module.exports = router;

console.log("Dashboard Routes Loaded");