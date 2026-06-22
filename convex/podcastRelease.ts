/**
 * PODCAST RELEASE (CastForm) — LEGAL ARTIFACT MODULE
 *
 * LEGAL CRITICALITY: MAXIMUM
 *
 * The release version and release text are defined TOGETHER in this file so
 * they can never drift apart. The server hashes its own copy of this text —
 * never text supplied by the client — when computing acceptance checksums.
 *
 * Bumping the text REQUIRES bumping PODCAST_RELEASE_VERSION. Existing
 * signature rows remain valid evidence for the version they reference
 * because each row stores both the version and the SHA-256 of the exact
 * text that was in force at signing time.
 */

import { escapeHtml, ValidationError } from "./security";

// ==================== VERSION + TEXT (authoritative pair) ====================

export const PODCAST_RELEASE_VERSION = "podcast_release_v1.0.1";

export const DEFAULT_CONFIRMATION_PHRASE = "I AGREE";

// Every signed release confirmation is also bcc'd here so the podcast team
// has a copy of every signature as it's sent.
export const PODCAST_RELEASE_BCC = "phreshteampodcast@gmail.com";

export const PODCAST_RELEASE_TEXT = `PODCAST APPEARANCE, LIKENESS, AND MATERIALS RELEASE
Version: ${PODCAST_RELEASE_VERSION}

PLEASE READ THIS RELEASE CAREFULLY BEFORE SIGNING. BY SUBMITTING THIS FORM
YOU ARE ELECTRONICALLY SIGNING A LEGALLY BINDING AGREEMENT.

1. GRANT OF RIGHTS. In consideration of the opportunity to appear in, be
featured in, or contribute to podcast episodes, videos, livestreams, and
related content produced by or on behalf of PhreshTeam ("the Platform"),
you irrevocably grant the Platform and its successors, licensees, and
assigns the right to record, photograph, film, and otherwise capture your
name, voice, image, likeness, performance, statements, biographical
information, social media handles, and any materials you submit
(collectively, "Your Materials").

2. USE AND DISTRIBUTION. The Platform may edit, adapt, modify, reproduce,
publish, distribute, publicly display, publicly perform, and otherwise use
Your Materials, in whole or in part, in any media now known or later
developed, worldwide, in perpetuity, for purposes including podcast
episodes, promotional content, advertising, and archival use. The Platform
has no obligation to use Your Materials.

3. NO COMPENSATION. Unless otherwise agreed in a separate signed writing,
you acknowledge that you will receive no royalties, residuals, or other
compensation for the use of Your Materials, and that the opportunity to
appear is adequate consideration for this release.

4. WAIVER OF APPROVAL. You waive any right to inspect or approve the
finished content, any editing decisions, or any promotional materials that
incorporate Your Materials.

5. REPRESENTATIONS. You represent that you are at least 18 years of age
(or have the consent of a parent or legal guardian), that you have the
full right to grant the rights above, and that Your Materials do not
infringe the rights of any third party.

6. RELEASE OF CLAIMS. To the fullest extent permitted by law, you release
and discharge the Platform from any claims arising out of the use of Your
Materials as authorized here, including claims for defamation, invasion of
privacy, violation of rights of publicity or personality, and copyright or
trademark infringement.

7. REVOCATION. This release is irrevocable with respect to content
produced or distributed before any written revocation is received. Any
revocation applies prospectively only and must be sent to
legal@phreshteam.tv.

8. DATA HANDLING. The signature record created when you submit this form
(including the timestamp, your account identifiers, your IP address, and
your browser user agent) is retained as legal evidence of consent in
accordance with the Platform's Privacy Policy.

9. GOVERNING LAW. This release is governed by the same governing law and
dispute resolution provisions as the Platform's Terms of Service.

10. ENTIRE AGREEMENT. This release is the entire agreement between you
and the Platform regarding the use of Your Materials and supersedes any
prior understandings on that subject.

BY CHECKING THE REQUIRED BOXES AND SUBMITTING THIS FORM, YOU ACKNOWLEDGE
THAT YOU HAVE READ AND UNDERSTOOD THIS RELEASE AND AGREE TO BE BOUND BY IT.`;

