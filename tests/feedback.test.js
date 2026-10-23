const request = require('supertest');
const app = require('../app');
const db = require('../config/db');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const { connectMongo, closeMongo } = require('../config/mongo');

let restaurantId, otherRestaurantId, adminId;
const adminEmail = 'feedback.admin.sherubtse@rub.edu.bt';

beforeAll(async () => {
  const r1 = await db.one(
    `INSERT INTO restaurants (name, cuisine, rating) VALUES ($1, $2, $3) RETURNING id`,
    ['Feedback Cafe', 'Test', 4]
  );
  const r2 = await db.one(
    `INSERT INTO restaurants (name, cuisine, rating) VALUES ($1, $2, $3) RETURNING id`,
    ['Other Cafe', 'Test', 4]
  );
  restaurantId = r1.id;
  otherRestaurantId = r2.id;

  // Check if admin already exists to avoid unique constraint violations
  let admin = await User.findByEmail(adminEmail);
  if (!admin) {
    admin = await User.createUser({
      name: 'Feedback Admin',
      email: adminEmail,
      password: 'adminpass123',
      verificationToken: 'not-needed',
    });
  }
  adminId = admin.id;
  await db.none(`UPDATE users SET is_verified = true, role = 'admin' WHERE id = $1`, [adminId]);
  await db.none('UPDATE restaurants SET owner_id = $1 WHERE id = $2', [adminId, restaurantId]);
}, 10000);

afterAll(async () => {
  try {
    const mongo = await connectMongo();
    if (mongo) {
      await mongo.collection('feedback').deleteMany({
        restaurantId: { $in: [restaurantId, otherRestaurantId, 999999] },
      });
    }
  } catch (err) {
    console.error('Mongo cleanup error:', err);
  }

  try {
    if (restaurantId) {
      await db.none('UPDATE restaurants SET owner_id = NULL WHERE id = $1', [restaurantId]);
    }
    if (adminId) {
      await db.none('DELETE FROM users WHERE id = $1', [adminId]);
    }
    if (restaurantId || otherRestaurantId) {
      await db.none('DELETE FROM restaurants WHERE id IN ($1, $2)', [restaurantId || 0, otherRestaurantId || 0]);
    }
  } catch (err) {
    console.error('Postgres cleanup error:', err);
  }

  await closeMongo();
  if (db && db.$pool) {
    await db.$pool.end();
  }
}, 15000);

describe('POST /restaurants/:id/feedback', () => {
  it('stores a valid submission in MongoDB under the PostgreSQL restaurant id', async () => {
    const res = await request(app)
      .post(`/restaurants/${restaurantId}/feedback`)
      .type('form')
      .send({ customerName: 'Pema', rating: '5', comment: 'Great momos' });

    expect(res.status).toBe(302);
    const docs = await Feedback.getFeedbackForRestaurant(restaurantId);
    const saved = docs.find(d => d.comment === 'Great momos');
    expect(saved).toBeDefined();
    expect(saved.rating).toBe(5);
    expect(saved.restaurantId).toBe(restaurantId);
  }, 10000);

  it('rejects an out-of-range rating and writes nothing to MongoDB', async () => {
    const before = (await Feedback.getFeedbackForRestaurant(otherRestaurantId)).length;

    await request(app)
      .post(`/restaurants/${otherRestaurantId}/feedback`)
      .type('form')
      .send({ customerName: 'Pema', rating: '9', comment: 'Invalid rating' });

    const after = (await Feedback.getFeedbackForRestaurant(otherRestaurantId)).length;
    expect(after).toBe(before);
  }, 10000);

  it('returns 404 for a restaurant that does not exist in PostgreSQL, and writes nothing to MongoDB', async () => {
    const res = await request(app)
      .post('/restaurants/999999/feedback')
      .type('form')
      .send({ customerName: 'Pema', rating: '4', comment: 'Ghost restaurant' });

    expect(res.status).toBe(404);
    const mongo = await connectMongo();
    expect(await mongo.collection('feedback').countDocuments({ restaurantId: 999999 })).toBe(0);
  }, 10000);
});

describe('GET /admin/dashboard (PostgreSQL + MongoDB combined)', () => {
  it('shows the admin their own restaurant and its feedback, and never another restaurant\'s', async () => {
    await Feedback.createFeedback({ restaurantId, customerName: 'Dorji', rating: 4, comment: 'Seen on dashboard' });
    await Feedback.createFeedback({ restaurantId: otherRestaurantId, customerName: 'Dorji', rating: 1, comment: 'Secret other cafe' });

    const agent = request.agent(app);
    await agent.post('/login').type('form').send({ email: adminEmail, password: 'adminpass123' });
    const res = await agent.get('/admin/dashboard');

    expect(res.status).toBe(200);
    expect(res.text).toContain('Feedback Cafe');
    expect(res.text).toContain('Seen on dashboard');
    expect(res.text).not.toContain('Secret other cafe');
  }, 10000);
});