import mongoose from 'mongoose';

const blogViewSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
      index: true,
    },
    referrer: {
      type: String,
      default: 'Direct',
      trim: true,
    },
    viewed_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { versionKey: false }
);

const BlogView = mongoose.model('BlogView', blogViewSchema);

export default BlogView;
