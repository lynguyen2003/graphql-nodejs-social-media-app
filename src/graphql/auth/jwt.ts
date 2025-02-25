import jwt from 'jsonwebtoken';

import { securityVariablesConfig } from '../../config/appConfig.js';

export const createAuthToken = (email, isAdmin, isActive, _id) => {
	return jwt.sign({ email, isAdmin, isActive, _id }, securityVariablesConfig.secret, { expiresIn: securityVariablesConfig.timeExpiration });
};

export const validateAuthToken = async (token) => {
	const user = await jwt.verify(token, securityVariablesConfig.secret);
	return user;
};