// ==================== DRAWN SIGNATURE IMAGE VALIDATION ====================

// A handwritten signature off a small canvas is at most a few tens of KB as
// a PNG; cap well above that to allow for HiDPI canvases while still
// rejecting abusive payloads.
const SIGNATURE_IMAGE_MAX_LENGTH = 400_000; // ~300KB decoded
const SIGNATURE_IMAGE_PATTERN = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/;

/**
 * Validates the base64 PNG data URL captured from the signature canvas.
 * Only required when the signer chose the "drawn" method.
 */
export function validateSignatureImage(image: string): string {
  if (image.length === 0 || image.length > SIGNATURE_IMAGE_MAX_LENGTH) {
    throw new ValidationError(
      "signatureImage",
      "Signature image is missing or too large",
      "INVALID"
    );
  }
  if (!SIGNATURE_IMAGE_PATTERN.test(image)) {
    throw new ValidationError(
      "signatureImage",
      "Signature image must be a PNG data URL",
      "INVALID"
    );
  }
  return image;
}

// ==================== DETERMINISTIC CANONICALIZATION ====================

/**
 * Deterministic JSON serialization: recursively sorts object keys and drops
 * undefined values, so the same logical payload always hashes identically.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map((item) => canonicalize(item)).join(",") + "]";
  }
  const record = value as Record<string, unknown>;
  const parts = Object.keys(record)
    .sort()
    .filter((key) => record[key] !== undefined)
    .map((key) => JSON.stringify(key) + ":" + canonicalize(record[key]));
  return "{" + parts.join(",") + "}";
}

// ==================== SHA-256 (pure TS, deterministic) ====================
// Implemented locally so checksums can be computed inside Convex mutations
// (deterministic runtime, no async crypto, no external dependency).

const SHA256_H = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

export function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const byteLength = bytes.length;
  const bitLengthHi = Math.floor((byteLength * 8) / 0x100000000);
  const bitLengthLo = (byteLength * 8) >>> 0;

  // Pad to a multiple of 64 bytes: 0x80 marker + zeros + 64-bit big-endian length
  const paddedLength = (((byteLength + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[byteLength] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, bitLengthHi);
  view.setUint32(paddedLength - 4, bitLengthLo);

  const h = [...SHA256_H];
  const w = new Array<number>(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let t = 0; t < 16; t++) {
      w[t] = view.getUint32(offset + t * 4);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + S1 + ch + SHA256_K[t] + w[t]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h[0] = (h[0] + a) >>> 0;
    h[1] = (h[1] + b) >>> 0;
    h[2] = (h[2] + c) >>> 0;
    h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0;
    h[5] = (h[5] + f) >>> 0;
    h[6] = (h[6] + g) >>> 0;
    h[7] = (h[7] + hh) >>> 0;
  }

  return h.map((word) => word.toString(16).padStart(8, "0")).join("");
}

// ==================== ACCEPTANCE CHECKSUM ====================

export interface AcceptanceChecksumInput {
  releaseVersion: string;
  releaseTextChecksum: string;
  userId: string;
  clerkId: string;
  acceptedAt: number;
  signatureName: string; // full legal name — binds signer identity into the hash
  consentFields: {
    likenessConsent: boolean;
    recordingConsent: boolean;
    distributionConsent: boolean;
    signatureName: string;
    signatureMethod: "drawn" | "typed";
    // Base64 PNG of the handwritten signature; present only when drawn.
    signatureImage?: string;
    typedConfirmation?: string;
  };
}

/**
 * Cryptographic proof binding WHO accepted WHAT and WHEN.
 * Any later tampering with the stored row is detectable by recomputing this.
 */
export function computeAcceptanceChecksum(
  input: AcceptanceChecksumInput
): string {
  return sha256Hex(canonicalize(input));
}

// ==================== CONFIRMATION EMAIL (Resend) ====================

export interface ReleaseEmailParams {
  username: string;
  releaseVersion: string;
  acceptedAtIso: string;
  signatureReference: string;
  acceptanceChecksum: string;
  releaseText: string;
  signatureName: string;
  signatureMethod: "drawn" | "typed";
  signatureImage?: string;
}

