import jwt from 'jsonwebtoken';
import { models } from '../data/models';

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (!decoded || !decoded.userId) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            
            const user = await models.Users.findById(decoded.userId).lean();
            
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }
            
            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    error: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            return res.status(401).json({ error: 'Authentication failed' });
        }
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
};