export interface Word {
  id: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  level: number;
  categories: string[];
}

export interface AppSettings {
  userLevel: number;
  selectedCategories: string[];
  widgetWordCount: number;
  hasCompletedOnboarding: boolean;
  currentWordPool?: string[];
}
