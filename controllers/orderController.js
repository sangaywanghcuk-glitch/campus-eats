const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  const { itemId } = req.body;

  const item = await MenuItem.getMenuItemById(itemId);
  if (!item) {
    return res.status(400).send('Invalid menu item.');
  }

  const order = await Order.createOrder(item.id, item.price, req.session.user.id);
  res.redirect(`/orders/${order.id}`);
};

exports.getOrder = async (req, res) => {
  const order = await Order.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).send('Order not found.');
  }
  res.render('order-details', { title: 'Order Details', order });
};

exports.updateOrder = async (req, res) => {
  // Add your order update logic here
  res.redirect('back');
};

exports.cancelOrder = async (req, res) => {
  // Add your order cancellation logic here
  res.redirect('back');
};