document.addEventListener('DOMContentLoaded', () => {
  const server = 'https://e435-103-104-168-149.ngrok-free.app';
  console.log('window', window.location);
  if (window.PublicKeyCredential) {
    console.log('WebAuthn is supported in this browser.');
  } else {
    console.log('WebAuthn is not supported in this browser.');
  }
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const toggleButton = document.getElementById('toggleButton');
  const statusDiv = document.getElementById('status');
  const titleH1 = document.getElementById('title');
  // 切换表单显示
  toggleButton.addEventListener('click', () => {
    if (registerForm.classList.contains('hidden')) {
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      toggleButton.innerText = 'Switch to Login';
      titleH1.innerText = 'Passkeys Register';
    } else {
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      toggleButton.innerText = 'Switch to Register';
      titleH1.innerText = 'Passkeys Login';
    }
  });
  // 注册表单提交事件
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    if (!username) {
      notificationSystem.error('Username is required for registration');
      return;
    }
    try {
      // 向服务器请求注册选项
      const response = await fetch(server + '/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch registration options');
      }
      const options = await response.json();
      // 创建新的凭证
      const credential_parmas = {
        publicKey: {
          challenge: base64URLStringToBuffer(options.challenge),
          rp: options.rp,
          user: {
            id: base64URLStringToBuffer(options.user.id),
            name: options.user.name,
            displayName: options.user.displayName,
          },
          pubKeyCredParams: options.pubKeyCredParams,
          authenticatorSelection: options.authenticatorSelection,
          timeout: options.timeout,
          attestation: options.attestation,
        },
      };
      const credential = await navigator.credentials.create(credential_parmas);
      console.log('credential', typeof credential.id);
      // 将凭证发送到服务器进行注册
      const registerResponse = await fetch(server + '/register/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          credential: {
            id: bufferToBase64URLString(credential.id),
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
            },
            type: credential.type,
          },
        }),
      });
      if (!registerResponse.ok) {
        throw new Error('Failed to complete registration');
      }
      const registerResult = await registerResponse.json();
      if (registerResult.success) {
        notificationSystem.success('Registration successful');
      } else {
        notificationSystem.error('Registration failed: ' + registerResult.error);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      notificationSystem.error('Error during registration: ' + error.message);
    }
  });
  // 登录表单提交事件
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    if (!username) {
      notificationSystem.error('Username is required for login');
      return;
    }
    try {
      // 向服务器请求登录选项
      const response = await fetch(server + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch login options');
      }
      const options = await response.json();
      // 获取客户端凭证
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: base64URLStringToBuffer(options.challenge),
          allowCredentials: options.allowCredentials.map((cred) => ({
            id: base64URLStringToBuffer(cred.id),
            type: cred.type,
            transports: cred.transports,
          })),
          userVerification: options.userVerification,
        },
      });
      // 将凭证发送到服务器进行认证
      const authenticateResponse = await fetch(server + '/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          credential: {
            id: assertion.id,
            rawId: Array.from(new Uint8Array(assertion.rawId)),
            response: {
              clientDataJSON: Array.from(new Uint8Array(assertion.response.clientDataJSON)),
              authenticatorData: Array.from(new Uint8Array(assertion.response.authenticatorData)),
              signature: Array.from(new Uint8Array(assertion.response.signature)),
              userHandle: assertion.response.userHandle ? Array.from(new Uint8Array(assertion.response.userHandle)) : null,
            },
            type: assertion.type,
          },
        }),
      });
      if (!authenticateResponse.ok) {
        throw new Error('Failed to authenticate');
      }
      const authenticateResult = await authenticateResponse.json();
      if (authenticateResult.success) {
        notificationSystem.success('Login successful');
      } else {
        notificationSystem.error('Login failed: ' + authenticateResult.error);
      }
    } catch (error) {
      console.error('Error during login:', error);
      notificationSystem.error('Error during login: ' + error.message);
    }
  });
  function base64URLStringToBuffer(base64URLString) {
    const padding = '='.repeat((4 - (base64URLString.length % 4)) % 4);
    const base64 = (base64URLString + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0))).buffer;
  }
  // document.getElementById('register-form').addEventListener('submit', async (e) => {
  //   e.preventDefault();
  //   try {
  //     const publicKeyCredentialCreationOptions = {
  //       challenge: Uint8Array.from('randomChallenge', (c) => c.charCodeAt(0)),
  //       rp: {
  //         name: 'Example Corp',
  //       },
  //       user: {
  //         id: Uint8Array.from('UZSL85T9AFC', (c) => c.charCodeAt(0)),
  //         name: 'user@example.com',
  //         displayName: 'User Example',
  //       },
  //       pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
  //       authenticatorSelection: {
  //         authenticatorAttachment: 'platform',
  //       },
  //       timeout: 60000,
  //       attestation: 'direct',
  //     };
  //     const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
  //     console.log('Credential created:', credential);
  //   } catch (error) {
  //     console.error('Error during registration:', error);
  //   }
  // });
});
