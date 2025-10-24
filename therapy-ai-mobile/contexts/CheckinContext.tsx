// context/CheckinContext.tsx
import React, { createContext, useCallback, useEffect, useMemo, useState, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CheckinRecord } from "../types/checkin";
import { makeCheckinKey, DEFAULT_MOOD_VALUE } from "../constants/checkin";

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
  const [date] = useState<Date>(() => new Date());
  const key = useMemo(() => makeCheckinKey(date), [date]);

  const [record, setRecord] = useState<CheckinRecord | null>(null);
  const [draft, setDraft] = useState<Draft>({ mood: null, notes: "" });

  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(true);

  const loadToday = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed: CheckinRecord = JSON.parse(raw);
        setRecord(parsed);
        setDraft({ mood: parsed.mood, notes: parsed.notes ?? "" });
        setIsEditing(false);
      } else {
        setRecord(null);
        setDraft({ mood: DEFAULT_MOOD_VALUE, notes: "" });
        setIsEditing(true);
      }
    } finally {
      setLoading(false);
    }
  }, [key]);

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
    const payload: CheckinRecord = {
      mood: draft.mood,
      notes: draft.notes,
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
    setRecord(payload);
    setIsEditing(false);
  }, [draft, key]);

  const value = useMemo<CheckinContextValue>(
    () => ({
      date,
      key,
      record,
      draft,
      setDraft,
      loading,
      isEditing,
      loadToday,
      startEdit,
      cancelEdit,
      save,
    }),
    [date, key, record, draft, loading, isEditing, loadToday, startEdit, cancelEdit, save]
  );

  return <CheckinContext.Provider value={value}>{children}</CheckinContext.Provider>;
};


export function useCheckin() {
  const ctx = useContext(CheckinContext);
  if (!ctx) {
    throw new Error("useCheckin must be used within <CheckinProvider>");
  }
  return ctx;
}