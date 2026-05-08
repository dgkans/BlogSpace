import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 320,
      default: '',
    },
    content_delta: {
      type: Object,
      required: true,
      default: { ops: [] },
    },
    content_html: {
      type: String,
      required: true,
      default: '',
    },
    thumbnail_url: {
      type: String,
      trim: true,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    view_count: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled'],
      default: 'draft',
      index: true,
    },
    published_at: {
      type: Date,
      default: null,
    },
    scheduled_at: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    versionKey: false,
  }
);

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
