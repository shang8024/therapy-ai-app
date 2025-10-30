import AsyncStorage from "@react-native-async-storage/async-storage";

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckinEntry {
  id: number;
  mood: number;
  notes: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

const KEYS = {
  journalEntries: "journal_entries",
  checkinEntries: "checkin_entries",
  counters: "database_counters",
} as const;

type Counters = {
  journalLastId: number;
  checkinLastId: number;
};

async function getCounters(): Promise<Counters> {
  const raw = await AsyncStorage.getItem(KEYS.counters);
  if (raw) return JSON.parse(raw) as Counters;
  const initial: Counters = { journalLastId: 0, checkinLastId: 0 };
  await AsyncStorage.setItem(KEYS.counters, JSON.stringify(initial));
  return initial;
}

async function setCounters(next: Counters): Promise<void> {
  await AsyncStorage.setItem(KEYS.counters, JSON.stringify(next));
}

async function getArray<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function setArray<T>(key: string, value: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

class AsyncDatabase {
  private initialized = false;

  async init(): Promise<void> {
    // Ensure storage keys exist and seed sample data if empty
    if (!this.initialized) {
      const [journals, checkins] = await Promise.all([
        getArray<JournalEntry>(KEYS.journalEntries),
        getArray<CheckinEntry>(KEYS.checkinEntries),
      ]);

      if (checkins.length === 0) {
        const today = new Date();
        const sampleMoods = [4, 3, 5, 4, 2, 3, 4];
        const sampleNotes = [
          "Feeling good today!",
          "Had some challenges but managed well",
          "Excellent day overall",
          "Pretty good, minor stress",
          "Tough day, but I got through it",
          "Okay day, some ups and downs",
          "Good day, feeling positive",
        ];

        const counters = await getCounters();
        let nextId = counters.checkinLastId;
        const nowIso = new Date().toISOString();
        const seeded: CheckinEntry[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateString = date.toISOString().split("T")[0];
          nextId += 1;
          seeded.push({
            id: nextId,
            mood: sampleMoods[i],
            notes: sampleNotes[i],
            date: dateString,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
        await setArray(KEYS.checkinEntries, seeded);
        await setCounters({ ...counters, checkinLastId: nextId });
      }

      // Ensure arrays exist in storage
      if (journals.length === 0) {
        await setArray(KEYS.journalEntries, []);
      }

      this.initialized = true;
    }
  }

  async createJournalEntry(title: string, content: string): Promise<number> {
    if (!this.initialized) throw new Error("Database not initialized");
    const [entries, counters] = await Promise.all([
      getArray<JournalEntry>(KEYS.journalEntries),
      getCounters(),
    ]);
    const now = new Date().toISOString();
    const id = counters.journalLastId + 1;
    const entry: JournalEntry = { id, title, content, createdAt: now, updatedAt: now };
    entries.unshift(entry);
    await Promise.all([
      setArray(KEYS.journalEntries, entries),
      setCounters({ ...counters, journalLastId: id }),
    ]);
    return id;
  }

  async getAllJournalEntries(): Promise<JournalEntry[]> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await getArray<JournalEntry>(KEYS.journalEntries);
    return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getJournalEntry(id: number): Promise<JournalEntry | null> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await getArray<JournalEntry>(KEYS.journalEntries);
    return entries.find(e => e.id === id) ?? null;
  }

  async updateJournalEntry(id: number, title: string, content: string): Promise<void> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await getArray<JournalEntry>(KEYS.journalEntries);
    const idx = entries.findIndex(e => e.id === id);
    if (idx === -1) throw new Error("Journal entry not found");
    const now = new Date().toISOString();
    entries[idx] = { ...entries[idx], title, content, updatedAt: now };
    await setArray(KEYS.journalEntries, entries);
  }

  async deleteJournalEntry(id: number): Promise<void> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await getArray<JournalEntry>(KEYS.journalEntries);
    const next = entries.filter(e => e.id !== id);
    await setArray(KEYS.journalEntries, next);
  }

  async getEntryCount(): Promise<number> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await getArray<JournalEntry>(KEYS.journalEntries);
    return entries.length;
  }

  async createCheckinEntry(mood: number, notes: string | null, date: string): Promise<number> {
    if (!this.initialized) throw new Error("Database not initialized");
    const [entries, counters] = await Promise.all([
      getArray<CheckinEntry>(KEYS.checkinEntries),
      getCounters(),
    ]);
    if (entries.some(e => e.date === date)) {
      throw new Error("Checkin for this date already exists");
    }
    const id = counters.checkinLastId + 1;
    const now = new Date().toISOString();
    const entry: CheckinEntry = { id, mood, notes, date, createdAt: now, updatedAt: now };
    entries.push(entry);
    entries.sort((a, b) => a.date.localeCompare(b.date));
    await Promise.all([
      setArray(KEYS.checkinEntries, entries),
      setCounters({ ...counters, checkinLastId: id }),
    ]);
    return id;
  }

  async getCheckinEntryByDate(date: string): Promise<CheckinEntry | null> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await getArray<CheckinEntry>(KEYS.checkinEntries);
    return entries.find(e => e.date === date) ?? null;
  }

  async updateCheckinEntry(id: number, mood: number, notes: string | null): Promise<void> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await getArray<CheckinEntry>(KEYS.checkinEntries);
    const idx = entries.findIndex(e => e.id === id);
    if (idx === -1) throw new Error("Checkin entry not found");
    const now = new Date().toISOString();
    entries[idx] = { ...entries[idx], mood, notes, updatedAt: now };
    await setArray(KEYS.checkinEntries, entries);
  }

  async deleteCheckinEntry(id: number): Promise<void> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await getArray<CheckinEntry>(KEYS.checkinEntries);
    const next = entries.filter(e => e.id !== id);
    await setArray(KEYS.checkinEntries, next);
  }

  async getAllCheckinEntries(): Promise<CheckinEntry[]> {
    if (!this.initialized) throw new Error("Database not initialized");
    const entries = await getArray<CheckinEntry>(KEYS.checkinEntries);
    return entries.sort((a, b) => b.date.localeCompare(a.date));
  }

  async getCheckinStatistics(): Promise<{
    totalCheckins: number;
    currentStreak: number;
    longestStreak: number;
    averageMood: number;
  }> {
    if (!this.initialized) throw new Error("Database not initialized");
    const allCheckins = (await getArray<CheckinEntry>(KEYS.checkinEntries)).sort(
      (a, b) => a.date.localeCompare(b.date)
    );
    const totalCheckins = allCheckins.length;
    const { currentStreak, longestStreak } = this.calculateStreaks(allCheckins);
    const averageMood = allCheckins.length > 0
      ? allCheckins.reduce((sum, e) => sum + e.mood, 0) / allCheckins.length
      : 0;
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
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);

    const all = (await getArray<CheckinEntry>(KEYS.checkinEntries)).filter(
      e => e.date >= startDate.toISOString().split("T")[0] && e.date <= endDate.toISOString().split("T")[0]
    ).sort((a, b) => a.date.localeCompare(b.date));

    const dataMap = new Map<string, number>();
    all.forEach(e => dataMap.set(e.date, e.mood));

    const labels: string[] = [];
    const data: number[] = [];
    const dates: string[] = [];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split("T")[0];
      const label = currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      labels.push(label);
      dates.push(dateString);
      data.push(dataMap.get(dateString) || 0);
    }

    return { labels, data, dates };
  }

  private calculateStreaks(checkins: CheckinEntry[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (checkins.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const sortedCheckins = [...checkins].sort((a, b) => a.date.localeCompare(b.date));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split("T")[0];
    const todayIndex = sortedCheckins.findIndex(entry => entry.date === today);

    if (todayIndex >= 0) {
      for (let i = todayIndex; i >= 0; i--) {
        const currentDate = new Date(sortedCheckins[i].date);
        const previousDate = i > 0 ? new Date(sortedCheckins[i - 1].date) : null;
        if (i === todayIndex) {
          currentStreak = 1;
        } else if (previousDate) {
          const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
          if (dayDiff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    tempStreak = 1;
    for (let i = 1; i < sortedCheckins.length; i++) {
      const currentDate = new Date(sortedCheckins[i].date);
      const previousDate = new Date(sortedCheckins[i - 1].date);
      const dayDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
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


