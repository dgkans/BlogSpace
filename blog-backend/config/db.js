import mongoose from 'mongoose';

const buildOptions = (mongoUri) => {
  const opts = {
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  };
  const isSrv = mongoUri.startsWith('mongodb+srv://');
  const isLocal =
    /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(mongoUri) ||
    /^mongodb:\/\/(127\.0\.0\.1|localhost)\//i.test(mongoUri);
  // Atlas SRV: TLS is implied; do not force authSource/ssl (can break some Atlas users).
  // Non-SRV remote (uncommon): keep TLS-friendly defaults.
  if (!isSrv && !isLocal) {
    opts.authSource = 'admin';
    opts.ssl = true;
  }
  return opts;
};

const connectDB = async () => {
  // Heroku copy-paste often adds a trailing newline; breaks SRV lookup (EBADNAME).
  const mongoUri = (process.env.MONGODB_URI || '').trim();

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  const options = buildOptions(mongoUri);
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await mongoose.connect(mongoUri, options);
      console.log('MongoDB connected successfully');
      return;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection attempt ${attempt}/3:`, error.message);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  throw lastError;
};

export default connectDB;
