document.addEventListener('DOMContentLoaded', () => {
  if (window.PublicKeyCredential) {
    console.log('WebAuthn is supported in this browser.');
  } else {
    console.log('WebAuthn is not supported in this browser.');
  }

  document.getElementById('register-btn').addEventListener('click', register);
  document.getElementById('login-btn').addEventListener('click', login);
});
const server = 'https://484a-103-104-168-149.ngrok-free.app';
function base64UrlToBase64(base64Url) {
  return base64Url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), '=');
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function register() {
  const username = document.getElementById('register-username').value;

  if (!username) {
    notificationSystem.error('Username is required');
    return;
  }

  const registerResponse = await fetch(server + '/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });

  const options = await registerResponse.json();

  // 检查并处理Base64URL字符串
  try {
    options.challenge = base64ToArrayBuffer(base64UrlToBase64(options.challenge));
    options.user.id = base64ToArrayBuffer(base64UrlToBase64(options.user.id));
  } catch (e) {
    console.error('Failed to decode Base64URL string:', e);
    notificationSystem.error('Failed to decode Base64URL string');
    return;
  }
  try {
    const credential = await navigator.credentials.create({ publicKey: options });
    console.log('credential', credential);
    const response = {
      id: credential.id,
      rawId: Array.from(new Uint8Array(credential.rawId)),
      response: {
        clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
        attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
      },
      type: credential.type,
    };

    await fetch(server + '/register/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, ...response }),
    });

    notificationSystem.success('Registration complete');
  } catch (error) {
    notificationSystem.error('error', error);
  }
}

async function login() {
  const username = document.getElementById('login-username').value;

  if (!username) {
    alert('Username is required');
    return;
  }

  const loginResponse = await fetch(server + '/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });

  const options = await loginResponse.json();

  // 检查并处理Base64URL字符串
  try {
    options.challenge = base64ToArrayBuffer(base64UrlToBase64(options.challenge));
    options.allowCredentials = options.allowCredentials.map((cred) => {
      cred.id = base64ToArrayBuffer(base64UrlToBase64(cred.id));
      return cred;
    });
  } catch (e) {
    console.error('Failed to decode Base64URL string:', e);
    notificationSystem.error('Failed to decode Base64URL string');
    return;
  }

  const assertion = await navigator.credentials.get({ publicKey: options });

  const response = {
    id: assertion.id,
    rawId: Array.from(new Uint8Array(assertion.rawId)),
    response: {
      clientDataJSON: Array.from(new Uint8Array(assertion.response.clientDataJSON)),
      authenticatorData: Array.from(new Uint8Array(assertion.response.authenticatorData)),
      signature: Array.from(new Uint8Array(assertion.response.signature)),
      userHandle: assertion.response.userHandle ? Array.from(new Uint8Array(assertion.response.userHandle)) : null,
    },
    type: assertion.type,
  };

  await fetch(server + '/authenticate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, ...response }),
  });

  notificationSystem.success('Login complete');
}
