import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio'],
    default: 'text'
  },
  mediaUrl: {
    type: String,
    default: null
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'users'
  }],
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'conversations',
    required: true
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const ConversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  name: {
    type: String,
    default: null
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'messages',
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indices for better query performance
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessage: 1 });
ConversationSchema.index({ createdAt: -1 });

export { MessageSchema, ConversationSchema }; 