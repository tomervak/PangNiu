import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppSettings, Word } from "../types";
import wordData from "../data/words.json";

const STORAGE_KEYS = {
  settings: "app_settings",
  currentWordPool: "current_word_pool",
};

export const LEVEL_OPTIONS = [
  { id: "new-learner", label: "New learner", maxLevel: 2 },
  { id: "beginner", label: "Beginner", maxLevel: 3 },
  { id: "intermediate", label: "Intermediate", maxLevel: 5 },
  { id: "advanced", label: "Advanced", maxLevel: 6 },
] as const;

export const TOPIC_OPTIONS = [
  { value: "travel", label: "Travel" },
  { value: "business", label: "Business" },
  { value: "chat", label: "Chat" },
  { value: "study", label: "Study" },
  { value: "daily-life", label: "Daily life" },
  { value: "food", label: "Food" },
  { value: "shopping", label: "Shopping" },
  { value: "health", label: "Health" },
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  userLevel: LEVEL_OPTIONS[0].maxLevel,
  selectedCategories: [],
  widgetWordCount: 5,
  hasCompletedOnboarding: false,
  currentWordPool: [],
};

const words: Word[] = wordData as Word[];

function normalizeLevel(level: number | undefined): number {
  const fallback = DEFAULT_SETTINGS.userLevel;
  if (typeof level !== "number" || Number.isNaN(level)) {
    return fallback;
  }

  return Math.max(
    1,
    Math.min(level, LEVEL_OPTIONS[LEVEL_OPTIONS.length - 1].maxLevel),
  );
}

function normalizeCategories(categories: string[] | undefined): string[] {
  const availableCategories = TOPIC_OPTIONS.map((topic) => topic.value);
  return (categories ?? [])
    .map((category) => category.toLowerCase())
    .filter((category): category is (typeof TOPIC_OPTIONS)[number]["value"] =>
      availableCategories.includes(
        category as (typeof TOPIC_OPTIONS)[number]["value"],
      ),
    );
}

function normalizeSettings(
  raw: Partial<AppSettings> | null | undefined,
): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    userLevel: normalizeLevel(raw?.userLevel),
    selectedCategories: normalizeCategories(raw?.selectedCategories),
    currentWordPool: raw?.currentWordPool ?? DEFAULT_SETTINGS.currentWordPool,
  };
}

export async function saveSettings(settings: AppSettings) {
  const normalizedSettings = normalizeSettings(settings);
  await AsyncStorage.setItem(
    STORAGE_KEYS.settings,
    JSON.stringify(normalizedSettings),
  );
}

export async function loadSettings(): Promise<AppSettings | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.settings);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return normalizeSettings(parsed);
  } catch {
    return null;
  }
}

export async function saveCurrentWordPool(wordIds: string[]) {
  const settings = await loadSettings();
  const nextSettings = normalizeSettings(
    settings
      ? { ...settings, currentWordPool: wordIds }
      : { currentWordPool: wordIds },
  );

  await AsyncStorage.setItem(
    STORAGE_KEYS.currentWordPool,
    JSON.stringify(wordIds),
  );
  await AsyncStorage.setItem(
    STORAGE_KEYS.settings,
    JSON.stringify(nextSettings),
  );
}

export async function loadCurrentWordPool(): Promise<string[] | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.currentWordPool);
  if (!raw) {
    const storedSettings = await loadSettings();
    return storedSettings?.currentWordPool ?? null;
  }

  try {
    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}

export async function saveSettingsAndWordPool(
  settings: AppSettings,
  wordIds: string[],
) {
  const normalizedSettings = normalizeSettings({
    ...settings,
    currentWordPool: wordIds,
  });

  await AsyncStorage.setItem(
    STORAGE_KEYS.settings,
    JSON.stringify(normalizedSettings),
  );
  await AsyncStorage.setItem(
    STORAGE_KEYS.currentWordPool,
    JSON.stringify(wordIds),
  );

  return normalizedSettings;
}

export function generateWordPool(
  level: number,
  categories: string[],
  count: number,
): string[] {
  const normalizedCategories = normalizeCategories(categories);
  const maxLevel = normalizeLevel(level);

  const filteredWords = words.filter((word) => {
    const matchesLevel = word.level <= maxLevel;
    const matchesCategories =
      normalizedCategories.length === 0 ||
      word.categories.some((category) =>
        normalizedCategories.includes(category.toLowerCase()),
      );

    return matchesLevel && matchesCategories;
  });

  if (filteredWords.length === 0) {
    return [];
  }

  const shuffledWords = [...filteredWords].sort(() => Math.random() - 0.5);
  const safeCount = Math.max(0, Math.min(count, shuffledWords.length));

  return shuffledWords.slice(0, safeCount).map((word) => word.id);
}

export function getAvailableCategories(): string[] {
  return TOPIC_OPTIONS.map((topic) => topic.value);
}

export function getCategoryLabel(category: string): string {
  return (
    TOPIC_OPTIONS.find((topic) => topic.value === category.toLowerCase())
      ?.label ?? category
  );
}

export function getLevelLabel(level: number): string {
  return (
    LEVEL_OPTIONS.find((option) => option.maxLevel === normalizeLevel(level))
      ?.label ?? LEVEL_OPTIONS[0].label
  );
}

export function getWordById(id: string): Word | undefined {
  return words.find((word) => word.id === id);
}

export function getWordsByIds(ids: string[]): Word[] {
  const wordMap = new Map(words.map((word) => [word.id, word]));
  return ids
    .map((id) => wordMap.get(id))
    .filter((word): word is Word => Boolean(word));
}
