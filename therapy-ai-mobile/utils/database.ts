import * as SQLite from 'expo-sqlite';

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  mood: number;
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
        mood INTEGER NOT NULL DEFAULT 3,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
    
    // Add mood column to existing tables if it doesn't exist
    try {
      await this.db.execAsync(`
        ALTER TABLE journal_entries ADD COLUMN mood INTEGER DEFAULT 3;
      `);
    } catch (error) {
      // Column might already exist, ignore error
      console.log('Mood column already exists or table is new');
    }
    
    console.log('Database tables created successfully');
  }

  async createJournalEntry(title: string, content: string, mood: number = 3): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const result = await this.db.runAsync(
      'INSERT INTO journal_entries (title, content, mood, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [title, content, mood, now, now]
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

  async updateJournalEntry(id: number, title: string, content: string, mood: number = 3): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE journal_entries SET title = ?, content = ?, mood = ?, updatedAt = ? WHERE id = ?',
      [title, content, mood, now, id]
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
}

export const database = new Database();
