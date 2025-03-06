import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const RefreshTokensSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d'
    }
});

export { RefreshTokensSchema };