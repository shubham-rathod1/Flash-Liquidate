const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
// const { fromUtf8 } = require('@aws-sdk/util-utf8-node');
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};

const secretName = 'testSecretsManager';
const client = new SecretsManagerClient({ region: awsConfig.region });

const getSecret = async () => {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
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
