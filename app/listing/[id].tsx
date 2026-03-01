"use client";
import { IP } from "@/constants/config";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
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

export default function ListingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [broker, setBroker] = useState<Broker | null>(null);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      try {
        const res = await fetch(`http://${IP}:3000/listings`);
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
      const res = await fetch(`http://${IP}:3000/brokers/register`);
      const data: Broker[] = await res.json();
      const found = data.find((b) => b.id === listing?.broker_id);
      if (found) setBroker(found);
    };
    fetchBroker();
  }, [listing?.broker_id]);

  const handleChatPress = async () => {
    if (!user) return;

    const token = await user.getIdToken();

    const response = await fetch(`http://${IP}:3000/conversations`, {
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
      pathname: "/chat",
      params: { conversationId: data.id },
    });
  };

  if (!listing) return <Text style={styles.loading}>Loading...</Text>;
  console.log(listing.latitude, listing.longitude);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.brokerCard}>
          <Text style={styles.brokerName}>
            Posted by: {broker?.name || "Unknown"}
          </Text>
          <Text style={styles.chatButton} onPress={handleChatPress}>
            Chat with broker
          </Text>
        </View>
        <Text style={styles.title}>{listing.title}</Text>
        {listing.images.map((img, index) => (
          <Image
            key={index}
            source={{ uri: `http://${IP}:3000${img}` }}
            style={styles.image}
          />
        ))}
        <View style={styles.content}>
          <Text style={{ fontSize: 20, marginBottom: 5 }}>Description</Text>
          <Text
            style={{
              fontSize: 15,
              padding: 2,
              borderWidth: 2,
              borderRadius: 4,
              marginBottom: 8,
            }}
          >
            {listing.description}
          </Text>
          <Text style={styles.details}>
            {listing.beds} beds{" "}
            <MaterialIcons name="bed" size={16} color={"black"} />
          </Text>
          <Text style={styles.details}>
            <Text style={styles.details}>
              {listing.baths} baths{" "}
              <MaterialIcons name="shower" size={16} color={"black"} />
            </Text>
          </Text>
          <Text style={styles.details}>Rent: ${listing.rent}/month</Text>
          <Text style={{ fontSize: 15, fontWeight: "bold" }}>Located on</Text>
          <Text>
            <MaterialIcons name="location-on" size={16} color={"black"} />{" "}
            {listing.location}
          </Text>
        </View>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: listing.latitude || 0,
              longitude: listing.longitude || 0,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: listing.latitude || 0,
                longitude: listing.longitude || 0,
              }}
            />
          </MapView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, textAlign: "center", marginTop: 50 },
  image: {
    width: "90%",
    height: 300,
    alignSelf: "center",
    marginVertical: 10,
    borderRadius: 4,
    borderWidth: 2,
  },
  content: { padding: 16, flexDirection: "column", gap: 8 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  desc: { fontSize: 16, marginVertical: 8 },
  details: { fontSize: 16, fontWeight: "500" },
  location: { fontSize: 14, color: "#555", marginTop: 4 },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: { flex: 1 },
  brokerCard: {
    flexDirection: "row", // align items in a row
    justifyContent: "space-between", // space between name and button
    alignItems: "center", // vertically center
    backgroundColor: "#f0f0f0",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  brokerName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },

  chatButton: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#007bff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#e6f0ff",
    borderRadius: 6,
    textAlign: "center",
  },
});
