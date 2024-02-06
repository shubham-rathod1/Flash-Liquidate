const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
require('dotenv').config();

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    // new winston.transports.Console(),
    new WinstonCloudWatch({
      logGroupName: 'testLog',
      logStreamName: 'testStream',
      awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
      awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
      awsRegion: process.env.AWS_REGION,
    }),
  ],
});

// Example log statements
// logger.info('This is an information message.');
// logger.warn('This is a warning message.');
// logger.error("This is an error message.");

// setInterval(() => {
//   logger.error("This is an error message.");
// }, 5000);

module.exports = logger;
