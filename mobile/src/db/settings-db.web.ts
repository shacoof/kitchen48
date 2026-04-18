// Web stub — settings stored in memory for preview purposes.

const memoryStore: Record<string, string> = {};

export async function getSetting(key: string): Promise<string | null> {
  return memoryStore[key] ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  memoryStore[key] = value;
}

export async function deleteSetting(key: string): Promise<void> {
  delete memoryStore[key];
}

export async function getAllSettings(): Promise<Record<string, string>> {
  return { ...memoryStore };
}
