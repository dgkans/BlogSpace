import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    const tempUser = await User.findOneAndUpdate(
      { username: 'temp_user' },
      {
        $setOnInsert: {
          id: 1,
          full_name: 'Temp User',
          username: 'temp_user',
          email: 'temp.user@blog.local',
          hashed_password: 'temp_hashed_password',
          is_active: true,
        },
      },
      { returnDocument: 'after', upsert: true }
    );

    console.log(`Temp user ready: ${tempUser.username} (${tempUser.email})`);
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
