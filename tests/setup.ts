import { TextEncoder, TextDecoder } from "util";

// Ensure consistent timezone handling across tests
process.env.TZ = "Asia/Jakarta";

// Polyfill for environments where these globals may not exist
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
