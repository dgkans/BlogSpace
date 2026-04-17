import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    const plainPassword = process.env.SEED_TEMP_PASSWORD || 'TempPass123!';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const email = 'temp.user@blog.local';
    let user = await User.findOne({ email });

    if (user) {
      user.hashed_password = hashedPassword;
      user.is_active = true;
      await user.save();
    } else {
      const lastUserWithId = await User.findOne({ id: { $ne: null } })
        .sort({ id: -1 })
        .select('id');
      const nextId = lastUserWithId?.id ? lastUserWithId.id + 1 : 1;

      user = await User.create({
        id: nextId,
        full_name: 'Temp User',
        username: 'temp_user',
        email,
        hashed_password: hashedPassword,
        is_active: true,
      });
    }

    console.log(`Temp user ready: ${user.username} (${user.email})`);
    console.log(`Sign-in: email=${email} password=${plainPassword}`);
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