export function buildReleaseEmailSubject(releaseVersion: string): string {
  return `Your signed podcast release (${releaseVersion}) — PhreshTeam`;
}

export function buildReleaseEmailHtml(params: ReleaseEmailParams): string {
  const {
    username,
    releaseVersion,
    acceptedAtIso,
    signatureReference,
    acceptanceChecksum,
    releaseText,
    signatureName,
    signatureMethod,
    signatureImage,
  } = params;

  return `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; background: #0b0b12; color: #e8e8f0; padding: 24px;">
    <div style="max-width: 640px; margin: 0 auto; background: #14141f; border: 1px solid #2a2a3d; border-radius: 12px; padding: 32px;">
      <h1 style="color: #7c5cff; font-size: 20px; margin-top: 0;">Podcast Release Received</h1>
      <p>Hi ${escapeHtml(username)},</p>
      <p>
        This confirms that we received your electronically signed
        <strong>Podcast Appearance, Likeness, and Materials Release</strong>.
        A full copy of the release you agreed to is included below for your records.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #9a9ab0;">Signed by</td>
          <td style="padding: 6px 0; font-weight: bold;">${escapeHtml(signatureName)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9a9ab0;">Signature method</td>
          <td style="padding: 6px 0;">${signatureMethod === "drawn" ? "Handwritten (canvas)" : "Typed"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9a9ab0;">Release version</td>
          <td style="padding: 6px 0;">${escapeHtml(releaseVersion)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9a9ab0;">Signed at (UTC)</td>
          <td style="padding: 6px 0;">${escapeHtml(acceptedAtIso)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9a9ab0;">Signature reference</td>
          <td style="padding: 6px 0; font-family: monospace;">${escapeHtml(signatureReference)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9a9ab0;">Acceptance checksum</td>
          <td style="padding: 6px 0; font-family: monospace; word-break: break-all;">${escapeHtml(acceptanceChecksum)}</td>
        </tr>
      </table>

      <!-- Visual signature block (analogous to a DocuSign signature line) -->
      <div style="border: 1px solid #3a3a5e; border-radius: 8px; padding: 20px 24px; margin: 24px 0; background: #0f0f18;">
        <p style="margin: 0 0 4px 0; font-size: 11px; color: #9a9ab0; text-transform: uppercase; letter-spacing: 0.08em;">Electronic Signature</p>
        ${
          signatureMethod === "drawn" && signatureImage
            ? `<img src="${signatureImage}" alt="Signature of ${escapeHtml(signatureName)}" style="max-width: 320px; max-height: 100px; display: block;" />`
            : `<p style="margin: 0; font-family: 'Brush Script MT', 'Segoe Script', 'Helvetica Neue', cursive; font-size: 36px; color: #c8c8ff; letter-spacing: 0.02em;">${escapeHtml(signatureName)}</p>`
        }
        <hr style="border: none; border-top: 1px solid #3a3a5e; margin: 12px 0 8px;" />
        <p style="margin: 0; font-size: 11px; color: #9a9ab0;">${escapeHtml(signatureName)} &nbsp;·&nbsp; ${escapeHtml(acceptedAtIso)} UTC</p>
      </div>

      <p style="font-size: 13px; color: #9a9ab0;">
        Keep this email for your records. If you did not submit this form,
        contact <a href="mailto:legal@phreshteam.tv" style="color: #7c5cff;">legal@phreshteam.tv</a> immediately.
      </p>
      <hr style="border: none; border-top: 1px solid #2a2a3d; margin: 24px 0;" />
      <h2 style="font-size: 14px; color: #e8e8f0;">Copy of the release you signed</h2>
      <pre style="white-space: pre-wrap; font-family: Georgia, serif; font-size: 12px; line-height: 1.6; color: #c8c8d8; background: #0f0f18; border: 1px solid #2a2a3d; border-radius: 8px; padding: 16px;">${escapeHtml(releaseText)}</pre>
    </div>
  </body>
</html>`;
}
