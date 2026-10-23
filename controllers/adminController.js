const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Feedback = require('../models/Feedback'); // Added for Lab 8[cite: 1]

exports.dashboard = async (req, res) => {
  const restaurant = await Restaurant.getRestaurantByOwnerId(req.session.user.id);
  
  if (!restaurant) {
    return res.render('admin-dashboard', { title: 'My Dashboard', restaurant: null, items: [], feedback: [] }); // Added feedback: [] for safety[cite: 1]
  }

  const items = await MenuItem.getMenuByRestaurant(restaurant.id);
  const feedback = await Feedback.getFeedbackForRestaurant(restaurant.id); // Added for Lab 8[cite: 1]
  
  res.render('admin-dashboard', { title: 'My Dashboard', restaurant, items, feedback }); // Passed feedback into view[cite: 1]
};

exports.addMenuItem = async (req, res) => {
  const restaurant = await Restaurant.getRestaurantByOwnerId(req.session.user.id);
  const { name, price } = req.body;
  
  if (!restaurant || !name || !price || Number(price) <= 0) {
    return res.redirect('/admin/dashboard');
  }
  
  await MenuItem.createMenuItem({ restaurantId: restaurant.id, name, price: Number(price) });
  res.redirect('/admin/dashboard');
};