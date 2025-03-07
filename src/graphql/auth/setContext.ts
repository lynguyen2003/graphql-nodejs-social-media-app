import { validateAuthToken, createAuthToken, createRefreshToken, validateRefreshToken, revokeRefreshToken } from './jwt.js';
import { environmentVariablesConfig } from '../../config/appConfig.js';
import { authValidations } from '../auth/authValidations.js';
import { ENVIRONMENT } from '../../config/environment.js';
import { logger } from '../../helpers/logger.js';
import { models } from '../../data/models/index.js';
import { Request } from 'express';

interface Context {
    di: {
        model: typeof models;
        authValidation: typeof authValidations;
        jwt: {
            createAuthToken: typeof createAuthToken;
            createRefreshToken: typeof createRefreshToken;
            validateRefreshToken: typeof validateRefreshToken;
            revokeRefreshToken: typeof revokeRefreshToken;
        };
    };
    user?: any;
}

/**
 * Context function for Apollo Server
 */
export const setContext = async ({ req }: { req: Request }): Promise<Context> => {
    const context: Context = {
        di: {
            model: {
                ...models,
            },
            authValidation: {
                ...authValidations,
            },
            jwt: {
                createAuthToken,
                createRefreshToken,
                validateRefreshToken,
                revokeRefreshToken,
            },
        },
    };

    let token = req.headers['authorization'];

    if (token && typeof token === 'string') {
        try {
            const authenticationScheme = 'Bearer ';
            if (token.startsWith(authenticationScheme)) {
                token = token.slice(authenticationScheme.length);
            }
            const user = await validateAuthToken(token);
            context.user = user; 
        } catch (error) {
            if (environmentVariablesConfig.environment !== ENVIRONMENT.PRODUCTION) {
                logger.debug(error.message);
            }
        }
    }

    return context;
};