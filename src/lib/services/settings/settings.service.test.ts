import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsService } from "./settings.service";
import { SettingsDatabaseError } from "./settings.errors";

describe("SettingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserSettings", () => {
    it("should call get_user_settings RPC without parameters", async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: [{ points_enabled: true, context_enabled: true }],
          error: null,
        }),
      };
      const service = new SettingsService(mockSupabase as never);

      await service.getUserSettings();

      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_user_settings");
    });

    it("should map snake_case settings to camelCase", async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: [{ points_enabled: false, context_enabled: true }],
          error: null,
        }),
      };
      const service = new SettingsService(mockSupabase as never);

      const result = await service.getUserSettings();

      expect(result).toEqual({ pointsEnabled: false, contextEnabled: true });
    });

    it("should return defaults when no settings row exists", async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const service = new SettingsService(mockSupabase as never);

      const result = await service.getUserSettings();

      expect(result).toEqual({ pointsEnabled: true, contextEnabled: true });
    });

    it("should throw SettingsDatabaseError on database error", async () => {
      const dbError = { message: "Connection failed", code: "PGRST116" };
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: null, error: dbError }),
      };
      const service = new SettingsService(mockSupabase as never);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(service.getUserSettings()).rejects.toThrow(SettingsDatabaseError);

      expect(consoleSpy).toHaveBeenCalledWith("Database error in getUserSettings:", dbError);
      consoleSpy.mockRestore();
    });
  });

  describe("updateSettings", () => {
    it("should call upsert_user_settings with correct parameters", async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: [{ points_enabled: true, context_enabled: false }],
          error: null,
        }),
      };
      const service = new SettingsService(mockSupabase as never);

      await service.updateSettings({ pointsEnabled: true, contextEnabled: false });

      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("upsert_user_settings", {
        p_points_enabled: true,
        p_context_enabled: false,
      });
    });

    it("should return updated settings", async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: [{ points_enabled: false, context_enabled: true }],
          error: null,
        }),
      };
      const service = new SettingsService(mockSupabase as never);

      const result = await service.updateSettings({ pointsEnabled: false });

      expect(result).toEqual({ pointsEnabled: false, contextEnabled: true });
    });

    it("should default missing fields to true when RPC returns nulls", async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: [{ points_enabled: null, context_enabled: null }],
          error: null,
        }),
      };
      const service = new SettingsService(mockSupabase as never);

      const result = await service.updateSettings({ pointsEnabled: false });

      expect(result).toEqual({ pointsEnabled: true, contextEnabled: true });
    });

    it("should throw SettingsDatabaseError on database error", async () => {
      const dbError = { message: "Connection failed", code: "PGRST116" };
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: null, error: dbError }),
      };
      const service = new SettingsService(mockSupabase as never);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(service.updateSettings({ pointsEnabled: true })).rejects.toThrow(SettingsDatabaseError);

      expect(consoleSpy).toHaveBeenCalledWith("Database error in updateSettings:", dbError);
      consoleSpy.mockRestore();
    });
  });
});
