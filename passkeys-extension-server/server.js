const express = require('express');
const bodyParser = require('body-parser');
const base64url = require('base64url');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 3001;
// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(
  cors({
    origin: '*', // 或者指定特定的源
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

const users = {}; // 用于存储用户数据

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.post('/register', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).send('Username is required');
  }

  const user = {
    id: base64url(crypto.randomBytes(16)),
    username,
    credentials: [],
  };

  users[username] = user;

  const challenge = base64url(crypto.randomBytes(32));

  const pubKeyCredParams = [
    { type: 'public-key', alg: -7 }, // ES256
    { type: 'public-key', alg: -257 }, // RS256
  ];

  const options = {
    challenge,
    rp: {
      name: 'Example Corp',
    },
    user: {
      id: user.id,
      name: user.username,
      displayName: user.username,
    },
    pubKeyCredParams,
    attestation: 'direct',
  };

  user.currentChallenge = challenge;

  res.json(options);
});

app.post('/register/complete', async (req, res) => {
  const { username, id, rawId, response, type } = req.body;

  const user = users[username];

  const clientDataJSON = response.clientDataJSON;
  // 将 ArrayBuffer 转换为字符串
  const clientDataJSONString = Buffer.from(clientDataJSON, 'base64').toString('utf-8');

  // 将字符串转换为对象
  const clientData = JSON.parse(clientDataJSONString);

  // 获取 challenge
  const challenge = clientData.challenge;

  if (!user || user.currentChallenge !== challenge) {
    return res.status(400).send('Invalid challenge');
  }

  const attestationObject = base64url.toBuffer(response.attestationObject);

  // 这里需要处理 attestationObject 以验证凭证
  // 由于这是一个复杂的过程，建议查看 WebAuthn 规范或使用现有库

  user.credentials.push({
    id,
    publicKey: 'public-key-placeholder', // 应该从 attestationObject 中提取
    signCount: 0,
  });

  delete user.currentChallenge;

  res.send('Registration complete');
});

app.post('/login', (req, res) => {
  const { username } = req.body;

  const user = users[username];

  if (!user) {
    return res.status(400).send('User not found');
  }

  const challenge = base64url(crypto.randomBytes(32));

  const options = {
    challenge,
    allowCredentials: user.credentials.map((cred) => ({
      type: 'public-key',
      id: cred.id,
    })),
    userVerification: 'preferred',
  };

  user.currentChallenge = challenge;

  res.json(options);
});

app.post('/authenticate', async (req, res) => {
  const { username, id, rawId, response, type } = req.body;

  const user = users[username];
  const clientDataJSON = response.clientDataJSON;
  // 将 ArrayBuffer 转换为字符串
  const clientDataJSONString = Buffer.from(clientDataJSON, 'base64').toString('utf-8');

  // 将字符串转换为对象
  const clientData = JSON.parse(clientDataJSONString);

  // 获取 challenge
  const challenge = clientData.challenge;

  if (!user || user.currentChallenge !== challenge) {
    return res.status(400).send('Invalid challenge');
  }

  const authenticatorData = base64url.toBuffer(response.authenticatorData);

  // 这里需要处理 authenticatorData 以验证签名
  // 由于这是一个复杂的过程，建议查看 WebAuthn 规范或使用现有库

  delete user.currentChallenge;

  res.send('Login complete');
});
