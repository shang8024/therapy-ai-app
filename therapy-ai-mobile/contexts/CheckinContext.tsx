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
import { useAuth } from "./AuthContext";
import {
  getCheckinByDate as getCheckinByDateCloud,
  createCheckin as createCheckinCloud,
  updateCheckin as updateCheckinCloud,
} from "../lib/supabase-services";

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
  const { user } = useAuth();
  const [date] = useState<Date>(() => new Date());
  const key = useMemo(() => makeCheckinKey(date), [date]);

  const [record, setRecord] = useState<CheckinRecord | null>(null);
  const [draft, setDraft] = useState<Draft>({ mood: null, notes: "" });

  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(true);

  const loadToday = useCallback(async () => {
    if (!isInitialized) return;

    setLoading(true);
    const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD format

    try {
      let resolved = false;

      if (user?.id) {
        try {
          const cloudCheckin = await getCheckinByDateCloud(user.id, dateString);
          if (cloudCheckin) {
            resolved = true;

            try {
              const localExisting = await database.getCheckinEntryByDate(dateString);
              if (localExisting) {
                await database.updateCheckinEntry(
                  localExisting.id,
                  cloudCheckin.mood,
                  cloudCheckin.notes ?? null,
                );
              } else {
                await database.createCheckinEntry(
                  cloudCheckin.mood,
                  cloudCheckin.notes ?? null,
                  dateString,
                );
              }
            } catch (syncError) {
              console.warn("Failed to sync cloud check-in to local storage:", syncError);
            }

            setRecord({
              mood: cloudCheckin.mood,
              notes: cloudCheckin.notes ?? "",
              timestamp: cloudCheckin.updated_at ?? cloudCheckin.created_at,
            });
            setDraft({
              mood: cloudCheckin.mood,
              notes: cloudCheckin.notes ?? "",
            });
            setIsEditing(false);
          }
        } catch (cloudError) {
          console.warn("Failed to load check-in from Supabase:", cloudError);
        }
      }

      if (!resolved) {
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
      }
    } catch (error) {
      console.error("Failed to load checkin data:", error);
      setRecord(null);
      setDraft({ mood: DEFAULT_MOOD_VALUE, notes: "" });
      setIsEditing(true);
    } finally {
      setLoading(false);
    }
  }, [date, isInitialized, user]);

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

    const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD format
    const trimmedNotes = draft.notes.trim();
    const notesForStorage = trimmedNotes;
    const notesForSupabase = trimmedNotes.length > 0 ? trimmedNotes : null;

    try {
      const existingEntry = await database.getCheckinEntryByDate(dateString);
      let cloudCheckin:
        | Awaited<ReturnType<typeof createCheckinCloud>>
        | Awaited<ReturnType<typeof updateCheckinCloud>>
        | null = null;

      if (user?.id) {
        try {
          const existingCloud = await getCheckinByDateCloud(user.id, dateString);
          if (existingCloud) {
            cloudCheckin = await updateCheckinCloud(existingCloud.id, draft.mood, notesForSupabase);
          } else {
            cloudCheckin = await createCheckinCloud(user.id, draft.mood, notesForSupabase, dateString);
          }
        } catch (cloudError) {
          console.warn("Failed to persist check-in to Supabase:", cloudError);
        }
      }

      if (existingEntry) {
        await database.updateCheckinEntry(existingEntry.id, draft.mood, notesForSupabase);
      } else {
        await database.createCheckinEntry(draft.mood, notesForSupabase, dateString);
      }

      const payload: CheckinRecord = {
        mood: draft.mood,
        notes: notesForStorage,
        timestamp: cloudCheckin?.updated_at ?? new Date().toISOString(),
      };

      setRecord(payload);
      setDraft({ mood: payload.mood, notes: payload.notes });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save checkin data:", error);
      throw error;
    }
  }, [draft, isInitialized, date, user]);

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
