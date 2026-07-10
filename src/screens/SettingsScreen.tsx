import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  DEFAULT_SETTINGS,
  generateWordPool,
  getAvailableCategories,
  getCategoryLabel,
  LEVEL_OPTIONS,
  loadSettings,
  saveSettingsAndWordPool,
} from "../store/storage";
import { AppSettings } from "../types";

const WORD_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function SettingsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userLevel, setUserLevel] = useState(DEFAULT_SETTINGS.userLevel);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [widgetWordCount, setWidgetWordCount] = useState(
    DEFAULT_SETTINGS.widgetWordCount,
  );
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const categories = getAvailableCategories();
    setAvailableCategories(categories);

    void loadSettings().then((settings) => {
      if (settings) {
        setUserLevel(settings.userLevel ?? DEFAULT_SETTINGS.userLevel);
        setSelectedCategories(settings.selectedCategories ?? []);
        setWidgetWordCount(
          settings.widgetWordCount ?? DEFAULT_SETTINGS.widgetWordCount,
        );
      }
    });
  }, []);

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    const wordPool = generateWordPool(
      userLevel,
      selectedCategories,
      widgetWordCount,
    );
    const nextSettings: AppSettings = {
      userLevel,
      selectedCategories,
      widgetWordCount,
      hasCompletedOnboarding: true,
      currentWordPool: wordPool,
    };

    await saveSettingsAndWordPool(nextSettings, wordPool);
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Update your preferences</Text>
      <Text style={styles.subtitle}>
        Changes here regenerate your widget word pool and save the new
        selection.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skill level</Text>
        <View style={styles.optionRow}>
          {LEVEL_OPTIONS.map((levelOption) => {
            const isSelected = userLevel === levelOption.maxLevel;
            return (
              <Pressable
                key={levelOption.id}
                style={[
                  styles.optionChip,
                  isSelected && styles.optionChipSelected,
                ]}
                onPress={() => setUserLevel(levelOption.maxLevel)}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {levelOption.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Topics</Text>
        <View style={styles.optionRowWrap}>
          {availableCategories.map((category) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <Pressable
                key={category}
                style={[
                  styles.optionChip,
                  isSelected && styles.optionChipSelected,
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {getCategoryLabel(category)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Widget word count</Text>
        <View style={styles.optionRowWrap}>
          {WORD_COUNT_OPTIONS.map((count) => {
            const isSelected = count === widgetWordCount;
            return (
              <Pressable
                key={count}
                style={[
                  styles.optionChip,
                  isSelected && styles.optionChipSelected,
                ]}
                onPress={() => setWidgetWordCount(count)}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        style={styles.saveButton}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save changes</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: "#d0d7de",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipSelected: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  optionText: {
    color: "#1f2937",
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#fff",
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
