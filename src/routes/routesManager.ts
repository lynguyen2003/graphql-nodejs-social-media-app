import { Router } from 'express';
import { getUnreadNotifications } from '../middleware/notificationMiddleware.js';
import uploadRouter from './uploadRoutes.js';

const routesManager = Router();

routesManager.get('/graphql', (req, res) => {
	const status = 200;
	res.status(status).end();
});

routesManager.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok' });
});

routesManager.get('/notifications/unread', getUnreadNotifications);

routesManager.use('/api', uploadRouter);

export default routesManager;
