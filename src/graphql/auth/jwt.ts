import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { securityVariablesConfig } from '../../config/appConfig.js';
import { models } from '../../data/models/index.js';

export const createAuthToken = (email, isAdmin, isActive, _id) => {
    return jwt.sign(
        { email, isAdmin, isActive, _id }, 
        securityVariablesConfig.secret, 
        { expiresIn: securityVariablesConfig.timeExpiration }
    );
};

export const createRefreshToken = async (userId) => {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    await models.RefreshTokens.create({
        userId,
        token: refreshToken,
        expiresAt
    });
    
    return refreshToken;
};

export const validateAuthToken = async (token) => {
    try {
        const user = await jwt.verify(token, securityVariablesConfig.secret);
        return user;
    } catch (error) {
        throw error;
    }
};

export const validateRefreshToken = async (refreshToken) => {
    try {
        const tokenDoc = await models.RefreshTokens.findOne({ 
            token: refreshToken,
            expiresAt: { $gt: new Date() }
        });
        
        if (!tokenDoc) {
            throw new Error('Invalid or expired refresh token');
        }
        
        const user = await models.Users.findById(tokenDoc.userId);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        return user;
    } catch (error) {
        throw error;
    }
};

export const revokeRefreshToken = async (refreshToken) => {
    await models.RefreshTokens.deleteOne({ token: refreshToken });
};