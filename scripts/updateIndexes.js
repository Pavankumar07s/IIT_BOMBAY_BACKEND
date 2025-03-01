const mongoose = require('mongoose');
require('dotenv').config();

const updateIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Drop the existing email index
    await collection.dropIndex('email_1');

    // Create a new sparse index for email
    await collection.createIndex({ email: 1 }, { sparse: true });

    console.log('Indexes updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating indexes:', error);
    process.exit(1);
  }
};

updateIndexes();