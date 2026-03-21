/**
 * ════════════════════════════════════════════════════════════════
 * AUTOMAIL V2 - STORAGE SERVICE
 * ════════════════════════════════════════════════════════════════
 * 
 * Handles all data persistence using localStorage.
 * Compatible with CodeSandbox (no backend required).
 */

import { APP_CONFIG } from "./config";
import {
  Email,
  EmailFormData,
  EmailThread,
  SavedLink,
  HistoryEntry,
  UserSettings,
  DEFAULT_USER_SETTINGS,
  StorageData,
  ExportData,
} from "./types";
import { generateId, generateThreadId } from "./utils";

// ════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ════════════════════════════════════════════════════════════════

const PREFIX = APP_CONFIG.storage.prefix;

const KEYS = {
  EMAILS: `${PREFIX}emails`,
  THREADS: `${PREFIX}threads`,
  LINKS: `${PREFIX}links`,
  HISTORY: `${PREFIX}history`,
  SETTINGS: `${PREFIX}settings`,
  DRAFT: `${PREFIX}draft`,
} as const;

// ════════════════════════════════════════════════════════════════
// GENERIC STORAGE HELPERS
// ════════════════════════════════════════════════════════════════

const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return defaultValue;
  }
};

const setItem = <T>(key: string, value: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
    return false;
  }
};

const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
};

// ════════════════════════════════════════════════════════════════
// EMAIL STORAGE
// ════════════════════════════════════════════════════════════════

export const emailStorage = {
  getAll: (): Email[] => {
    return getItem<Email[]>(KEYS.EMAILS, []);
  },

  getById: (id: string): Email | undefined => {
    const emails = emailStorage.getAll();
    return emails.find((e) => e.id === id);
  },

  getByThreadId: (threadId: string): Email[] => {
    const emails = emailStorage.getAll();
    return emails.filter((e) => e.threadId === threadId).sort((a, b) => a.timestamp - b.timestamp);
  },

  save: (email: Email): Email => {
    const emails = emailStorage.getAll();
    const existingIndex = emails.findIndex((e) => e.id === email.id);
    
    if (existingIndex >= 0) {
      emails[existingIndex] = email;
    } else {
      emails.unshift(email); // Add to beginning
    }

    // Enforce max items
    const maxItems = APP_CONFIG.storage.maxHistoryItems;
    const trimmed = emails.slice(0, maxItems);
    setItem(KEYS.EMAILS, trimmed);
    
    return email;
  },

  update: (id: string, updates: Partial<Email>): Email | null => {
    const emails = emailStorage.getAll();
    const index = emails.findIndex((e) => e.id === id);
    
    if (index < 0) return null;
    
    emails[index] = { ...emails[index], ...updates };
    setItem(KEYS.EMAILS, emails);
    return emails[index];
  },

  delete: (id: string): boolean => {
    const emails = emailStorage.getAll();
    const filtered = emails.filter((e) => e.id !== id);
    setItem(KEYS.EMAILS, filtered);
    return filtered.length !== emails.length;
  },

  deleteByThreadId: (threadId: string): number => {
    const emails = emailStorage.getAll();
    const filtered = emails.filter((e) => e.threadId !== threadId);
    const deletedCount = emails.length - filtered.length;
    setItem(KEYS.EMAILS, filtered);
    return deletedCount;
  },

  search: (query: string): Email[] => {
    const emails = emailStorage.getAll();
    const lowerQuery = query.toLowerCase();
    return emails.filter(
      (e) =>
        e.formData.supplierName.toLowerCase().includes(lowerQuery) ||
        e.formData.packageName.toLowerCase().includes(lowerQuery) ||
        e.subject.toLowerCase().includes(lowerQuery) ||
        e.formData.reference.toLowerCase().includes(lowerQuery)
    );
  },

  clear: (): void => {
    removeItem(KEYS.EMAILS);
  },
};

// ════════════════════════════════════════════════════════════════
// THREAD STORAGE
// ════════════════════════════════════════════════════════════════

