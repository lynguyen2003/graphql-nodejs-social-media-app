import express from "express"
import cors from "cors";
import bodyParser from "body-parser"
import dotenv from "dotenv"
import { createServer } from "http";
import { ApolloServer } from 'apollo-server-express';

import { setContext } from "./graphql/auth/setContext.js";
import connectDB from "./config/database.js"
import { connectRedis } from "./config/redisDb.js";
import { logger } from "./helpers/logger.js";
import { resolvers } from "./graphql/resolvers/index.js";
import { environmentVariablesConfig } from "./config/appConfig.js";
import { initTypeDefinition } from "./graphql/types/index.js";
import { setupViewCountSync } from "./helpers/viewCountSync.js";
import { initializeWebSocketServer } from "./services/websocketService.js";

import routesManager from "./routes/routesManager.js";

dotenv.config();

const startServer = async () => {
  try {
    const app = express();
    const httpServer = createServer(app);
    
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
    await connectDB();
    await connectRedis();
    
    const typeDefs = await initTypeDefinition();
    const server = new ApolloServer({ 
      typeDefs, 
      resolvers,
      context: setContext,
    });
    
    await server.start();
    server.applyMiddleware({ app });
    
    app.use('/', routesManager);
    
    app.use((err, req, res, next) => {
      logger.error(err.stack);
      res.status(500).json({ error: 'Something went wrong!' });
    });
    
    const PORT = environmentVariablesConfig.port || 4000;
    httpServer.listen(PORT, () => {
      logger.info(`GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
    });
    
    if (typeof initializeWebSocketServer === 'function') {
      initializeWebSocketServer(httpServer);
    }
    
    if (typeof setupViewCountSync === 'function') {
      setupViewCountSync();
    }
    
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

