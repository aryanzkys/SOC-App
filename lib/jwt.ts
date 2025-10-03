import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

const JWT_SECRET_KEY: jwt.Secret = JWT_SECRET;

export type SessionPayload = {
  sub: string;
  nisn: string;
  is_admin: boolean;
  iat?: number;
  exp?: number;
};

const SESSION_EXPIRY_SECONDS = 60 * 60 * 8; // 8 hours

export function signSession(payload: Omit<SessionPayload, "iat" | "exp">) {
  return jwt.sign(payload, JWT_SECRET_KEY, {
    algorithm: "HS256",
    expiresIn: SESSION_EXPIRY_SECONDS,
  });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, JWT_SECRET_KEY) as SessionPayload;
}

export const sessionExpirySeconds = SESSION_EXPIRY_SECONDS;
