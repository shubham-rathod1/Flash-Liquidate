const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
require('dotenv').config();

const awsConfig = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
};

const client = new SecretsManagerClient(awsConfig);

const getSecret = async () => {
  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.AWS_SECRET_ID,
    });
    const data = await client.send(command);

    if ('SecretString' in data) {
      const secret = JSON.parse(data.SecretString);
      for (const envKey of Object.keys(secret)) {
        process.env[envKey] = secret[envKey];
      }
    } else {
      console.log('Secret key not available ');
    }
    return JSON.parse(data.SecretString);
  } catch (err) {
    console.error('An error occurred:', err);
  }
};

module.exports = getSecret;
