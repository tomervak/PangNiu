import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getWordsByIds, loadCurrentWordPool } from "../store/storage";
import { Word } from "../types";

export default function WordListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    void loadCurrentWordPool().then((ids) => {
      if (ids?.length) {
        setWords(getWordsByIds(ids));
      }
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Current word pool</Text>
        <Pressable onPress={() => navigation.navigate("Settings")}>
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
      </View>

      {words.length === 0 ? (
        <Text style={styles.emptyState}>
          No words are saved yet. Finish onboarding or update your settings to
          generate a pool.
        </Text>
      ) : (
        words.map((word) => (
          <Pressable
            key={word.id}
            style={styles.wordCard}
            onPress={() => navigation.navigate("WordDetail", { id: word.id })}
          >
            <Text style={styles.hanzi}>{word.hanzi}</Text>
            <Text style={styles.pinyin}>{word.pinyin}</Text>
            <Text style={styles.translation}>{word.translation}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 20,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  settingsText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  emptyState: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  wordCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 12,
  },
  hanzi: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  pinyin: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
  },
  translation: {
    fontSize: 14,
    color: "#111827",
  },
});
