export async function getLocalValue<T>(key: string): Promise<T> {
  const result = await browser.storage.local.get(key);
  return result[key];
}

export async function setLocalValue<T>(key: string, value: T) {
  return browser.storage.local.set({ [key]: value });
}

export async function geSyncValue<T>(key: string): Promise<T> {
  const result = await browser.storage.sync.get(key);
  return result[key];
}

export async function setSyncValue<T>(key: string, value: T) {
  return browser.storage.sync.set({ [key]: value });
}
