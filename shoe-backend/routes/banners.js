const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/banner.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// Public routes
router.get("/active", bannerController.getActiveBanners);
router.post("/:id/click", bannerController.trackBannerClick);
router.post("/impressions", bannerController.trackBannerImpression);

// Admin routes
router.use(verifyToken, isAdmin);

router.get("/", bannerController.getAllBanners);
router.get("/analytics", bannerController.getBannerAnalytics);
router.get("/:id", bannerController.getBannerById);
router.post("/", bannerController.createBanner);
router.put("/:id", bannerController.updateBanner);
router.put("/:id/toggle", bannerController.toggleBannerStatus);
router.delete("/:id", bannerController.deleteBanner);

module.exports = router;