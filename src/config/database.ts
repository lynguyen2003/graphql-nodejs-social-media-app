import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "../helpers/logger.js"
import { environmentVariablesConfig } from "./appConfig.js";
import { ENVIRONMENT } from "./environment.js";

dotenv.config();

const connectDB = async () => {
  try {
    const clientOptions: object = { serverApi: { version: process.env.VERSION, strict: true, deprecationErrors: true } }

    if(!process.env.VERSION) {
      return logger.error(`VERSION is not defined in environment variables`);
    }
    if (!process.env.MONGO_URI) {
      return logger.error("MONGO_URI is not defined in environment variables")
    }
    await mongoose.connect(process.env.MONGO_URI, clientOptions)

    const db = mongoose.connection;
    db.on('error', (err) => {
      logger.error(`Connection error with database. ${err}`);
    });

    db.once('open', () => {
      if (environmentVariablesConfig.environment !== ENVIRONMENT.DEVELOPMENT) {
        logger.info(`Connected with MongoDB service (${ENVIRONMENT.PRODUCTION} mode)`);
      } else {
        if (environmentVariablesConfig.formatConnection === 'DNSseedlist' && environmentVariablesConfig.mongoDNSseedlist !== '') {
          logger.info(`Connected with MongoDB service at "${environmentVariablesConfig.mongoDNSseedlist}" using database "${environmentVariablesConfig.database}" (${ENVIRONMENT.DEVELOPMENT} mode)`);
        } else {
          logger.info(`Connected with MongoDB service at "${environmentVariablesConfig.dbHost}" in port "${environmentVariablesConfig.dbPort}" using database "${environmentVariablesConfig.database}" (${ENVIRONMENT.DEVELOPMENT} mode)`);
        }
      }
    });

  } catch (error) {
    logger.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
