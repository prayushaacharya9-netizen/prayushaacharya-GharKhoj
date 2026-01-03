"use client";
import HouseCard from "@/components/house-card";
import { Text } from "@/components/text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/auth-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as ImagePicker from "expo-image-picker";
import { Redirect } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";

interface ListingResponse {
  id: number; // Primary key of the listing
  broker_id: string; // Foreign key to broker
  title: string;
  description: string;
  location: string;
  rent: number;
  beds: number;
  baths: number;
  created_at: string; // Timestamp string from PostgreSQL
}

type Listing = {
  id: number;
  title: string;
  description: string;
  location: string;
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
  const [location, setLocation] = useState("");
  const [rent, setRent] = useState("");
  const [bed, setBed] = useState("");
  const [bath, setBath] = useState("");
  const [images, setImages] = useState<string[]>([]); // store multiple URIs
  const [currentIndex, setCurrentIndex] = useState(0);

  const [listings, setListings] = useState<Listing[]>([]);

  const auth = getAuth();
  const inputBackground = useThemeColor({}, "inputBackground");
  const inputBorder = useThemeColor({}, "inputBorder");
  const inputText = useThemeColor({}, "inputText");
  const inputPlaceholder = useThemeColor({}, "inputPlaceholder");
  const primaryButton = useThemeColor({}, "primaryButton");
  const primaryButtonText = useThemeColor({}, "primaryButtonText");

  const { role } = useAuth();
  const isBroker = role === "broker";

  const formData = new FormData();

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
        fetch("http://192.168.0.48:3000/brokers/register", {
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
      const res = await fetch(`http://192.168.0.48:3000/listings`);
      const data = await res.json();
      setListings(data);
    };

    fetchListings();
  }, []);

  if (isLoading) return null;

  if (!user) return <Redirect href="/" />;

  async function submitListing() {
    const listingRes: Response = await fetch(
      "http://192.168.0.48:3000/listing",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: title,
          description: description,
          location: location,
          rent: rent,
          bed: bed,
          bath: bath,
        }),
      }
    );
    try {
      if (!listingRes.ok) {
        throw new Error(`Failed to create listing: ${listingRes.statusText}`);
      }

      const listing: ListingResponse = await listingRes.json();

      formData.append("listingId", listing.id.toString());

      images.forEach((uri, index) => {
        formData.append("photos", {
          uri,
          name: `photo${index}.jpg`,
          type: "image/jpeg",
        } as any);
      });

      const uploadRes = await fetch(
        "http://192.168.0.48:3000/upload-multiple",
        {
          method: "POST",
          body: formData,
        }
      );

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
              <Text style={styles.label}>Location</Text>{" "}
              <TextInput
                style={styles.input}
                placeholder="Neighborhood, city"
                placeholderTextColor={inputPlaceholder}
                onChangeText={setLocation}
              />{" "}
              <Text style={styles.label}>Monthly rent (USD)</Text>{" "}
              <TextInput
                style={styles.input}
                placeholder="e.g. 2200"
                placeholderTextColor={inputPlaceholder}
                keyboardType="numeric"
                onChangeText={setRent}
              />{" "}
              <View style={styles.row}>
                {" "}
                <View style={styles.rowItem}>
                  {" "}
                  <Text style={styles.label}>Beds</Text>{" "}
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 2"
                    placeholderTextColor={inputPlaceholder}
                    keyboardType="numeric"
                    onChangeText={setBed}
                  />{" "}
                </View>{" "}
                <View style={styles.rowItem}>
                  {" "}
                  <Text style={styles.label}>Baths</Text>{" "}
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 1"
                    placeholderTextColor={inputPlaceholder}
                    keyboardType="numeric"
                    onChangeText={setBath}
                  />{" "}
                </View>{" "}
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
                image={listing.images.map(
                  (img) => `http://192.168.0.48:3000${img}`
                )}
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
});
