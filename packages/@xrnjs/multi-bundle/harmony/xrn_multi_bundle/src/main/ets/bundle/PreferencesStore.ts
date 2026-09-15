export interface PreferencesStore {
  put(key: string, value: string, name?: string): void
  get(key: string, name?: string): string
}