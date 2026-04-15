"use client";
import { IP } from "@/constants/config";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

type Listing = {
  id: number;
  broker_id: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  rent: number;
  beds: number;
  baths: number;
  images: string[];
};

type Broker = {
  id: string;
  name: string;
  email: string;
};

const { width } = Dimensions.get("window");

export default function ListingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [broker, setBroker] = useState<Broker | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!id) return;
    const fetchListing = async () => {
      try {
        const res = await fetch(`http://${IP}/listings`);
        const data: Listing[] = await res.json();
        const found = data.find((l) => l.id.toString() === id);
        if (found) setListing(found);
      } catch (err) {
        console.error(err);
      }
    };
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (!listing?.broker_id) return;
    const fetchBroker = async () => {
      const res = await fetch(`http://${IP}/brokers/register`);
      const data: Broker[] = await res.json();
      const found = data.find((b) => b.id === listing?.broker_id);
      if (found) setBroker(found);
    };
    fetchBroker();
  }, [listing?.broker_id]);

  const handleChatPress = async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch(`http://${IP}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        broker_uid: listing?.broker_id,
        listing_id: listing?.id,
      }),
    });
    const data = await response.json();
    router.push({
      pathname: "/(tabs)/inbox",
      params: { conversationId: data.id },
    });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveImage(index);
  };

  if (!listing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View>
          <FlatList
            data={listing.images}
            keyExtractor={(_, i) => i.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <Image
                source={{ uri: `http://${IP}${item}` }}
                style={styles.carouselImage}
              />
            )}
          />
          {listing.images.length > 1 && (
            <View style={styles.dotRow}>
              {listing.images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeImage && styles.dotActive]}
                />
              ))}
            </View>
          )}
          <View style={styles.counterPill}>
            <Text style={styles.counterText}>
              {activeImage + 1} / {listing.images.length}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{listing.title}</Text>
            <View style={styles.priceBadge}>
              <Text style={styles.priceAmount}>
                ₹{listing.rent.toLocaleString()}
              </Text>
              <Text style={styles.priceUnit}>/mo</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={16} color="#FF5A5F" />
            <Text style={styles.locationText}>{listing.location}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="bed" size={22} color="#333" />
              <Text style={styles.statValue}>{listing.beds}</Text>
              <Text style={styles.statLabel}>Beds</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="shower" size={22} color="#333" />
              <Text style={styles.statValue}>{listing.baths}</Text>
              <Text style={styles.statLabel}>Baths</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="attach-money" size={22} color="#333" />
              <Text style={styles.statValue}>
                ₹{listing.rent.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Per month</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this place</Text>
          <Text style={styles.description}>{listing.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.locationSubtext}>{listing.location}</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: listing.latitude || 0,
                longitude: listing.longitude || 0,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: listing.latitude || 0,
                  longitude: listing.longitude || 0,
                }}
              />
            </MapView>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Listed by</Text>
          <View style={styles.brokerCard}>
            <View style={styles.brokerAvatar}>
              <Text style={styles.brokerAvatarText}>
                {broker?.name?.[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <View style={styles.brokerInfo}>
              <Text style={styles.brokerName}>{broker?.name ?? "Unknown"}</Text>
              <Text style={styles.brokerEmail}>{broker?.email ?? ""}</Text>
            </View>
          </View>

          <View style={{ height: 90 }} />
        </View>
      </ScrollView>

      <View style={styles.stickyBar}>
        <View style={styles.stickyPrice}>
          <Text style={styles.stickyPriceAmount}>
            ₹{listing.rent.toLocaleString()}
          </Text>
          <Text style={styles.stickyPriceLabel}> / month</Text>
        </View>
        <TouchableOpacity style={styles.chatButton} onPress={handleChatPress}>
          <MaterialIcons
            name="chat"
            size={18}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.chatButtonText}>Chat with broker</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 16, color: "#888" },

  carouselImage: {
    width,
    height: 280,
    resizeMode: "cover",
    backgroundColor: "#eee",
  },
  dotRow: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 18,
  },
  counterPill: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  counterText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    lineHeight: 28,
  },
  priceBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "#f0f9f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  priceAmount: { fontSize: 18, fontWeight: "800", color: "#2a7d2e" },
  priceUnit: { fontSize: 12, color: "#2a7d2e", fontWeight: "500" },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  locationText: { fontSize: 14, color: "#666", flex: 1 },

  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 20 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 14,
    paddingVertical: 16,
  },
  statItem: { alignItems: "center", gap: 4, flex: 1 },
  statValue: { fontSize: 16, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 12, color: "#888", fontWeight: "500" },
  statDivider: { width: 1, height: 36, backgroundColor: "#e8e8e8" },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
  },
  description: { fontSize: 15, color: "#555", lineHeight: 23 },

  locationSubtext: { fontSize: 13, color: "#888", marginBottom: 12 },
  mapContainer: { height: 200, borderRadius: 14, overflow: "hidden" },
  map: { flex: 1 },

  brokerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fafafa",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  brokerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  brokerAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  brokerInfo: { flex: 1 },
  brokerName: { fontSize: 15, fontWeight: "700", color: "#111" },
  brokerEmail: { fontSize: 13, color: "#888", marginTop: 2 },

  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 24,
  },
  stickyPrice: { flexDirection: "row", alignItems: "baseline" },
  stickyPriceAmount: { fontSize: 20, fontWeight: "800", color: "#111" },
  stickyPriceLabel: { fontSize: 13, color: "#888" },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
  },
  chatButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
