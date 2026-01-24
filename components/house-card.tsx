import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { Text } from "@/components/text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

export type HouseCardProps = {
  id: number;
  image: string[];
  name: string;
  description: string;
  location: string;
  monthlyRent: number;
  beds: number;
  baths: number;
  onPress?: () => void;
};

export default function HouseCard({
  id,
  image,
  name,
  description,
  location,
  monthlyRent,
  beds,
  baths,
  onPress,
}: HouseCardProps) {
  const cardBackground = useThemeColor({}, "cardBackground");
  const cardBorder = useThemeColor({}, "cardBorder");
  const secondaryText = useThemeColor({}, "secondaryText");
  const iconColor = useThemeColor({}, "icon");
  const primaryButton = useThemeColor({}, "primaryButton");
  const [index, setIndex] = useState(0);

  const hasImages = image.length > 0;
  const imageUri = hasImages ? image[index] : undefined;
  const next = () => setIndex((prev) => (prev + 1) % image.length);
  const prev = () =>
    setIndex((prev) => (prev - 1 + image.length) % image.length);
  const router = useRouter();

  const CardContent = (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/listing/[id]",
          params: { id: id.toString() },
        } as any)
      }
    >
      <ThemedView
        style={[
          styles.card,
          { backgroundColor: cardBackground, borderColor: cardBorder },
        ]}
      >
        {/* Image carousel */}
        <View>
          <Image
            source={
              imageUri ? { uri: imageUri } : require("@/assets/images/icon.png")
            }
            style={styles.image}
            contentFit="cover"
          />

          {image.length > 1 && (
            <>
              <TouchableOpacity style={styles.left} onPress={prev}>
                <Text style={styles.arrow}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.right} onPress={next}>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.rent, { color: primaryButton }]}>
              ₹{monthlyRent.toLocaleString()}/mo
            </Text>
          </View>

          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={16} color={iconColor} />
            <Text style={[styles.location, { color: secondaryText }]}>
              {location}
            </Text>
          </View>

          <Text
            style={[styles.description, { color: secondaryText }]}
            numberOfLines={2}
          >
            {description}
          </Text>

          <View style={styles.features}>
            <Text>{beds} beds</Text>
            <Text>{baths} baths</Text>
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 3,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  image: {
    width: "100%",
    height: 300,
    backgroundColor: "#e5e7eb",
  },
  content: {
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
  },
  rent: {
    fontSize: 18,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    flex: 1,
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  features: {
    flexDirection: "row",
    gap: 20,
    marginTop: 8,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureText: {
    fontSize: 14,
  },
  left: {
    position: "absolute",
    left: 10,
    top: "45%",
  },
  right: {
    position: "absolute",
    right: 10,
    top: "45%",
  },
  arrow: {
    fontSize: 32,
    color: "white",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    borderRadius: 20,
  },
});
