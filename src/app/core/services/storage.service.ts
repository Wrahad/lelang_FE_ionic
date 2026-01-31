import { Injectable } from "@angular/core";
import { Preferences } from "@capacitor/preferences";
import { User } from "src/app/models/user.model";
import { environment } from "src/environments/environment.prod";

interface StoredData<T> {
  version : number;
  data: T;
  timestamp: string;
}
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly keys = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
  } as const;

  private readonly CURRENT_VERSION = 1;

  constructor() {
    if (environment.features?.enableLogging) {
      console.log('✅ StorageService initialized');
    }
  }

  async setToken(token: string): Promise<boolean> {
    try {
      await Preferences.set({
        key: this.keys.AUTH_TOKEN,
        value: token,
      });

      const { value } = await Preferences.get({ key: this.keys.AUTH_TOKEN });
      const success = value === token;

      if (!success) {
        console.error('[StorageSErvice] Token verification failed');
      }

      if (environment.features?.enableLogging) {
        console.log('[StorageService] Token saved:' , success ? 'success' : 'failed');
      }

      return success;
    } catch (error) {
      console.error('[StorageService] Failed to save token:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: this.keys.AUTH_TOKEN });
      return value;
    } catch (error) {
      console.error('[StorageService] Failed to get token:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await Preferences.remove({ key: this.keys.AUTH_TOKEN });
    } catch (error) {
      console.error('[StorageService] Failed to clear token:', error);
    }
  }

  async setUser(user: User): Promise<boolean> {
    try {
      const wrapped: StoredData<User> = {
        version: this.CURRENT_VERSION,
        data: user,
        timestamp: new Date().toISOString(),
      };

      const raw = JSON.stringify(wrapped);
      await Preferences.set({ key: this.keys.USER_DATA, value: raw });

      const { value } = await Preferences.get({ key: this.keys.USER_DATA });
      const success = value === raw;

      if (environment.features?.enableLogging) {
        console.log('[StorageService] User data saved:', success ? 'success' : 'failed');
      }

      return success;
    } catch (error) {
      console.error('[StorageService] Failed to save user data:', error);
      return false;
    }
  }

  async getUser(): Promise<User | null> {
    try {
      const { value } = await Preferences.get({ key: this.keys.USER_DATA });
      
      if (!value) {
        return null;
      }

      let stored: StoredData<User>;
      try {
        stored = JSON.parse(value) as StoredData<User>;
      } catch (parseError) {
        console.error('[StorageService] Failed to parse user data:', parseError);

        await this.clearUser();
        return null;
      }

      if (stored.version ! == this.CURRENT_VERSION) {
        const migrated = await this.migrateUserData(stored);
        if (migrated) {
          await this.setUser(migrated);
          return migrated;
        }
        return null;
      }
      return stored.data;
    } catch (error) {
      console.error('[StorageService] Failed to get user data:', error);
      return null;
    }
  }

  async clearUser(): Promise<void> {
    try {
      await Preferences.remove({ key: this.keys.USER_DATA });
    } catch (error) {
      console.error('[StorageService] Failed to clear user data:', error);
    }
  }

  async clearAllAuthData(): Promise<void> {
    try {
      await Promise.all([ this.clearToken(), this.clearUser() ]);

      if (environment.features?.enableLogging) {
        console.log('[StorageService] Cleared all auth data');
      }
    } catch (error) {
      console.error('[StorageService] Failed to clear all auth data:', error);
    }
  }

  private async migrateUserData(stored: StoredData<any>): Promise<User | null> {
    try {
      console.log(`[StorageService] Migrating user data: v${stored.version} → v${this.CURRENT_VERSION}`);

      console.warn('[StorageService] No migration logic for version', stored.version);
      return stored.data as User;
    } catch (error) {
      console.error('[StorageService] Migration failed:', error);
      return null;
    }
  }

  async getStorageInfo(): Promise<{
    keys: string[];
    tokenExists: boolean;
    userExists: boolean;
  }> {
    try {
      const { keys } = await Preferences.keys();
      const token = await this.getToken();
      const user = await this.getUser();

      return {
        keys,
        tokenExists: !!token,
        userExists: !!user,
      };
    } catch (error) {
      console.error('[StorageService] Failed to get storage info:', error);
      return {
        keys: [],
        tokenExists: false,
        userExists: false,
      }
    }
  }
  
}