import mongoose from 'mongoose';


const userSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    hashed_password: {
      type: String,
      required: true,
      trim: true,
    },
    is_active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    id: false,
    versionKey: false,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