export const threadStorage = {
  getAll: (): EmailThread[] => {
    return getItem<EmailThread[]>(KEYS.THREADS, []);
  },

  getById: (id: string): EmailThread | undefined => {
    const threads = threadStorage.getAll();
    return threads.find((t) => t.id === id);
  },

  getBySupplier: (supplierEmail: string): EmailThread[] => {
    const threads = threadStorage.getAll();
    return threads.filter((t) => t.supplierEmails.includes(supplierEmail));
  },

  create: (email: Email): EmailThread => {
    const threads = threadStorage.getAll();
    const thread: EmailThread = {
      id: email.threadId,
      subject: email.subject,
      supplierName: email.formData.supplierName,
      supplierEmails: email.formData.supplierEmails,
      packageName: email.formData.packageName,
      emails: [email],
      lastActivity: email.timestamp,
      status: "active",
    };
    
    threads.unshift(thread);
    setItem(KEYS.THREADS, threads);
    return thread;
  },

  addEmailToThread: (email: Email): EmailThread | null => {
    const threads = threadStorage.getAll();
    const index = threads.findIndex((t) => t.id === email.threadId);
    
    if (index < 0) {
      // Create new thread if not found
      return threadStorage.create(email);
    }
    
    // Check if email already in thread
    const emailExists = threads[index].emails.some((e) => e.id === email.id);
    if (!emailExists) {
      threads[index].emails.push(email);
    }
    
    threads[index].lastActivity = email.timestamp;
    threads[index].subject = email.subject; // Update subject (might have RE:)
    
    setItem(KEYS.THREADS, threads);
    return threads[index];
  },

  updateStatus: (threadId: string, status: EmailThread["status"]): boolean => {
    const threads = threadStorage.getAll();
    const index = threads.findIndex((t) => t.id === threadId);
    
    if (index < 0) return false;
    
    threads[index].status = status;
    setItem(KEYS.THREADS, threads);
    return true;
  },

  delete: (id: string): boolean => {
    const threads = threadStorage.getAll();
    const filtered = threads.filter((t) => t.id !== id);
    setItem(KEYS.THREADS, filtered);
    return filtered.length !== threads.length;
  },

  clear: (): void => {
    removeItem(KEYS.THREADS);
  },
};

// ════════════════════════════════════════════════════════════════
// SAVED LINKS STORAGE
// ════════════════════════════════════════════════════════════════

export const linkStorage = {
  getAll: (): SavedLink[] => {
    return getItem<SavedLink[]>(KEYS.LINKS, []);
  },

  getById: (id: string): SavedLink | undefined => {
    const links = linkStorage.getAll();
    return links.find((l) => l.id === id);
  },

  getByType: (type: SavedLink["type"]): SavedLink[] => {
    const links = linkStorage.getAll();
    return links.filter((l) => l.type === type);
  },

  getByPackage: (packageName: string): SavedLink[] => {
    const links = linkStorage.getAll();
    return links.filter((l) => l.packageName === packageName);
  },

  save: (link: Omit<SavedLink, "id" | "usageCount" | "lastUsed" | "createdAt">): SavedLink => {
    const links = linkStorage.getAll();
    
    // Check if URL already exists
    const existingIndex = links.findIndex((l) => l.url === link.url);
    
    if (existingIndex >= 0) {
      // Update existing link
      links[existingIndex].usageCount++;
      links[existingIndex].lastUsed = Date.now();
      if (link.packageName) {
        links[existingIndex].packageName = link.packageName;
      }
      setItem(KEYS.LINKS, links);
      return links[existingIndex];
    }
    
    // Create new link
    const newLink: SavedLink = {
      ...link,
      id: generateId(),
      usageCount: 1,
      lastUsed: Date.now(),
      createdAt: Date.now(),
    };
    
    links.unshift(newLink);
    
    // Enforce max items
    const maxItems = APP_CONFIG.storage.maxSavedLinks;
    const trimmed = links.slice(0, maxItems);
    setItem(KEYS.LINKS, trimmed);
    
    return newLink;
  },

  updateUsage: (id: string): SavedLink | null => {
    const links = linkStorage.getAll();
    const index = links.findIndex((l) => l.id === id);
    
    if (index < 0) return null;
    
    links[index].usageCount++;
    links[index].lastUsed = Date.now();
    setItem(KEYS.LINKS, links);
    return links[index];
  },

  delete: (id: string): boolean => {
    const links = linkStorage.getAll();
    const filtered = links.filter((l) => l.id !== id);
    setItem(KEYS.LINKS, filtered);
    return filtered.length !== links.length;
  },

  search: (query: string): SavedLink[] => {
    const links = linkStorage.getAll();
    const lowerQuery = query.toLowerCase();
    return links.filter(
      (l) =>
        l.name.toLowerCase().includes(lowerQuery) ||
        l.url.toLowerCase().includes(lowerQuery) ||
        l.packageName?.toLowerCase().includes(lowerQuery) ||
        l.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
    );
  },

  getFrequentlyUsed: (limit: number = 10): SavedLink[] => {
    const links = linkStorage.getAll();
    return [...links].sort((a, b) => b.usageCount - a.usageCount).slice(0, limit);
  },

  getRecentlyUsed: (limit: number = 10): SavedLink[] => {
    const links = linkStorage.getAll();
    return [...links].sort((a, b) => b.lastUsed - a.lastUsed).slice(0, limit);
  },

  clear: (): void => {
    removeItem(KEYS.LINKS);
  },
};

