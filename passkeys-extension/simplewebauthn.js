/* [@simplewebauthn/browser@10.0.0] */
!(function (e, t) {
  'object' == typeof exports && 'undefined' != typeof module
    ? t(exports)
    : 'function' == typeof define && define.amd
    ? define(['exports'], t)
    : t(((e = 'undefined' != typeof globalThis ? globalThis : e || self).SimpleWebAuthnBrowser = {}));
})(this, function (e) {
  'use strict';
  function t(e) {
    const t = new Uint8Array(e);
    let r = '';
    for (const e of t) r += String.fromCharCode(e);
    return btoa(r).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
  function r(e) {
    const t = e.replace(/-/g, '+').replace(/_/g, '/'),
      r = (4 - (t.length % 4)) % 4,
      n = t.padEnd(t.length + r, '='),
      o = atob(n),
      i = new ArrayBuffer(o.length),
      a = new Uint8Array(i);
    for (let e = 0; e < o.length; e++) a[e] = o.charCodeAt(e);
    return i;
  }
  function n() {
    return void 0 !== window?.PublicKeyCredential && 'function' == typeof window.PublicKeyCredential;
  }
  function o(e) {
    const { id: t } = e;
    return { ...e, id: r(t), transports: e.transports };
  }
  function i(e) {
    return 'localhost' === e || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(e);
  }
  class a extends Error {
    constructor({ message: e, code: t, cause: r, name: n }) {
      super(e, { cause: r }), (this.name = n ?? r.name), (this.code = t);
    }
  }
  const s = new (class {
      createNewAbortSignal() {
        if (this.controller) {
          const e = new Error('Cancelling existing WebAuthn API call for new one');
          (e.name = 'AbortError'), this.controller.abort(e);
        }
        const e = new AbortController();
        return (this.controller = e), e.signal;
      }
      cancelCeremony() {
        if (this.controller) {
          const e = new Error('Manually cancelling existing WebAuthn API call');
          (e.name = 'AbortError'), this.controller.abort(e), (this.controller = void 0);
        }
      }
    })(),
    c = ['cross-platform', 'platform'];
  function l(e) {
    if (e && !(c.indexOf(e) < 0)) return e;
  }
  function u(e, t) {
    console.warn(
      `The browser extension that intercepted this WebAuthn API call incorrectly implemented ${e}. You should report this error to them.\n`,
      t
    );
  }
  function d() {
    if (!n()) return new Promise((e) => e(!1));
    const e = window.PublicKeyCredential;
    return void 0 === e.isConditionalMediationAvailable ? new Promise((e) => e(!1)) : e.isConditionalMediationAvailable();
  }
  (e.WebAuthnAbortService = s),
    (e.WebAuthnError = a),
    (e.base64URLStringToBuffer = r),
    (e.browserSupportsWebAuthn = n),
    (e.browserSupportsWebAuthnAutofill = d),
    (e.bufferToBase64URLString = t),
    (e.platformAuthenticatorIsAvailable = function () {
      return n() ? PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() : new Promise((e) => e(!1));
    }),
    (e.startAuthentication = async function (e, c = !1) {
      if (!n()) throw new Error('WebAuthn is not supported in this browser');
      let u;
      0 !== e.allowCredentials?.length && (u = e.allowCredentials?.map(o));
      const h = { ...e, challenge: r(e.challenge), allowCredentials: u },
        f = {};
      if (c) {
        if (!(await d())) throw Error('Browser does not support WebAuthn autofill');
        if (document.querySelectorAll("input[autocomplete$='webauthn']").length < 1)
          throw Error('No <input> with "webauthn" as the only or last value in its `autocomplete` attribute was detected');
        (f.mediation = 'conditional'), (h.allowCredentials = []);
      }
      let p;
      (f.publicKey = h), (f.signal = s.createNewAbortSignal());
      try {
        p = await navigator.credentials.get(f);
      } catch (e) {
        throw (function ({ error: e, options: t }) {
          const { publicKey: r } = t;
          if (!r) throw Error('options was missing required publicKey property');
          if ('AbortError' === e.name) {
            if (t.signal instanceof AbortSignal)
              return new a({ message: 'Authentication ceremony was sent an abort signal', code: 'ERROR_CEREMONY_ABORTED', cause: e });
          } else {
            if ('NotAllowedError' === e.name) return new a({ message: e.message, code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY', cause: e });
            if ('SecurityError' === e.name) {
              const t = window.location.hostname;
              if (!i(t))
                return new a({ message: `${window.location.hostname} is an invalid domain`, code: 'ERROR_INVALID_DOMAIN', cause: e });
              if (r.rpId !== t)
                return new a({ message: `The RP ID "${r.rpId}" is invalid for this domain`, code: 'ERROR_INVALID_RP_ID', cause: e });
            } else if ('UnknownError' === e.name)
              return new a({
                message: 'The authenticator was unable to process the specified options, or could not create a new assertion signature',
                code: 'ERROR_AUTHENTICATOR_GENERAL_ERROR',
                cause: e,
              });
          }
          return e;
        })({ error: e, options: f });
      }
      if (!p) throw new Error('Authentication was not completed');
      const { id: R, rawId: w, response: E, type: g } = p;
      let A;
      return (
        E.userHandle && (A = t(E.userHandle)),
        {
          id: R,
          rawId: t(w),
          response: {
            authenticatorData: t(E.authenticatorData),
            clientDataJSON: t(E.clientDataJSON),
            signature: t(E.signature),
            userHandle: A,
          },
          type: g,
          clientExtensionResults: p.getClientExtensionResults(),
          authenticatorAttachment: l(p.authenticatorAttachment),
        }
      );
    }),
    (e.startRegistration = async function (e) {
      if (!n()) throw new Error('WebAuthn is not supported in this browser');
      const c = {
        publicKey: {
          ...e,
          challenge: r(e.challenge),
          user: { ...e.user, id: r(e.user.id) },
          excludeCredentials: e.excludeCredentials?.map(o),
        },
      };
      let d;
      c.signal = s.createNewAbortSignal();
      try {
        d = await navigator.credentials.create(c);
      } catch (e) {
        throw (function ({ error: e, options: t }) {
          const { publicKey: r } = t;
          if (!r) throw Error('options was missing required publicKey property');
          if ('AbortError' === e.name) {
            if (t.signal instanceof AbortSignal)
              return new a({ message: 'Registration ceremony was sent an abort signal', code: 'ERROR_CEREMONY_ABORTED', cause: e });
          } else if ('ConstraintError' === e.name) {
            if (!0 === r.authenticatorSelection?.requireResidentKey)
              return new a({
                message: 'Discoverable credentials were required but no available authenticator supported it',
                code: 'ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT',
                cause: e,
              });
            if ('required' === r.authenticatorSelection?.userVerification)
              return new a({
                message: 'User verification was required but no available authenticator supported it',
                code: 'ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT',
                cause: e,
              });
          } else {
            if ('InvalidStateError' === e.name)
              return new a({
                message: 'The authenticator was previously registered',
                code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED',
                cause: e,
              });
            if ('NotAllowedError' === e.name) return new a({ message: e.message, code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY', cause: e });
            if ('NotSupportedError' === e.name)
              return 0 === r.pubKeyCredParams.filter((e) => 'public-key' === e.type).length
                ? new a({
                    message: 'No entry in pubKeyCredParams was of type "public-key"',
                    code: 'ERROR_MALFORMED_PUBKEYCREDPARAMS',
                    cause: e,
                  })
                : new a({
                    message: 'No available authenticator supported any of the specified pubKeyCredParams algorithms',
                    code: 'ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG',
                    cause: e,
                  });
            if ('SecurityError' === e.name) {
              const t = window.location.hostname;
              if (!i(t))
                return new a({ message: `${window.location.hostname} is an invalid domain`, code: 'ERROR_INVALID_DOMAIN', cause: e });
              if (r.rp.id !== t)
                return new a({ message: `The RP ID "${r.rp.id}" is invalid for this domain`, code: 'ERROR_INVALID_RP_ID', cause: e });
            } else if ('TypeError' === e.name) {
              if (r.user.id.byteLength < 1 || r.user.id.byteLength > 64)
                return new a({ message: 'User ID was not between 1 and 64 characters', code: 'ERROR_INVALID_USER_ID_LENGTH', cause: e });
            } else if ('UnknownError' === e.name)
              return new a({
                message: 'The authenticator was unable to process the specified options, or could not create a new credential',
                code: 'ERROR_AUTHENTICATOR_GENERAL_ERROR',
                cause: e,
              });
          }
          return e;
        })({ error: e, options: c });
      }
      if (!d) throw new Error('Registration was not completed');
      const { id: h, rawId: f, response: p, type: R } = d;
      let w, E, g, A;
      if (('function' == typeof p.getTransports && (w = p.getTransports()), 'function' == typeof p.getPublicKeyAlgorithm))
        try {
          E = p.getPublicKeyAlgorithm();
        } catch (e) {
          u('getPublicKeyAlgorithm()', e);
        }
      if ('function' == typeof p.getPublicKey)
        try {
          const e = p.getPublicKey();
          null !== e && (g = t(e));
        } catch (e) {
          u('getPublicKey()', e);
        }
      if ('function' == typeof p.getAuthenticatorData)
        try {
          A = t(p.getAuthenticatorData());
        } catch (e) {
          u('getAuthenticatorData()', e);
        }
      return {
        id: h,
        rawId: t(f),
        response: {
          attestationObject: t(p.attestationObject),
          clientDataJSON: t(p.clientDataJSON),
          transports: w,
          publicKeyAlgorithm: E,
          publicKey: g,
          authenticatorData: A,
        },
        type: R,
        clientExtensionResults: d.getClientExtensionResults(),
        authenticatorAttachment: l(d.authenticatorAttachment),
      };
    }),
    Object.defineProperty(e, '__esModule', { value: !0 });
});
