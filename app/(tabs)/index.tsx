"use client";
import HouseCard from "@/components/house-card";
import { Text } from "@/components/text";
import { ThemedView } from "@/components/themed-view";
import { IP } from "@/constants/config";
import { useAuth } from "@/context/auth-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { User, getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
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

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rent, setRent] = useState("");
  const [bed, setBed] = useState("");
  const [bath, setBath] = useState("");
  const [images, setImages] = useState<string[]>([]); // store multiple URIs
  const [currentIndex, setCurrentIndex] = useState(0);

  const [listings, setListings] = useState<Listing[]>([]);

  const [mapRegion, setMapRegion] = useState<any>(null);
  const [selectedCoords, setSelectedCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [location, setLocation] = useState<string>("");

  const auth = getAuth();
  const inputBackground = useThemeColor({}, "inputBackground");
  const inputBorder = useThemeColor({}, "inputBorder");
  const inputText = useThemeColor({}, "inputText");
  const inputPlaceholder = useThemeColor({}, "inputPlaceholder");
  const primaryButton = useThemeColor({}, "primaryButton");
  const primaryButtonText = useThemeColor({}, "primaryButtonText");

  const { role } = useAuth();
  const isBroker = role === "broker";

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setMapRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  // Fetch the user and ID token
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    currentUser.getIdToken().then((token) => {
      setUser(currentUser);
      setIdToken(token);
      setIsLoading(false);

      // Register broker if needed
      if (isBroker) {
        fetch(`http://${IP}:3000/brokers/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: currentUser.displayName,
          }),
        });
      }
    });
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      const res = await fetch(`http://${IP}:3000/listings`);
      const data = await res.json();
      setListings(data);
    };

    fetchListings();
  }, []);

  if (isLoading) return null;

  if (!user) return null;

  async function submitListing() {
    const formData = new FormData();
    if (!selectedCoords) {
      alert("Please select a location on the map");
      return;
    }
    const listingRes: Response = await fetch(`http://${IP}:3000/listing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        title: title,
        description: description,
        location: location,
        rent: Number(rent),
        bed: Number(bed),
        bath: Number(bath),
        latitude: Number(selectedCoords.latitude),
        longitude: Number(selectedCoords.longitude),
      }),
    });
    try {
      if (!listingRes.ok) {
        const errorText = await listingRes.text();
        throw new Error(
          `Failed to create listing: ${listingRes.status} - ${errorText}`,
        );
      }

      const listing: Listing = await listingRes.json();

      formData.append("listingId", listing.id.toString());

      images.forEach((uri, index) => {
        formData.append("photos", {
          uri,
          name: `photo${index}.jpg`,
          type: "image/jpeg",
        } as any);
      });

      const uploadRes = await fetch(`http://${IP}:3000/upload-multiple`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      console.log("Images uploaded successfully");
    } catch (err) {
      console.error("Upload failed:", err);
    }
  }
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Limit to 5 images
      const selected = result.assets.slice(0, 5).map((asset) => asset.uri);
      setImages(selected);
      setCurrentIndex(0);
    }
  };

  // Arrow navigation handlers
  const nextImage = () => {
    if (images.length > 0)
      setCurrentIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = () => {
    if (images.length > 0)
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {isBroker ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.title}>Add a new listing</Text>
            <View style={styles.form}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBackground,
                    borderColor: inputBorder,
                    color: inputText,
                  },
                ]}
                placeholder="Cozy 2BHK near city center"
                placeholderTextColor={inputPlaceholder}
                onChangeText={setTitle}
              />
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  {
                    backgroundColor: inputBackground,
                    borderColor: inputBorder,
                    color: inputText,
                  },
                ]}
                placeholder="Describe the property"
                placeholderTextColor={inputPlaceholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onChangeText={setDescription}
              />
              <Text style={styles.label}>Monthly rent (USD)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2200"
                placeholderTextColor={inputPlaceholder}
                keyboardType="numeric"
                onChangeText={setRent}
              />
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Beds</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 2"
                    placeholderTextColor={inputPlaceholder}
                    keyboardType="numeric"
                    onChangeText={setBed}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Baths</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 1"
                    placeholderTextColor={inputPlaceholder}
                    keyboardType="numeric"
                    onChangeText={setBath}
                  />
                </View>
              </View>
              <Text style={styles.label}>Image</Text>
              <View style={styles.ImageContainer}>
                <Button title="Pick Images" onPress={pickImages} />

                {images.length > 0 && (
                  <View style={styles.carouselContainer}>
                    <TouchableOpacity onPress={prevImage} style={styles.arrow}>
                      <Text style={styles.arrowText}>&lt;</Text>
                    </TouchableOpacity>

                    <Image
                      source={{ uri: images[currentIndex] }}
                      style={styles.image}
                    />

                    <TouchableOpacity onPress={nextImage} style={styles.arrow}>
                      <Text style={styles.arrowText}>&gt;</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text>
                  {images.length > 0
                    ? `Image ${currentIndex + 1} of ${images.length}`
                    : "No images selected"}
                </Text>
              </View>
              <Text style={styles.label}>Select location on map</Text>
              {location !== "" && (
                <Text style={styles.locationPreview}>
                  You selected: {location}
                </Text>
              )}
              <View style={styles.mapContainer}>
                {mapRegion && (
                  <MapView
                    style={styles.map}
                    initialRegion={mapRegion}
                    onPress={async (e) => {
                      const { latitude, longitude } = e.nativeEvent.coordinate;
                      setSelectedCoords({ latitude, longitude });

                      const places = await Location.reverseGeocodeAsync({
                        latitude,
                        longitude,
                      });

                      if (places.length > 0) {
                        const place = places[0];

                        const readable = [
                          place.name,
                          place.street,
                          place.city,
                          place.region,
                        ]
                          .filter(Boolean)
                          .join(", ");

                        setLocation(readable);
                      }
                    }}
                  >
                    {selectedCoords && <Marker coordinate={selectedCoords} />}
                  </MapView>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: primaryButton },
                ]}
                onPress={submitListing}
              >
                <Text
                  style={[
                    styles.submitButtonText,
                    { color: primaryButtonText },
                  ]}
                >
                  Save listing
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.title}>Available Rentals</Text>
            {listings.map((listing) => (
              <HouseCard
                key={listing.id}
                id={listing.id}
                image={listing.images.map((img) => `http://${IP}:3000${img}`)}
                name={listing.title}
                description={listing.description}
                location={listing.location}
                monthlyRent={listing.rent}
                beds={listing.beds}
                baths={listing.baths}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  title: { fontSize: 28, fontWeight: "bold", padding: 20, textAlign: "center" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  form: { gap: 12, paddingTop: 8 },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  multilineInput: { minHeight: 100 },
  submitButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  submitButtonText: { fontSize: 16, fontWeight: "600" },
  row: { flexDirection: "row", gap: 12 },
  rowItem: { flex: 1 },

  ImageContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  carouselContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  image: {
    width: 250,
    height: 250,
    marginVertical: 10,
    borderRadius: 10,
  },
  arrow: {
    padding: 10,
    backgroundColor: "black",
    borderRadius: 10,
  },
  arrowText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
  },
  map: {
    flex: 1,
  },
  locationPreview: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
});
