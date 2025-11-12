import AsyncStorage from "@react-native-async-storage/async-storage";

export interface JournalEntry {
  id: number;
  userId: string;
  userEmail: string | null;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckinEntry {
  id: number;
  userId: string;
  userEmail: string | null;
  mood: number;
  notes: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

type Counters = {
  journalLastId: number;
  checkinLastId: number;
};

class AsyncDatabase {
  private initialized = false;
  private user: { id: string; email: string | null } | null = null;

  private static readonly STORAGE_PREFIX = "appv1";
  private static readonly KEYS = {
    journalEntries: "journal_entries",
    checkinEntries: "checkin_entries",
    counters: "database_counters",
  } as const;

  private static readonly LEGACY_KEYS = [
    "journal_entries",
    "checkin_entries",
    "database_counters",
    "appv1:chatSessions",
    "sync:last_sync_time",
    "sync:pending_operations",
    "sync:enabled",
  ];

  private ensureUser(): { id: string; email: string | null } {
    if (!this.user) {
      throw new Error("Database user not set");
    }
    return this.user;
  }

  private makeKey(key: (typeof AsyncDatabase.KEYS)[keyof typeof AsyncDatabase.KEYS]): string {
    const { id } = this.ensureUser();
    return `${AsyncDatabase.STORAGE_PREFIX}:${id}:${key}`;
  }

  private async ensureArrayInitialized(key: (typeof AsyncDatabase.KEYS)[keyof typeof AsyncDatabase.KEYS]) {
    const storageKey = this.makeKey(key);
    const existing = await AsyncStorage.getItem(storageKey);
    if (!existing) {
      await AsyncStorage.setItem(storageKey, JSON.stringify([]));
    }
  }

  private async removeLegacyKeys() {
    const allKeys = await AsyncStorage.getAllKeys();
    const toRemove = allKeys.filter(
      (key) =>
        AsyncDatabase.LEGACY_KEYS.includes(key) ||
        key.startsWith("appv1:messages:") ||
        key.startsWith("appv1:chat:")
    );

    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  }

  private async getCounters(): Promise<Counters> {
    const storageKey = this.makeKey(AsyncDatabase.KEYS.counters);
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw) as Counters;
    const initial: Counters = { journalLastId: 0, checkinLastId: 0 };
    await AsyncStorage.setItem(storageKey, JSON.stringify(initial));
    return initial;
  }

  private async setCounters(next: Counters): Promise<void> {
    await AsyncStorage.setItem(this.makeKey(AsyncDatabase.KEYS.counters), JSON.stringify(next));
  }

  private async getArray<T>(key: (typeof AsyncDatabase.KEYS)[keyof typeof AsyncDatabase.KEYS]): Promise<T[]> {
    const raw = await AsyncStorage.getItem(this.makeKey(key));
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  private async setArray<T>(key: (typeof AsyncDatabase.KEYS)[keyof typeof AsyncDatabase.KEYS], value: T[]): Promise<void> {
    await AsyncStorage.setItem(this.makeKey(key), JSON.stringify(value));
  }

  private filterJournalEntries(entries: JournalEntry[]): JournalEntry[] {
    const { id } = this.ensureUser();
    return entries.filter((entry) => entry.userId === id);
  }

  private filterCheckinEntries(entries: CheckinEntry[]): CheckinEntry[] {
    const { id } = this.ensureUser();
    return entries.filter((entry) => entry.userId === id);
  }

  setUser(user: { id: string; email: string | null } | null) {
    const nextId = user?.id ?? null;
    const nextEmail = user?.email ?? null;
    const currentId = this.user?.id ?? null;
    const currentEmail = this.user?.email ?? null;

    if (nextId === currentId && nextEmail === currentEmail) {
      return;
    }

    this.user = user;
    this.initialized = false;
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.ensureUser();
    await this.removeLegacyKeys();
    await this.ensureArrayInitialized(AsyncDatabase.KEYS.journalEntries);
    await this.ensureArrayInitialized(AsyncDatabase.KEYS.checkinEntries);
    await this.getCounters();

    this.initialized = true;
  }

  async createJournalEntry(
    title: string,
    content: string,
    overrideId?: number,
    metadata?: { createdAt?: string; updatedAt?: string; userEmail?: string | null }
  ): Promise<number> {
    if (!this.initialized) throw new Error("Database not initialized");
    const { id: userId, email: userEmail } = this.ensureUser();
    const [entries, counters] = await Promise.all([
      this.getArray<JournalEntry>(AsyncDatabase.KEYS.journalEntries),
      this.getCounters(),
    ]);
    const now = new Date().toISOString();
    const id = overrideId ?? counters.journalLastId + 1;
    const filtered = entries.filter((entry) => entry.id !== id);
    const entry: JournalEntry = {
      id,
      userId,
      userEmail: metadata?.userEmail ?? userEmail,
      title,
      content,
      createdAt: metadata?.createdAt ?? now,
      updatedAt: metadata?.updatedAt ?? now,
    };
    const updatedEntries = [entry, ...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    await Promise.all([
      this.setArray(AsyncDatabase.KEYS.journalEntries, updatedEntries),
      this.setCounters({ ...counters, journalLastId: Math.max(counters.journalLastId, id) }),
    ]);
    return id;
  }

  async getAllJournalEntries(): Promise<JournalEntry[]> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await this.getArray<JournalEntry>(AsyncDatabase.KEYS.journalEntries);
    return this.filterJournalEntries(entries).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getJournalEntry(id: number): Promise<JournalEntry | null> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await this.getArray<JournalEntry>(AsyncDatabase.KEYS.journalEntries);
    return this.filterJournalEntries(entries).find((entry) => entry.id === id) ?? null;
  }

  async updateJournalEntry(id: number, title: string, content: string): Promise<void> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await this.getArray<JournalEntry>(AsyncDatabase.KEYS.journalEntries);
    const filtered = this.filterJournalEntries(entries);
    const idx = filtered.findIndex((entry) => entry.id === id);
    if (idx === -1) throw new Error("Journal entry not found");

    const now = new Date().toISOString();
    const updatedEntry = { ...filtered[idx], title, content, updatedAt: now };

    const updatedEntries = entries.map((entry) => (entry.id === id ? updatedEntry : entry));
    await this.setArray(AsyncDatabase.KEYS.journalEntries, updatedEntries);
  }

  async deleteJournalEntry(id: number): Promise<void> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await this.getArray<JournalEntry>(AsyncDatabase.KEYS.journalEntries);
    const updatedEntries = entries.filter((entry) => entry.id !== id || entry.userId !== this.ensureUser().id);
    await this.setArray(AsyncDatabase.KEYS.journalEntries, updatedEntries);
  }

