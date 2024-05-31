const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const app = express();
const port = 3001;
const rpID = 'localhost';
const origin = 'https://' + 'e435-103-104-168-149.ngrok-free.app';
app.use(
  cors({
    origin: '*', // 或者指定特定的源
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(bodyParser.json());

let users = {}; // 简单的内存存储用户信息

app.get('/hello', async (req, res) => {
  res.json({
    message: 'Hello, World!',
  });
});
app.post('/register', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const userId = crypto.randomBytes(16); // 生成 Buffer 类型的用户 ID
  const user = {
    id: userId,
    username,
    credentials: [],
  };

  users[username] = user;
  console.log('users', users);
  try {
    const options = await generateRegistrationOptions({
      rpName: 'Passkeys Demo',
      rpID: undefined,
      userID: user.id, // 使用 Buffer 类型的用户 ID
      userName: user.username,
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        userVerification: 'preferred',
      },
    });
    console.log('options', options);
    res.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    res.status(500).json({ error: 'Error generating registration options' });
  }
});

app.post('/register/complete', async (req, res) => {
  const { username, credential } = req.body;
  const user = users[username];

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }
  credential.response.id = credential.id;
  try {
    const _res = {
      credential,
      expectedChallenge: credential.response.clientDataJSON,
      // expectedOrigin: origin,
      expectedOrigin: undefined,
      expectedRPID: rpID,
      response: credential.response,
    };

    console.log('_res', _res);

    const verification = await verifyRegistrationResponse(_res);

    if (!verification.verified) {
      return res.status(400).json({ error: 'Registration verification failed' });
    }

    user.credentials.push(verification.registrationInfo);
    res.json({ success: true });
  } catch (error) {
    console.error('Error during registration verification:', error);
    res.status(500).json({ error: 'Registration verification error' });
  }
});

app.post('/login', async (req, res) => {
  const { username } = req.body;
  const user = users[username];

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const options = await generateAuthenticationOptions({
    allowCredentials: user.credentials.map((cred) => ({
      id: cred.credentialID,
      type: 'public-key',
      transports: ['usb', 'ble', 'nfc', 'internal'],
    })),
    userVerification: 'preferred',
  });

  res.json(options);
});

app.post('/authenticate', async (req, res) => {
  const { username, credential } = req.body;
  const user = users[username];

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      credential,
      expectedChallenge: credential.response.clientDataJSON,
      expectedRPID: rpID,
      authenticator: user.credentials.find((cred) => cred.credentialID === credential.id),
    });

    if (!verification.verified) {
      return res.status(400).json({ error: 'Authentication verification failed' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error during authentication verification:', error);
    res.status(500).json({ error: 'Authentication verification error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
