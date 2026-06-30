import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./index";
import { SettingsDatabaseError } from "@/lib/services/settings";

const mockGetUserSettings = vi.fn();
const mockUpdateSettings = vi.fn();

vi.mock("@/lib/services/settings", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/services/settings")>();
  return {
    ...original,
    SettingsService: vi.fn().mockImplementation(() => ({
      getUserSettings: mockGetUserSettings,
      updateSettings: mockUpdateSettings,
    })),
  };
});

interface MockAPIContext {
  request: Request;
  locals: {
    user: { id: string; email: string } | null;
    supabase: object;
  };
}

function createGetRequest(): Request {
  return new Request("http://localhost:3000/api/settings", {
    method: "GET",
  });
}

function createMockRequest(body: object): Request {
  return new Request("http://localhost:3000/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createRawRequest(body: string): Request {
  return new Request("http://localhost:3000/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

function createMockContext(request: Request, overrides?: Partial<MockAPIContext["locals"]>): MockAPIContext {
  return {
    request,
    locals: {
      user: null,
      supabase: {},
      ...overrides,
    },
  };
}

describe("Settings API", () => {
  const mockUser = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserSettings.mockResolvedValue({ pointsEnabled: true, contextEnabled: true });
    mockUpdateSettings.mockResolvedValue({ pointsEnabled: true, contextEnabled: true });
  });

  describe("GET /api/settings", () => {
    it("should return 401 when user is not authenticated", async () => {
      const context = createMockContext(createGetRequest(), { user: null, supabase: {} });

      const response = await GET(context as Parameters<typeof GET>[0]);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error_code).toBe("authentication_error_unauthorized");
    });

    it("should return settings for authenticated user", async () => {
      const context = createMockContext(createGetRequest(), { user: mockUser, supabase: {} });
      mockGetUserSettings.mockResolvedValue({ pointsEnabled: false, contextEnabled: true });

      const response = await GET(context as Parameters<typeof GET>[0]);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ pointsEnabled: false, contextEnabled: true });
    });

    it("should return JSON content type", async () => {
      const context = createMockContext(createGetRequest(), { user: mockUser, supabase: {} });

      const response = await GET(context as Parameters<typeof GET>[0]);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return 500 on SettingsDatabaseError", async () => {
      const context = createMockContext(createGetRequest(), { user: mockUser, supabase: {} });
      mockGetUserSettings.mockRejectedValue(new SettingsDatabaseError(new Error("DB error")));

      const response = await GET(context as Parameters<typeof GET>[0]);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe("database_error");
    });

    it("should return 500 on unexpected error", async () => {
      const context = createMockContext(createGetRequest(), { user: mockUser, supabase: {} });
      mockGetUserSettings.mockRejectedValue(new Error("Unexpected error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await GET(context as Parameters<typeof GET>[0]);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe("unknown_error");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("PATCH /api/settings", () => {
    it("should return 401 when user is not authenticated", async () => {
      const request = createMockRequest({ pointsEnabled: true });
      const context = createMockContext(request, { user: null, supabase: {} });

      const response = await PATCH(context as Parameters<typeof PATCH>[0]);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error_code).toBe("authentication_error_unauthorized");
    });

    it("should return 400 when request body is empty", async () => {
      const request = createMockRequest({});
      const context = createMockContext(request, { user: mockUser, supabase: {} });

      const response = await PATCH(context as Parameters<typeof PATCH>[0]);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error_code).toBe("validation_error_settings_empty");
    });

    it("should return 400 when request body is invalid", async () => {
      const request = createMockRequest({ pointsEnabled: "yes" });
      const context = createMockContext(request, { user: mockUser, supabase: {} });

      const response = await PATCH(context as Parameters<typeof PATCH>[0]);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error_code).toBe("Expected boolean, received string");
    });

    it("should return 200 and updated settings on success", async () => {
      const request = createMockRequest({ pointsEnabled: false });
      const context = createMockContext(request, { user: mockUser, supabase: {} });
      mockUpdateSettings.mockResolvedValue({ pointsEnabled: false, contextEnabled: true });

      const response = await PATCH(context as Parameters<typeof PATCH>[0]);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ pointsEnabled: false, contextEnabled: true });
      expect(mockUpdateSettings).toHaveBeenCalledWith({ pointsEnabled: false });
    });

    it("should return JSON content type", async () => {
      const request = createMockRequest({ pointsEnabled: true });
      const context = createMockContext(request, { user: mockUser, supabase: {} });

      const response = await PATCH(context as Parameters<typeof PATCH>[0]);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should return 500 on SettingsDatabaseError", async () => {
      const request = createMockRequest({ pointsEnabled: true });
      const context = createMockContext(request, { user: mockUser, supabase: {} });
      mockUpdateSettings.mockRejectedValue(new SettingsDatabaseError(new Error("DB error")));

      const response = await PATCH(context as Parameters<typeof PATCH>[0]);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe("database_error");
    });

    it("should return 500 on unexpected error", async () => {
      const request = createMockRequest({ contextEnabled: true });
      const context = createMockContext(request, { user: mockUser, supabase: {} });
      mockUpdateSettings.mockRejectedValue(new Error("Unexpected error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await PATCH(context as Parameters<typeof PATCH>[0]);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe("unknown_error");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should return 500 on invalid JSON request body", async () => {
      const request = createRawRequest("{ invalid json }");
      const context = createMockContext(request, { user: mockUser, supabase: {} });

      const response = await PATCH(context as Parameters<typeof PATCH>[0]);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error_code).toBe("unknown_error");
    });
  });
});
