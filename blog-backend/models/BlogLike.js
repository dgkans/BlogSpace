import mongoose from 'mongoose';

const blogLikeSchema = new mongoose.Schema(
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

blogLikeSchema.index({ blog: 1, user: 1 }, { unique: true });

export default mongoose.model('BlogLike', blogLikeSchema);
