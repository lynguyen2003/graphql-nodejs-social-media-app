import { Router } from 'express';
import mediaRouter from './mediaRoutes.js';

const routesManager = Router();

routesManager.get('/', (req, res) => {
	const status = 200;
	res.status(status).end();
});

routesManager.use('/media', mediaRouter);

export default routesManager;
