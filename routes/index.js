const express = require('express');
const router = express.Router();

// Controllers
const homeController = require('../controllers/homeController');
const aboutController = require('../controllers/aboutController');
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const superAdminController = require('../controllers/superAdminController');
const menuController = require('../controllers/menuController');
const orderController = require('../controllers/orderController'); 
const feedbackController = require('../controllers/feedbackController'); // Added for Lab 8[cite: 1]

// Middleware
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

// Public & Home Routes
router.get('/', homeController.getHome);
router.get('/about', aboutController.getAbout);

// Menu & Feedback Routes
router.get('/restaurants/:id/menu', menuController.getMenuByRestaurant); 
router.post('/restaurants/:id/feedback', feedbackController.submitFeedback); // Added for Lab 8[cite: 1]

// Order Routes
router.post('/orders', requireAuth, orderController.createOrder);
router.get('/orders/:id', orderController.getOrder);
router.post('/orders/:id/update', orderController.updateOrder); 
router.post('/orders/:id/cancel', orderController.cancelOrder); 

// Auth & User Routes
router.get('/verify/:token', authController.verifyEmail);
router.get('/signup', authController.showSignup);
router.post('/signup', authController.signup);
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

router.get('/forgot-password', authController.showForgotPassword);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.showResetPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Admin Routes
router.get('/admin/dashboard', requireAdmin, adminController.dashboard);
router.post('/admin/menu', requireAdmin, adminController.addMenuItem);

// Super Admin Routes
router.get('/superadmin/dashboard', requireSuperAdmin, superAdminController.dashboard);
router.post('/superadmin/restaurants', requireSuperAdmin, superAdminController.addRestaurant);
router.post('/superadmin/restaurants/:id/remove', requireSuperAdmin, superAdminController.removeRestaurant);
router.post('/superadmin/grant-admin', requireSuperAdmin, superAdminController.grantAdmin);

module.exports = router;