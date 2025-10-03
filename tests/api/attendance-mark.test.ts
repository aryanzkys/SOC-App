import { NextRequest } from "next/server";

import { POST as markAttendance } from "@/app/api/attendance/mark/route";
import { requireSession } from "@/lib/auth";
import { getJakartaDateInfo } from "@/lib/attendance";
import { supabaseServerClient } from "@/lib/supabase";

jest.mock("@/lib/auth", () => ({
  requireSession: jest.fn(),
}));

jest.mock("@/lib/attendance", () => ({
  getJakartaDateInfo: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  supabaseServerClient: {
    from: jest.fn(),
  },
}));

describe("POST /api/attendance/mark", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a new attendance entry when conditions are met", async () => {
    const mockedRequireSession = jest.mocked(requireSession);
    const mockedGetDateInfo = jest.mocked(getJakartaDateInfo);
    const mockedFrom = supabaseServerClient.from as jest.Mock;
    const session = { sub: "user-123", nisn: "99887766", is_admin: false };

    mockedRequireSession.mockReturnValue({ session, response: null });
    mockedGetDateInfo.mockReturnValue({
      isoDate: "2025-01-04",
      isSaturday: true,
      weekday: "Sabtu",
      readableDate: "Sabtu, 4 Januari 2025",
    });

    const validationQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
    };

    const insertChain = {
      select: jest.fn(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: "record-123",
          date: "2025-01-04",
          status: "Hadir",
          created_at: new Date().toISOString(),
        },
        error: null,
      }),
    };
    insertChain.select.mockReturnValue(insertChain);

    const insertQuery = {
      insert: jest.fn().mockReturnValue(insertChain),
    };

    mockedFrom.mockImplementationOnce(() => validationQuery).mockImplementationOnce(() => insertQuery);

    const request = new NextRequest(new Request("http://localhost/api/attendance/mark", {
      method: "POST",
      headers: { "content-type": "application/json" },
    }));

    const response = await markAttendance(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.record).toMatchObject({ id: "record-123", status: "Hadir" });
    expect(validationQuery.select).toHaveBeenCalled();
    expect(insertQuery.insert).toHaveBeenCalledWith({
      user_id: "user-123",
      nisn: "99887766",
      date: "2025-01-04",
      status: "Hadir",
    });
  });
});
