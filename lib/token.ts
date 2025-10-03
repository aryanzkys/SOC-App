import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashToken(rawToken: string) {
  return bcrypt.hash(rawToken, SALT_ROUNDS);
}

export async function verifyToken(rawToken: string, tokenHash: string) {
  return bcrypt.compare(rawToken, tokenHash);
}
