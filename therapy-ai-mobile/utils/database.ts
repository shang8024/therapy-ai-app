import * as SQLite from 'expo-sqlite';

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
      this.db = await SQLite.openDatabaseAsync('therapy_ai_journal.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

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
    
    
    console.log('Database tables created successfully');
  }

  async createJournalEntry(title: string, content: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const result = await this.db.runAsync(
      'INSERT INTO journal_entries (title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [title, content, now, now]
    );
    
    console.log('Journal entry created with ID:', result.lastInsertRowId);
    return result.lastInsertRowId;
  }

  async getAllJournalEntries(): Promise<JournalEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM journal_entries ORDER BY createdAt DESC'
    );
    
    console.log('Retrieved journal entries:', result.length);
    return result as JournalEntry[];
  }

  async getJournalEntry(id: number): Promise<JournalEntry | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM journal_entries WHERE id = ?',
      [id]
    );
    
    return result as JournalEntry | null;
  }

  async updateJournalEntry(id: number, title: string, content: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE journal_entries SET title = ?, content = ?, updatedAt = ? WHERE id = ?',
      [title, content, now, id]
    );
    
    console.log('Journal entry updated with ID:', id);
  }

  async deleteJournalEntry(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'DELETE FROM journal_entries WHERE id = ?',
      [id]
    );
    
    console.log('Journal entry deleted with ID:', id);
  }

  async getEntryCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM journal_entries'
    );
    
    return (result as any)?.count || 0;
  }

  // Checkin methods
  async createCheckinEntry(mood: number, notes: string | null, date: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const result = await this.db.runAsync(
      'INSERT INTO checkin_entries (mood, notes, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [mood, notes, date, now, now]
    );
    
    console.log('Checkin entry created with ID:', result.lastInsertRowId);
    return result.lastInsertRowId;
  }

  async getCheckinEntryByDate(date: string): Promise<CheckinEntry | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM checkin_entries WHERE date = ?',
      [date]
    );
    
    return result as CheckinEntry | null;
  }

  async updateCheckinEntry(id: number, mood: number, notes: string | null): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE checkin_entries SET mood = ?, notes = ?, updatedAt = ? WHERE id = ?',
      [mood, notes, now, id]
    );
    
    console.log('Checkin entry updated with ID:', id);
  }

  async deleteCheckinEntry(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'DELETE FROM checkin_entries WHERE id = ?',
      [id]
    );
    
    console.log('Checkin entry deleted with ID:', id);
  }

  async getAllCheckinEntries(): Promise<CheckinEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM checkin_entries ORDER BY date DESC'
    );
    
    return result as CheckinEntry[];
  }
}

export const database = new Database();
