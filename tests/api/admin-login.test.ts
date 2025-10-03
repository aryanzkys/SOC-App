import { NextRequest } from "next/server";

import { POST as adminLoginHandler } from "@/app/api/admin/login/route";
import { createSessionResponse } from "@/lib/auth";
import { isRateLimited, registerFailedAttempt, resetRateLimit } from "@/lib/rate-limit";
import { supabaseServerClient } from "@/lib/supabase";
import { verifyToken } from "@/lib/token";

jest.mock("@/lib/auth", () => ({
  createSessionResponse: jest.fn(({ response }: { response: Response }) => response),
}));

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

describe("POST /api/admin/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("authenticates admin credentials and creates session", async () => {
    const mockedIsRateLimited = jest.mocked(isRateLimited);
    const mockedResetRateLimit = jest.mocked(resetRateLimit);
    const mockedRegisterFailedAttempt = jest.mocked(registerFailedAttempt);
    const mockedVerifyToken = jest.mocked(verifyToken);
    const mockedCreateSessionResponse = jest.mocked(createSessionResponse);
    const mockedFrom = supabaseServerClient.from as jest.Mock;

    mockedIsRateLimited.mockResolvedValue({ blocked: false, identifier: "hash" });

    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: "admin-id",
          nisn: "admin12345",
          token_hash: "hashed-secret",
          name: "Administrator",
          is_admin: true,
        },
        error: null,
      }),
    };

    mockedFrom.mockReturnValue(selectChain);
    mockedVerifyToken.mockResolvedValue(true);
    mockedResetRateLimit.mockResolvedValue(undefined);

    const request = new NextRequest(
      new Request("http://localhost/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ adminId: "admin12345", password: "87654321" }),
        headers: { "content-type": "application/json" },
      })
    );

    const response = await adminLoginHandler(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.user).toMatchObject({ adminId: "admin12345", is_admin: true });
  expect(mockedResetRateLimit).toHaveBeenCalledWith("unknown");
    expect(mockedRegisterFailedAttempt).not.toHaveBeenCalled();
    expect(mockedVerifyToken).toHaveBeenCalledWith("87654321", "hashed-secret");
    expect(mockedCreateSessionResponse).toHaveBeenCalled();
  });
});
