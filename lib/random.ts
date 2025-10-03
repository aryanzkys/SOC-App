import { randomBytes } from "crypto";

const DEFAULT_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generateToken(length = 16, alphabet = DEFAULT_ALPHABET) {
  if (length <= 0) {
    throw new Error("Token length must be positive");
  }
  const bytes = randomBytes(length);
  const chars: string[] = [];
  const alphabetLength = alphabet.length;

  for (let i = 0; i < length; i += 1) {
    const index = bytes[i] % alphabetLength;
    chars.push(alphabet[index]);
  }

  return chars.join("");
}
