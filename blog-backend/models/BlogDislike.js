import mongoose from 'mongoose';

const blogDislikeSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  }
);

blogDislikeSchema.index({ blog: 1, user: 1 }, { unique: true });

export default mongoose.model('BlogDislike', blogDislikeSchema);