// ════════════════════════════════════════════════════════════════
// HISTORY STORAGE
// ════════════════════════════════════════════════════════════════

export const historyStorage = {
  getAll: (): HistoryEntry[] => {
    return getItem<HistoryEntry[]>(KEYS.HISTORY, []);
  },

  add: (entry: Omit<HistoryEntry, "id" | "timestamp">): HistoryEntry => {
    const history = historyStorage.getAll();
    const newEntry: HistoryEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    };
    
    history.unshift(newEntry);
    
    // Keep last 500 entries
    const trimmed = history.slice(0, 500);
    setItem(KEYS.HISTORY, trimmed);
    
    return newEntry;
  },

  getByEmailId: (emailId: string): HistoryEntry[] => {
    const history = historyStorage.getAll();
    return history.filter((h) => h.emailId === emailId);
  },

  getRecent: (limit: number = 50): HistoryEntry[] => {
    const history = historyStorage.getAll();
    return history.slice(0, limit);
  },

  clear: (): void => {
    removeItem(KEYS.HISTORY);
  },
};

// ════════════════════════════════════════════════════════════════
// SETTINGS STORAGE
// ════════════════════════════════════════════════════════════════

export const settingsStorage = {
  get: (): UserSettings => {
    return getItem<UserSettings>(KEYS.SETTINGS, DEFAULT_USER_SETTINGS);
  },

  update: (updates: Partial<UserSettings>): UserSettings => {
    const current = settingsStorage.get();
    const updated = { ...current, ...updates };
    setItem(KEYS.SETTINGS, updated);
    return updated;
  },

  reset: (): UserSettings => {
    setItem(KEYS.SETTINGS, DEFAULT_USER_SETTINGS);
    return DEFAULT_USER_SETTINGS;
  },
};

// ════════════════════════════════════════════════════════════════
// DRAFT STORAGE
// ════════════════════════════════════════════════════════════════

export const draftStorage = {
  get: (): Partial<EmailFormData> => {
    return getItem<Partial<EmailFormData>>(KEYS.DRAFT, {});
  },

  save: (data: Partial<EmailFormData>): void => {
    setItem(KEYS.DRAFT, data);
  },

  clear: (): void => {
    removeItem(KEYS.DRAFT);
  },
};

// ════════════════════════════════════════════════════════════════
// EXPORT/IMPORT FUNCTIONS
// ════════════════════════════════════════════════════════════════

export const exportData = (): ExportData => {
  return {
    emails: emailStorage.getAll(),
    threads: threadStorage.getAll(),
    links: linkStorage.getAll(),
    exportedAt: new Date().toISOString(),
    version: "2.0.0",
  };
};

export const importData = (data: ExportData): { success: boolean; message: string } => {
  try {
    if (data.emails && Array.isArray(data.emails)) {
      setItem(KEYS.EMAILS, data.emails);
    }
    if (data.threads && Array.isArray(data.threads)) {
      setItem(KEYS.THREADS, data.threads);
    }
    if (data.links && Array.isArray(data.links)) {
      setItem(KEYS.LINKS, data.links);
    }
    return { success: true, message: "Data imported successfully" };
  } catch (error) {
    return { success: false, message: `Import failed: ${error}` };
  }
};

// ════════════════════════════════════════════════════════════════
// CLEAR ALL DATA
// ════════════════════════════════════════════════════════════════

export const clearAllData = (): void => {
  emailStorage.clear();
  threadStorage.clear();
  linkStorage.clear();
  historyStorage.clear();
  draftStorage.clear();
  // Keep settings
};

// ════════════════════════════════════════════════════════════════
// STORAGE INFO
// ════════════════════════════════════════════════════════════════

export const getStorageInfo = (): {
  emails: number;
  threads: number;
  links: number;
  historyEntries: number;
  totalSize: string;
} => {
  const emails = emailStorage.getAll().length;
  const threads = threadStorage.getAll().length;
  const links = linkStorage.getAll().length;
  const historyEntries = historyStorage.getAll().length;

  // Estimate size
  const data = exportData();
  const size = new Blob([JSON.stringify(data)]).size;
  const totalSize = size > 1024 * 1024 
    ? `${(size / (1024 * 1024)).toFixed(2)} MB` 
    : `${(size / 1024).toFixed(2)} KB`;

  return { emails, threads, links, historyEntries, totalSize };
};
