/**
 * Generate a unique classroom code in format: GKL-XXXX
 * Uses alphanumeric chars excluding confusing ones (0/O, 1/I/l)
 */
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateClassCode() {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return `GKL-${code}`;
}

export function isValidClassCode(code) {
  return /^GKL-[A-Z0-9]{4}$/i.test(code);
}
