// context/CheckinContext.tsx
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";
import { CheckinRecord } from "../types/checkin";
import { makeCheckinKey, DEFAULT_MOOD_VALUE } from "../constants/checkin";
import { database } from "../utils/database";
import { useDatabase } from "./DatabaseContext";

type Draft = {
  mood: number | null;
  notes: string;
};

type CheckinContextValue = {
  date: Date;
  key: string;
  record: CheckinRecord | null;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  loading: boolean;
  isEditing: boolean;
  loadToday: () => Promise<void>;
  startEdit: () => void;
  cancelEdit: () => void;
  save: () => Promise<void>;
};

export const CheckinContext = createContext<CheckinContextValue | null>(null);

type Props = { children: React.ReactNode };

export const CheckinProvider: React.FC<Props> = ({ children }) => {
  const { isInitialized, isLoading: dbLoading } = useDatabase();
  const [date] = useState<Date>(() => new Date());
  const key = useMemo(() => makeCheckinKey(date), [date]);

  const [record, setRecord] = useState<CheckinRecord | null>(null);
  const [draft, setDraft] = useState<Draft>({ mood: null, notes: "" });

  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(true);

  const loadToday = useCallback(async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    try {
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const dbRecord = await database.getCheckinEntryByDate(dateString);
      
      if (dbRecord) {
        const checkinRecord: CheckinRecord = {
          mood: dbRecord.mood,
          notes: dbRecord.notes || "",
          timestamp: dbRecord.createdAt,
        };
        setRecord(checkinRecord);
        setDraft({ mood: checkinRecord.mood, notes: checkinRecord.notes });
        setIsEditing(false);
      } else {
        setRecord(null);
        setDraft({ mood: DEFAULT_MOOD_VALUE, notes: "" });
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Failed to load checkin data:', error);
      setRecord(null);
      setDraft({ mood: DEFAULT_MOOD_VALUE, notes: "" });
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  }, [isInitialized, date]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const startEdit = useCallback(() => {
    if (record) {
      setDraft({ mood: record.mood, notes: record.notes ?? "" });
    }
    setIsEditing(true);
  }, [record]);

  const cancelEdit = useCallback(() => {
    if (record) {
      setDraft({ mood: record.mood, notes: record.notes ?? "" });
      setIsEditing(false);
    } else {
      setDraft({ mood: null, notes: "" });
      setIsEditing(true);
    }
  }, [record]);

  const save = useCallback(async () => {
    if (draft.mood == null) {
      throw new Error("Missing mood");
    }
    
    if (!isInitialized) {
      throw new Error("Database not initialized");
    }
    
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const payload: CheckinRecord = {
      mood: draft.mood,
      notes: draft.notes,
      timestamp: new Date().toISOString(),
    };
    
    try {
      // Check if entry already exists for this date
      const existingEntry = await database.getCheckinEntryByDate(dateString);
      
      if (existingEntry) {
        // Update existing entry
        await database.updateCheckinEntry(existingEntry.id, draft.mood, draft.notes);
      } else {
        // Create new entry
        await database.createCheckinEntry(draft.mood, draft.notes, dateString);
      }
      
      setRecord(payload);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save checkin data:', error);
      throw error;
    }
  }, [draft, isInitialized, date]);

  const value = useMemo<CheckinContextValue>(
    () => ({
      date,
      key,
      record,
      draft,
      setDraft,
      loading: loading || dbLoading,
      isEditing,
      loadToday,
      startEdit,
      cancelEdit,
      save,
    }),
    [
      date,
      key,
      record,
      draft,
      loading,
      dbLoading,
      isEditing,
      loadToday,
      startEdit,
      cancelEdit,
      save,
    ],
  );

  return (
    <CheckinContext.Provider value={value}>{children}</CheckinContext.Provider>
  );
};

export function useCheckin() {
  const ctx = useContext(CheckinContext);
  if (!ctx) {
    throw new Error("useCheckin must be used within <CheckinProvider>");
  }
  return ctx;
}
