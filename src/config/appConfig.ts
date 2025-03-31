import dotenv from 'dotenv';
dotenv.config();

import { ENVIRONMENT } from './environment.js';

const serverPortByDefault = 4000;

export const environmentVariablesConfig = Object.freeze({
	formatConnection: process.env.MONGO_FORMAT_CONNECTION,
	mongoDNSseedlist: process.env.MONGO_DNS_SEEDLIST_CONNECTION,
	dbHost: process.env.MONGO_HOST,
	dbPort: process.env.MONGO_PORT,
	database: process.env.MONGO_DB,
	mongoUser: process.env.MONGO_USER,
	mongoPass: process.env.MONGO_PASS,
	environment: (process.env.c === ENVIRONMENT.DEVELOPMENT) ? ENVIRONMENT.DEVELOPMENT : ENVIRONMENT.PRODUCTION,
	port: Number(process.env.PORT) || serverPortByDefault,
	emailHost: process.env.EMAIL_HOST,
	emailPort: Number(process.env.EMAIL_PORT),
	emailUser: process.env.EMAIL_USER,
	emailPassword: process.env.EMAIL_PASSWORD,
	emailFrom: process.env.EMAIL_FROM,
	twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
	twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
	twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
	awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
	awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	awsRegion: process.env.AWS_REGION,
	awsS3Bucket: process.env.AWS_S3_BUCKET,
	awsCloudfrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN
});


export const securityVariablesConfig = Object.freeze({
	secret: process.env.JWT_SECRET,	
	timeExpiration: process.env.JWT_DURATION
});
