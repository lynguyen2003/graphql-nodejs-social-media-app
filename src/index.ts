import express from "express"
import cors from "cors";
import bodyParser from "body-parser"
import dotenv from "dotenv"
import favicon from "serve-favicon"
import path from "path";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { ApolloServer, UserInputError } from 'apollo-server-express';

import { logger } from "./helpers/logger.js";
import connectDB from "./config/database.js"
import { resolvers } from "./graphql/resolvers/index.js";
import { environmentVariablesConfig } from "./config/appConfig.js";
import { getListOfIPV4Address } from "./helpers/getListOfIPV4Address.js";
import { ENVIRONMENT } from "./config/environment.js";
import { initTypeDefinition } from "./graphql/types/index.js";
import { setContext } from "./graphql/auth/setContext.js";
import routesManager from "./routes/routesManager.js";
import { connectRedis } from "./config/redisDb.js";
import { setupViewCountSync } from "./helpers/viewCountSync.js";
import { setupMediaCleanup } from "./helpers/mediaCleanup.js";
import { initializeWebSocketServer } from "./services/websocket/websocketService.js";

dotenv.config()

const app = express()
const httpServer = createServer(app);

await connectDB();
console.log('Connected to database');
await connectRedis();
console.log('Connected to Redis');
setupViewCountSync();
console.log('View count sync setup');
//setupMediaCleanup();
console.log('Media cleanup setup');
initializeWebSocketServer(httpServer);
console.log('WebSocket server initialized');


const typeDefs = await initTypeDefinition();
const server = new ApolloServer({ 
  	typeDefs, 
  	resolvers,
  	context: setContext,
	formatError (error) {
		if ( !(error.originalError instanceof UserInputError) ) {
			logger.error(error.message);
		}

		return error;
	},
})

const startServer = async () => {
	await server.start();	
	server.applyMiddleware({ app });

	app.use(cors());
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
	app.use(bodyParser.json());
	app.use('/', routesManager);
	
	app.listen(environmentVariablesConfig.port, () => {
			getListOfIPV4Address().forEach(ip => {
				logger.info(`Application running on: http://${ip}:${environmentVariablesConfig.port}`);
				if (environmentVariablesConfig.environment !== ENVIRONMENT.PRODUCTION) {
					logger.info(`GraphQL Playground running on: http://${ip}:${environmentVariablesConfig.port}${server.graphqlPath}`);
				}
			});
		});
};

await startServer();

