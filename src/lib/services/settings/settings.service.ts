import type { SupabaseClient } from "@/db/supabase.client";
import type { UserSettings } from "@/types";
import { SettingsDatabaseError } from "./settings.errors";

export class SettingsService {
  constructor(private readonly supabase: SupabaseClient) {}

  async getUserSettings(): Promise<UserSettings> {
    const { data, error } = await this.supabase.rpc("get_user_settings");

    if (error) {
      console.error("Database error in getUserSettings:", error);
      throw new SettingsDatabaseError(error);
    }

    const settings = data?.[0];
    return {
      pointsEnabled: settings?.points_enabled ?? true,
      contextEnabled: settings?.context_enabled ?? true,
    };
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const { data, error } = await this.supabase.rpc("upsert_user_settings", {
      p_points_enabled: settings.pointsEnabled,
      p_context_enabled: settings.contextEnabled,
    });

    if (error) {
      console.error("Database error in updateSettings:", error);
      throw new SettingsDatabaseError(error);
    }

    const updated = data?.[0];
    return {
      pointsEnabled: updated?.points_enabled ?? true,
      contextEnabled: updated?.context_enabled ?? true,
    };
  }
}