  async getEntryCount(): Promise<number> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await this.getArray<JournalEntry>(AsyncDatabase.KEYS.journalEntries);
    return this.filterJournalEntries(entries).length;
  }

  async createCheckinEntry(mood: number, notes: string | null, date: string): Promise<number> {
    if (!this.initialized) throw new Error("Database not initialized");
    const { id: userId, email: userEmail } = this.ensureUser();
    const [entries, counters] = await Promise.all([
      this.getArray<CheckinEntry>(AsyncDatabase.KEYS.checkinEntries),
      this.getCounters(),
    ]);

    const existingForDate = this.filterCheckinEntries(entries).some((entry) => entry.date === date);
    if (existingForDate) {
      throw new Error("Checkin for this date already exists");
    }

    const id = counters.checkinLastId + 1;
    const now = new Date().toISOString();
    const entry: CheckinEntry = { id, userId, userEmail, mood, notes, date, createdAt: now, updatedAt: now };
    entries.push(entry);
    entries.sort((a, b) => a.date.localeCompare(b.date));
    await Promise.all([
      this.setArray(AsyncDatabase.KEYS.checkinEntries, entries),
      this.setCounters({ ...counters, checkinLastId: id }),
    ]);
    return id;
  }

  async getCheckinEntryByDate(date: string): Promise<CheckinEntry | null> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await this.getArray<CheckinEntry>(AsyncDatabase.KEYS.checkinEntries);
    return this.filterCheckinEntries(entries).find((entry) => entry.date === date) ?? null;
  }

  async updateCheckinEntry(id: number, mood: number, notes: string | null): Promise<void> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await this.getArray<CheckinEntry>(AsyncDatabase.KEYS.checkinEntries);
    const { id: userId } = this.ensureUser();
    const idx = entries.findIndex((entry) => entry.id === id && entry.userId === userId);
    if (idx === -1) throw new Error("Checkin entry not found");

    const now = new Date().toISOString();
    entries[idx] = { ...entries[idx], mood, notes, updatedAt: now };
    await this.setArray(AsyncDatabase.KEYS.checkinEntries, entries);
  }

  async deleteCheckinEntry(id: number): Promise<void> {
    if (!this.initialized) throw new Error("Database not initialized");
    const { id: userId } = this.ensureUser();
    const entries = await this.getArray<CheckinEntry>(AsyncDatabase.KEYS.checkinEntries);
    const updatedEntries = entries.filter((entry) => !(entry.id === id && entry.userId === userId));
    await this.setArray(AsyncDatabase.KEYS.checkinEntries, updatedEntries);
  }

  async getAllCheckinEntries(): Promise<CheckinEntry[]> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await this.getArray<CheckinEntry>(AsyncDatabase.KEYS.checkinEntries);
    return this.filterCheckinEntries(entries).sort((a, b) => b.date.localeCompare(a.date));
  }

  async getCheckinStatistics(): Promise<{
    totalCheckins: number;
    currentStreak: number;
    longestStreak: number;
    averageMood: number;
  }> {
    if (!this.initialized) throw new Error("Database not initialized");
    const checkins = this.filterCheckinEntries(
      await this.getArray<CheckinEntry>(AsyncDatabase.KEYS.checkinEntries),
    ).sort((a, b) => a.date.localeCompare(b.date));

    const totalCheckins = checkins.length;
    const { currentStreak, longestStreak } = this.calculateStreaks(checkins);
    const averageMood =
      checkins.length > 0 ? checkins.reduce((sum, entry) => sum + entry.mood, 0) / checkins.length : 0;

    return {
      totalCheckins,
      currentStreak,
      longestStreak,
      averageMood: Math.round(averageMood * 100) / 100,
    };
  }

  async getMoodTrendData(days: number = 30): Promise<{
    labels: string[];
    data: number[];
    dates: string[];
  }> {
    if (!this.initialized) throw new Error("Database not initialized");
    const allCheckins = this.filterCheckinEntries(
      await this.getArray<CheckinEntry>(AsyncDatabase.KEYS.checkinEntries),
    );
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    const withinRange = allCheckins
      .filter(
        (entry) =>
          entry.date >= startDate.toISOString().split("T")[0] && entry.date <= endDate.toISOString().split("T")[0],
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    const dataMap = new Map<string, number>();
    withinRange.forEach((entry) => dataMap.set(entry.date, entry.mood));

    const labels: string[] = [];
    const data: number[] = [];
    const dates: string[] = [];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split("T")[0];
      const label = currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      labels.push(label);
      dates.push(dateString);
      data.push(dataMap.get(dateString) || 0);
    }

    return { labels, data, dates };
  }

  async clearCurrentUserData(): Promise<void> {
    if (!this.user) return;

    const { id } = this.user;
    const scopedPrefix = `${AsyncDatabase.STORAGE_PREFIX}:${id}:`;
    const baseKeys = Object.values(AsyncDatabase.KEYS).map((key) => `${scopedPrefix}${key}`);
    const allKeys = await AsyncStorage.getAllKeys();
    const scopedKeys = allKeys.filter((key) => key.startsWith(scopedPrefix));
    const targets = Array.from(new Set([...baseKeys, ...scopedKeys]));

    if (targets.length > 0) {
      await AsyncStorage.multiRemove(targets);
    }

    this.initialized = false;
    await this.init();
  }

  async clearAllData(): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys();
    const prefix = `${AsyncDatabase.STORAGE_PREFIX}:`;
    const toRemove = allKeys.filter(
      (key) => key.startsWith(prefix) || AsyncDatabase.LEGACY_KEYS.includes(key),
    );

    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }

    this.initialized = false;
    this.user = null;
  }

  private calculateStreaks(checkins: CheckinEntry[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (checkins.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const sortedCheckins = [...checkins].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date().toISOString().split("T")[0];
    const todayIndex = sortedCheckins.findIndex((entry) => entry.date === today);

    if (todayIndex >= 0) {
      for (let i = todayIndex; i >= 0; i--) {
        const currentDate = new Date(sortedCheckins[i].date);
        const previousDate =
          i > 0 ? new Date(sortedCheckins[i - 1].date) : null;
        if (i === todayIndex) {
          currentStreak = 1;
        } else if (previousDate) {
          const dayDiff = Math.floor(
            (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (dayDiff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    for (let i = 1; i < sortedCheckins.length; i++) {
      const currentDate = new Date(sortedCheckins[i].date);
      const previousDate = new Date(sortedCheckins[i - 1].date);
      const dayDiff = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }
}

export const database = new AsyncDatabase();
