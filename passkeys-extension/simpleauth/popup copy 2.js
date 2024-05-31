document.addEventListener('DOMContentLoaded', () => {
  const server = 'https://e435-103-104-168-149.ngrok-free.app';
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const toggleButton = document.getElementById('toggleButton');
  const statusDiv = document.getElementById('status');
  const titleH1 = document.getElementById('title');

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

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    if (!username) {
      notificationSystem.error('Username is required for registration');
      return;
    }
    try {
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

      const publicKeyCredentialCreationOptions = {
        ...options,
        challenge: Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0)),
        user: {
          ...options.user,
          id: Uint8Array.from(atob(options.user.id), (c) => c.charCodeAt(0)),
        },
      };

      const credential = await SimpleWebAuthnBrowser.startRegistration(publicKeyCredentialCreationOptions);

      const registerResponse = await fetch(server + '/register/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          credential: {
            id: credential.id,
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

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    if (!username) {
      notificationSystem.error('Username is required for login');
      return;
    }
    try {
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

      const publicKeyCredentialRequestOptions = {
        ...options,
        challenge: Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0)),
        allowCredentials: options.allowCredentials.map((cred) => ({
          ...cred,
          id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
        })),
      };

      const assertion = await SimpleWebAuthnBrowser.startAuthentication(publicKeyCredentialRequestOptions);

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
});
