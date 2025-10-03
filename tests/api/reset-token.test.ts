import { NextRequest } from "next/server";

import { PATCH as resetTokenHandler } from "@/app/api/admin/reset-token/route";
import { requireSession } from "@/lib/auth";
import { recordAuditLog, resolveAuditActor } from "@/lib/audit";
import { supabaseServerClient } from "@/lib/supabase";
import { hashToken } from "@/lib/token";

jest.mock("@/lib/auth", () => ({
  requireSession: jest.fn(),
}));

jest.mock("@/lib/audit", () => ({
  recordAuditLog: jest.fn(),
  resolveAuditActor: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  supabaseServerClient: {
    from: jest.fn(),
  },
}));

jest.mock("@/lib/token", () => ({
  hashToken: jest.fn(),
}));

describe("PATCH /api/admin/reset-token", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows admins to rotate a user token", async () => {
    const mockedRequireSession = jest.mocked(requireSession);
    const mockedResolveActor = jest.mocked(resolveAuditActor);
    const mockedRecordAudit = jest.mocked(recordAuditLog);
    const mockedHashToken = jest.mocked(hashToken);
    const mockedFrom = supabaseServerClient.from as jest.Mock;

    mockedRequireSession.mockReturnValue({
      session: { sub: "admin-1", nisn: "1234567890", is_admin: true },
      response: null,
    });

    mockedHashToken.mockResolvedValue("hashed-secret");
    mockedResolveActor.mockResolvedValue({ actorName: "Admin", actorNisn: "1234567890" });
    mockedRecordAudit.mockResolvedValue(undefined);

    const updateBuilder = {
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    const fromChain = {
      update: jest.fn().mockReturnValue(updateBuilder),
    };

    mockedFrom.mockReturnValue(fromChain);

    const request = new NextRequest(new Request("http://localhost/api/admin/reset-token", {
      method: "PATCH",
      body: JSON.stringify({ userId: "user-123", newToken: "new-secure-token" }),
      headers: { "content-type": "application/json" },
    }));

    const response = await resetTokenHandler(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe("Token reset");
    expect(mockedHashToken).toHaveBeenCalledWith("new-secure-token");
    expect(updateBuilder.eq).toHaveBeenCalledWith("id", "user-123");
    expect(mockedRecordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "token_reset",
        metadata: { userId: "user-123" },
      })
    );
  });
});
