import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const FollowersSchema = new Schema({
  follower: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: 'users',   
    required: true
  }
}, {
  timestamps: true
});

FollowersSchema.index({ follower: 1, following: 1 }, { unique: true });

export { FollowersSchema };