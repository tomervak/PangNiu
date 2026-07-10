# Chinese Vocabulary Lock Screen Widget App — Project Spec

## Overview
An iOS app built with **React Native (Expo)** that helps users learn Chinese vocabulary via a **Lock Screen widget**. The app is **frontend-only** — no backend server. On first launch, the user picks a skill level, topics of interest, and how many words to show on the widget. The widget displays a rotating set of Chinese words with translations; tapping a word opens the app to a detail screen where the user can hear it pronounced (via built-in text-to-speech, no external AI APIs).

## Tech Stack
- **React Native via Expo** (managed workflow + **dev client**, not Expo Go, since a custom native widget extension is required)
- **EAS Build** for compiling/testing on a real device
- **expo-widgets** (config plugin) to scaffold the iOS Widget Extension (App Groups, target, supported families)
- **SwiftUI/WidgetKit** for the actual lock screen widget (small amount of native code, generated/edited alongside the RN app)
- **expo-speech** (wraps native `AVSpeechSynthesizer`) for word pronunciation — built-in OS text-to-speech, no external API, no backend
- **AsyncStorage** or **MMKV** for local persistence (user prefs, saved word pool)
- **React Navigation** for in-app navigation + deep linking
- **TypeScript**

## Vocabulary Data Source
Use an open-source HSK vocabulary dataset, bundled into the app at build time as static JSON (no runtime fetch, no backend):
- Primary source: `drkameleon/complete-hsk-vocabulary` (GitHub) — complete HSK 2.0/3.0 word lists in JSON, pre-split by level, including simplified characters, pinyin, part of speech, frequency ranking, and English meanings.
- Check the repo's license before shipping.
- The dataset does NOT include "travel / business / chat" topic tags — these need to be added manually or via a simple keyword/category mapping script during data prep (one-time, not runtime).

## Core Features (v1 scope — excludes advanced AI features and pronunciation scoring)
1. **Onboarding** (first launch only): skill level picker, topic picker (multi-select), widget word-count picker.
2. **Widget word pool logic**: from the full vocabulary set, filter by selected level + topics, then select N words (N = user's chosen count) to feed the widget.
3. **Lock Screen widget**: displays word(s) + translation, using `accessoryRectangular` / `accessoryInline` families. Refreshes periodically (not real-time).
4. **Tap-to-open**: tapping a widget word deep-links into the app to that word's detail screen.
5. **Word detail screen**: shows hanzi, pinyin, translation, and a "play pronunciation" button using on-device TTS.
6. **Settings screen**: allows changing level/topics/word count after onboarding, which regenerates the widget's word pool and triggers a widget refresh.
7. **Word list/browse screen**: view all words in the user's current pool.

## Explicitly out of scope for this build
- No backend/server of any kind
- No external AI APIs (no LLM-generated sentences, no chat practice)
- No pronunciation scoring / speech recognition
- No user accounts or multi-device sync
- No dynamic content updates (word data is bundled, not fetched remotely)

---

## Task Breakdown for Copilot

### Task 1 — Project Setup
- Initialize an Expo project with TypeScript.
- Configure it for a **dev client** build (not Expo Go), since native widget code will be added later.
- Install: `expo-dev-client`, `expo-widgets`, `expo-speech`, `@react-native-async-storage/async-storage` (or `react-native-mmkv`), `@react-navigation/native` + stack navigator.
- Set up basic folder structure: `/app` (or `/src`) with `screens/`, `data/`, `store/`, `navigation/`.

### Task 2 — Vocabulary Data Layer
- Download the level-split JSON files from `drkameleon/complete-hsk-vocabulary`.
- Write a one-time transform script (Node script, run locally, not at app runtime) that converts the raw dataset into this app's schema:
  ```ts
  interface Word {
    id: string;
    hanzi: string;
    pinyin: string;
    translation: string;
    level: number; // HSK level
    categories: string[]; // e.g. ["travel", "business", "chat"]
  }
  ```
- Add a simple keyword-based tagging step to assign `categories` (e.g. words matching a curated keyword/POS list get tagged "travel", "business", "chat", etc.). This can be rough/manual for v1.
- Output the final dataset as a bundled JSON file (or split by level) inside the app, e.g. `src/data/words.json`.

### Task 3 — Local State & Storage
- Define a storage schema for: `userLevel`, `selectedCategories`, `widgetWordCount`, `hasCompletedOnboarding`, `currentWordPool` (array of word IDs).
- Implement read/write helpers using AsyncStorage or MMKV.
- Implement a `generateWordPool(level, categories, count)` function that filters the bundled dataset and returns N word IDs.

### Task 4 — Onboarding Flow
- Screen 1: Skill level picker (e.g. HSK 1–6 or Beginner/Intermediate/Advanced).
- Screen 2: Topic picker — multi-select (Travel, Business, Chatting, etc.).
- Screen 3: Widget word count picker (numeric stepper, e.g. 1–10).
- On completion: save selections to storage, call `generateWordPool()`, save the resulting pool, and mark onboarding complete.
- Route to onboarding on first launch only (check `hasCompletedOnboarding` at app start).

### Task 5 — Main App Screens
- **Word List screen**: renders the current word pool (hanzi + pinyin + translation), tappable to open detail.
- **Word Detail screen**: shows hanzi, pinyin, translation; "Play pronunciation" button using `expo-speech` (`Speech.speak(hanzi, { language: 'zh-CN' })`).
- **Settings screen**: re-exposes the onboarding pickers (level, categories, word count); on save, regenerate the word pool, persist it, and trigger a widget data update + reload (see Task 7).

### Task 6 — Navigation & Deep Linking
- Set up React Navigation stack: Onboarding flow → Main tabs (Word List, Settings) → Word Detail.
- Configure a custom URL scheme (e.g. `chinesewidget://word/:id`) so the widget can deep-link directly into the Word Detail screen for a specific word.
- Handle the incoming deep link on app launch/resume to navigate to the correct screen.

### Task 7 — iOS Widget Extension Setup
- Use `expo-widgets` config plugin to scaffold a Widget Extension target with an App Group (e.g. `group.com.yourapp.shared`).
- Configure supported widget families for Lock Screen: `accessoryRectangular`, `accessoryInline` (and optionally `accessoryCircular`).
- In the generated SwiftUI widget code, build a simple view that reads the current word pool from the shared App Group storage (UserDefaults suite) and displays word + translation.
- Implement a `TimelineProvider` that reloads on a reasonable interval (e.g. hourly) or rotates through the pool.

### Task 8 — Data Bridge (RN ↔ Widget)
- Whenever the word pool changes (onboarding completion or settings update), write the current pool (word IDs + hanzi + translation, minimal data needed for display) into the shared App Group storage from the RN side (via `expo-widgets`' provided data-sharing API or a small native module if needed).
- Call the widget reload/refresh function (`WidgetCenter.shared.reloadAllTimelines()`, exposed via the plugin or a native module) after every update so the Lock Screen reflects the new selection.

### Task 9 — Widget Tap → App Deep Link
- Set the `widgetURL` (or equivalent App Intent target) on each widget entry to `chinesewidget://word/{id}`.
- Verify tapping a word on the Lock Screen opens the app directly to that word's detail screen (Task 6's deep link handler).

### Task 10 — Polish & Device Testing
- Test onboarding → widget appears with correct words → tap-through → pronunciation playback, end to end.
- Test settings changes propagate to the widget correctly.
- Test on a physical device (Lock Screen widgets need iOS 16+; verify TTS works for `zh-CN`).
- Basic empty/error states: no words matching filters, TTS unavailable, etc.
