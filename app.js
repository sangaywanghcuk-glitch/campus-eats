const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files (CSS, client-side JS)
app.use(express.static(path.join(__dirname, 'public')));

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware (Must be placed BEFORE routes)
const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || 'campus-eats-dev-secret',
  resave: false,
  saveUninitialized: false,
}));

// Make the logged-in user available to every view automatically
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Connect MongoDB once when the server starts, but skip during tests
const { connectMongo } = require('./config/mongo');
if (process.env.NODE_ENV !== 'test') {
  connectMongo().catch(err => console.error('MongoDB connection failed:', err));
}

// Routes (Must be placed AFTER middleware)
const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Export the app for testing (no app.listen here)
module.exports = app;