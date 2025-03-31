import { Router } from 'express';
import { getUnreadNotifications } from '../middleware/notificationMiddleware.js';
import { presignedUrl } from '../services/s3Services.js';

const routesManager = Router();

routesManager.get('/graphql', (req, res) => {
	const status = 200;
	res.status(status).end();
});

routesManager.get('/presigned-url', async (req, res) => {
	try {
		const { postType, fileName, fileType } = req.body;
		console.log(req);

		const data = await presignedUrl(postType as string, fileName as string, fileType as string);

		res.status(200).json(data);
	} catch (error: any) {
		res.status(400).json({ message: error.message });
	}
});

routesManager.get('/notifications/unread', getUnreadNotifications);

export default routesManager;
