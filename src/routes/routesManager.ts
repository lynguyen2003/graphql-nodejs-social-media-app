import { Router } from 'express';
import mediaRouter from './mediaRoutes.js';
import { getUnreadNotifications } from '../middleware/notificationMiddleware.js';

const routesManager = Router();

routesManager.get('/', (req, res) => {
	const status = 200;
	res.status(status).end();
});

routesManager.use('/media', mediaRouter);

routesManager.get('/notifications/unread', getUnreadNotifications);

export default routesManager;
