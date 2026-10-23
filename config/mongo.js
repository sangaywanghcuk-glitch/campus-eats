const { MongoClient } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectMongo() {
  if (db) return db;
  await client.connect();
  db = client.db(process.env.MONGO_DB_NAME || 'campus_eats_feedback');
  console.log(`Connected to MongoDB (${db.databaseName})`);
  return db;
}

async function closeMongo() {
  await client.close();
  db = undefined;
}

module.exports = { connectMongo, closeMongo };