import { NextRequest } from "next/server";

import { POST as loginHandler } from "@/app/api/auth/login/route";
import { createSessionResponse } from "@/lib/auth";
import { isRateLimited, registerFailedAttempt, resetRateLimit } from "@/lib/rate-limit";
import { supabaseServerClient } from "@/lib/supabase";
import { verifyToken } from "@/lib/token";

jest.mock("@/lib/rate-limit", () => ({
  isRateLimited: jest.fn(),
  registerFailedAttempt: jest.fn(),
  resetRateLimit: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  supabaseServerClient: {
    from: jest.fn(),
  },
}));

jest.mock("@/lib/token", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  createSessionResponse: jest.fn(({ response }: { response: Response }) => response),
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("authenticates a user and returns session payload", async () => {
    const mockedFrom = supabaseServerClient.from as jest.Mock;
    const mockedIsRateLimited = jest.mocked(isRateLimited);
    const mockedResetRateLimit = jest.mocked(resetRateLimit);
    const mockedRegisterFailedAttempt = jest.mocked(registerFailedAttempt);
    const mockedVerifyToken = jest.mocked(verifyToken);
    const mockedCreateSessionResponse = jest.mocked(createSessionResponse);

    const queryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: "user-123",
          nisn: "99887766",
          token_hash: "hashed-token",
          name: "Arya",
          is_admin: false,
        },
        error: null,
      }),
    };

    mockedFrom.mockReturnValue(queryChain);
  mockedIsRateLimited.mockResolvedValue({ blocked: false, identifier: "unknown" });
    mockedVerifyToken.mockResolvedValue(true);
  mockedResetRateLimit.mockResolvedValue(undefined);
  mockedCreateSessionResponse.mockImplementation(({ response }) => response);

    const payload = { nisn: "99887766", token: "verysecure" };
    const request = new NextRequest(new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
    }));

    const response = await loginHandler(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.user).toMatchObject({ id: "user-123", nisn: "99887766" });
    expect(mockedResetRateLimit).toHaveBeenCalledWith("unknown");
    expect(mockedVerifyToken).toHaveBeenCalledWith("verysecure", "hashed-token");
    expect(mockedRegisterFailedAttempt).not.toHaveBeenCalled();
    expect(mockedCreateSessionResponse).toHaveBeenCalled();
  });
});
