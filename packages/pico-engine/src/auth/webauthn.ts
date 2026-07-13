import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";

/**
 * A stored credential's crypto material, as understood by the WebAuthn library.
 * `publicKey` is the raw COSE key bytes.
 */
export interface WebAuthnCredentialKey {
  id: string;
  publicKey: Uint8Array;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
}

export interface VerifiedRegistration {
  verified: boolean;
  credential?: WebAuthnCredentialKey;
}

export interface VerifiedAuthentication {
  verified: boolean;
  newCounter: number;
}

/**
 * Thin, injectable wrapper around `@simplewebauthn/server`.
 *
 * The engine treats WebAuthn purely as a ceremony/verification library — the
 * challenge/credential/session stores are engine primitives (see AuthService).
 * This interface is also the seam that lets tests supply a deterministic
 * authenticator without a real device.
 */
export interface ExcludeCredentialDescriptor {
  id: string;
  transports?: AuthenticatorTransportFuture[];
}

export interface WebAuthnAdapter {
  generateRegistrationOptions(req: {
    rpID: string;
    rpName: string;
    userID: Uint8Array;
    userName: string;
    userDisplayName: string;
    excludeCredentials?: ExcludeCredentialDescriptor[];
    /** When true, relax resident-key requirements so another authenticator can enroll. */
    additionalPasskey?: boolean;
  }): Promise<PublicKeyCredentialCreationOptionsJSON>;

  verifyRegistration(req: {
    response: RegistrationResponseJSON;
    expectedChallenge: string;
    expectedOrigin: string;
    expectedRPID: string;
  }): Promise<VerifiedRegistration>;

  generateAuthenticationOptions(req: {
    rpID: string;
  }): Promise<PublicKeyCredentialRequestOptionsJSON>;

  verifyAuthentication(req: {
    response: AuthenticationResponseJSON;
    expectedChallenge: string;
    expectedOrigin: string;
    expectedRPID: string;
    credential: WebAuthnCredentialKey;
  }): Promise<VerifiedAuthentication>;
}

export function makeWebAuthnAdapter(): WebAuthnAdapter {
  return {
    async generateRegistrationOptions(req) {
      const excludeCredentials = (req.excludeCredentials || []).map((cred) => {
        const id = trimBase64URLPadding(cred.id);
        const transports = (cred.transports || []).filter(Boolean);
        return transports.length > 0 ? { id, transports } : { id };
      });

      return generateRegistrationOptions({
        rpName: req.rpName,
        rpID: req.rpID,
        userID: req.userID as any,
        userName: req.userName,
        userDisplayName: req.userDisplayName,
        attestationType: "none",
        excludeCredentials,
        authenticatorSelection: req.additionalPasskey
          ? {
              residentKey: "preferred",
              userVerification: "preferred",
            }
          : {
              residentKey: "required",
              userVerification: "preferred",
            },
      });
    },

    async verifyRegistration(req) {
      const verification = await verifyRegistrationResponse({
        response: req.response,
        expectedChallenge: req.expectedChallenge,
        expectedOrigin: req.expectedOrigin,
        expectedRPID: req.expectedRPID,
        requireUserVerification: false,
      });
      if (!verification.verified || !verification.registrationInfo) {
        return { verified: false };
      }
      const cred = verification.registrationInfo.credential;
      return {
        verified: true,
        credential: {
          id: cred.id,
          publicKey: cred.publicKey,
          counter: cred.counter,
          transports: mergeTransports(cred.transports, req.response),
        },
      };
    },

    async generateAuthenticationOptions(req) {
      return generateAuthenticationOptions({
        rpID: req.rpID,
        userVerification: "preferred",
      });
    },

    async verifyAuthentication(req) {
      const verification = await verifyAuthenticationResponse({
        response: req.response,
        expectedChallenge: req.expectedChallenge,
        expectedOrigin: req.expectedOrigin,
        expectedRPID: req.expectedRPID,
        credential: {
          id: req.credential.id,
          publicKey: req.credential.publicKey as any,
          counter: req.credential.counter,
          transports: req.credential.transports,
        },
        requireUserVerification: false,
      });
      return {
        verified: verification.verified,
        newCounter:
          verification.authenticationInfo?.newCounter ?? req.credential.counter,
      };
    },
  };
}

function trimBase64URLPadding(id: string): string {
  return id.replace(/=+$/g, "");
}

function mergeTransports(
  fromAttestation: AuthenticatorTransportFuture[] | undefined,
  response: RegistrationResponseJSON
): AuthenticatorTransportFuture[] {
  const merged = [...(fromAttestation || [])].filter(Boolean);
  if (merged.length > 0) {
    return merged;
  }
  if (response.authenticatorAttachment === "platform") {
    return ["internal"];
  }
  if (response.authenticatorAttachment === "cross-platform") {
    return ["usb", "ble", "nfc"];
  }
  return [];
}
