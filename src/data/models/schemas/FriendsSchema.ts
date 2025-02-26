import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const FriendsSchema = new Schema({
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending'
  }
}, {
  timestamps: true
});

FriendsSchema.index({ requester: 1, recipient: 1 }, { unique: true });
FriendsSchema.index({ requester: 1, status: 1 });
FriendsSchema.index({ recipient: 1, status: 1 });

export { FriendsSchema };