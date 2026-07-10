import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Speech from "expo-speech";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { getWordById } from "../store/storage";
import { Word } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "WordDetail">;

export default function WordDetailScreen({ route }: Props) {
  const { id } = route.params;
  const [word, setWord] = useState<Word | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const foundWord = getWordById(id);
    if (foundWord) {
      setWord(foundWord);
    } else {
      Alert.alert("Error", "Word not found");
    }
  }, [id]);

  const handlePlayPronunciation = async () => {
    if (!word) return;

    try {
      setIsPlaying(true);
      // Use Chinese language for proper pronunciation
      await Speech.speak(word.hanzi, {
        language: "zh-CN",
        pitch: 1.0,
        rate: 0.8,
      });
    } catch (error) {
      Alert.alert("Error", "Could not play pronunciation");
      console.error("Speech error:", error);
    } finally {
      setIsPlaying(false);
    }
  };

  if (!word) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Hanzi */}
        <View style={styles.hanziSection}>
          <Text style={styles.hanzi}>{word.hanzi}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pinyin</Text>
            <Text style={styles.detailValue}>{word.pinyin}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Translation</Text>
            <Text style={styles.detailValue}>{word.translation}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Level</Text>
            <Text style={styles.detailValue}>HSK {word.level}</Text>
          </View>

          {word.categories.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Topics</Text>
              <View style={styles.categoryTags}>
                {word.categories.map((category) => (
                  <View key={category} style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{category}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Play Button */}
        <Pressable
          style={[styles.playButton, isPlaying && styles.playButtonDisabled]}
          onPress={handlePlayPronunciation}
          disabled={isPlaying}
        >
          {isPlaying ? (
            <>
              <ActivityIndicator
                color="#fff"
                size="small"
                style={styles.spinnerMargin}
              />
              <Text style={styles.playButtonText}>Playing...</Text>
            </>
          ) : (
            <Text style={styles.playButtonText}>▶ Play pronunciation</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  hanziSection: {
    marginBottom: 40,
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    padding: 32,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  hanzi: {
    fontSize: 60,
    fontWeight: "700",
  },
  detailsSection: {
    width: "100%",
    marginBottom: 40,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 20,
  },
  detailRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  detailRow_last: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  categoryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryTag: {
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryTagText: {
    fontSize: 12,
    color: "#1e40af",
    fontWeight: "500",
  },
  playButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 50,
  },
  playButtonDisabled: {
    opacity: 0.7,
  },
  spinnerMargin: {
    marginRight: 8,
  },
  playButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
