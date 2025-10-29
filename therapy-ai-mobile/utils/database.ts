import * as SQLite from "expo-sqlite";

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

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync("therapy_ai_journal.db");
      await this.createTables();
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS checkin_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mood INTEGER NOT NULL,
        notes TEXT,
        date TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        UNIQUE(date)
      );
    `);

    // Add sample data for testing if no data exists
    await this.addSampleDataIfNeeded();

    console.log("Database tables created successfully");
  }

  private async addSampleDataIfNeeded(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // Check if we already have check-in data
    const existingData = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM checkin_entries'
    );
    const count = (existingData as any)?.count || 0;

    if (count === 0) {
      // Add sample check-in data for the last 7 days
      const today = new Date();
      const sampleMoods = [4, 3, 5, 4, 2, 3, 4]; // Sample mood values
      const sampleNotes = [
        "Feeling good today!",
        "Had some challenges but managed well",
        "Excellent day overall",
        "Pretty good, minor stress",
        "Tough day, but I got through it",
        "Okay day, some ups and downs",
        "Good day, feeling positive"
      ];

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        await this.db.runAsync(
          'INSERT INTO checkin_entries (mood, notes, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
          [sampleMoods[i], sampleNotes[i], dateString, new Date().toISOString(), new Date().toISOString()]
        );
      }
      
      console.log("Sample check-in data added for testing");
    }
  }

  async createJournalEntry(title: string, content: string): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    const now = new Date().toISOString();
    const result = await this.db.runAsync(
      "INSERT INTO journal_entries (title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?)",
      [title, content, now, now],
    );

    console.log("Journal entry created with ID:", result.lastInsertRowId);
    return result.lastInsertRowId;
  }

  async getAllJournalEntries(): Promise<JournalEntry[]> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getAllAsync(
      "SELECT * FROM journal_entries ORDER BY createdAt DESC",
    );

    return result as JournalEntry[];
  }

  async getJournalEntry(id: number): Promise<JournalEntry | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync(
      "SELECT * FROM journal_entries WHERE id = ?",
      [id],
    );

    return result as JournalEntry | null;
  }

  async updateJournalEntry(
    id: number,
    title: string,
    content: string,
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const now = new Date().toISOString();
    await this.db.runAsync(
      "UPDATE journal_entries SET title = ?, content = ?, updatedAt = ? WHERE id = ?",
      [title, content, now, id],
    );

    console.log("Journal entry updated with ID:", id);
  }

  async deleteJournalEntry(id: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync("DELETE FROM journal_entries WHERE id = ?", [id]);

    console.log("Journal entry deleted with ID:", id);
  }

  async getEntryCount(): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync(
      "SELECT COUNT(*) as count FROM journal_entries",
    );

    return (result as any)?.count || 0;
  }

  // Checkin methods
  async createCheckinEntry(
    mood: number,
    notes: string | null,
    date: string,
  ): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    const now = new Date().toISOString();
    const result = await this.db.runAsync(
      "INSERT INTO checkin_entries (mood, notes, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
      [mood, notes, date, now, now],
    );

    console.log("Checkin entry created with ID:", result.lastInsertRowId);
    return result.lastInsertRowId;
  }

  async getCheckinEntryByDate(date: string): Promise<CheckinEntry | null> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync(
      "SELECT * FROM checkin_entries WHERE date = ?",
      [date],
    );

    return result as CheckinEntry | null;
  }

  async updateCheckinEntry(
    id: number,
    mood: number,
    notes: string | null,
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const now = new Date().toISOString();
    await this.db.runAsync(
      "UPDATE checkin_entries SET mood = ?, notes = ?, updatedAt = ? WHERE id = ?",
      [mood, notes, now, id],
    );

    console.log("Checkin entry updated with ID:", id);
  }

  async deleteCheckinEntry(id: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.runAsync("DELETE FROM checkin_entries WHERE id = ?", [id]);

    console.log("Checkin entry deleted with ID:", id);
  }

  async getAllCheckinEntries(): Promise<CheckinEntry[]> {
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getAllAsync(
      "SELECT * FROM checkin_entries ORDER BY date DESC",
    );

    return result as CheckinEntry[];
  }

  // Dashboard statistics methods
  async getCheckinStatistics(): Promise<{
    totalCheckins: number;
    currentStreak: number;
    longestStreak: number;
    averageMood: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    // Get total checkins
    const totalResult = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM checkin_entries'
    );
    const totalCheckins = (totalResult as any)?.count || 0;

    // Get all checkins ordered by date
    const allCheckins = await this.db.getAllAsync(
      'SELECT * FROM checkin_entries ORDER BY date ASC'
    ) as CheckinEntry[];

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(allCheckins);

    // Calculate average mood
    const averageMood = allCheckins.length > 0 
      ? allCheckins.reduce((sum, entry) => sum + entry.mood, 0) / allCheckins.length 
      : 0;

    return {
      totalCheckins,
      currentStreak,
      longestStreak,
      averageMood: Math.round(averageMood * 100) / 100, // Round to 2 decimal places
    };
  }

  async getMoodTrendData(days: number = 30): Promise<{
    labels: string[];
    data: number[];
    dates: string[];
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);

    const result = await this.db.getAllAsync(
      'SELECT * FROM checkin_entries WHERE date >= ? AND date <= ? ORDER BY date ASC',
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    ) as CheckinEntry[];

    // Create a map of existing data
    const dataMap = new Map<string, number>();
    result.forEach(entry => {
      dataMap.set(entry.date, entry.mood);
    });

    // Generate labels and data for all days in range
    const labels: string[] = [];
    const data: number[] = [];
    const dates: string[] = [];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Format label for display (e.g., "Jan 15")
      const label = currentDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      labels.push(label);
      dates.push(dateString);
      
      // Use existing mood data or null if no checkin for that day
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

    // Sort checkins by date
    const sortedCheckins = [...checkins].sort((a, b) => a.date.localeCompare(b.date));
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak (from today backwards)
    const today = new Date().toISOString().split('T')[0];
    const todayIndex = sortedCheckins.findIndex(entry => entry.date === today);
    
    if (todayIndex >= 0) {
      // Start from today and count backwards
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

    // Calculate longest streak
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

export const database = new Database();
