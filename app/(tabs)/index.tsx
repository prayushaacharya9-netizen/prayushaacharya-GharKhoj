"use client";
import HouseCard from "@/components/house-card";
import usePushNotifications from "@/components/notificationToken";
import { Text } from "@/components/text";
import { ThemedView } from "@/components/themed-view";
import { IP } from "@/constants/config";
import { useAuth } from "@/context/auth-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { User, getAuth } from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
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

// Filter feature function definition starts here

const BED_OPTIONS = ["Any", "1", "2", "3", "4+"];
const BATH_OPTIONS = ["Any", "1", "2", "3+"];

function FilterPanel({
  visible,
  minRent,
  maxRent,
  beds,
  baths,
  onMinRent,
  onMaxRent,
  onBeds,
  onBaths,
  onReset,
}: {
  visible: boolean;
  minRent: string;
  maxRent: string;
  beds: string;
  baths: string;
  onMinRent: (v: string) => void;
  onMaxRent: (v: string) => void;
  onBeds: (v: string) => void;
  onBaths: (v: string) => void;
  onReset: () => void;
}) {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: visible ? 1 : 0,
        duration: 280,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: visible ? 1 : 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();
  }, [visible]);

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 320],
  });
  // return UI of the filter panel
  return (
    <Animated.View
      style={[styles.filterPanel, { maxHeight, opacity: opacityAnim }]}
    >
      {/* Price range */}
      <Text style={styles.filterLabel}>Price Range (NPR/mo)</Text>
      <View style={styles.priceRow}>
        <TextInput
          style={styles.priceInput}
          placeholder="Min"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={minRent}
          onChangeText={onMinRent}
        />
        <Text style={styles.priceDash}>–</Text>
        <TextInput
          style={styles.priceInput}
          placeholder="Max"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={maxRent}
          onChangeText={onMaxRent}
        />
      </View>

      {/* Beds */}
      <Text style={styles.filterLabel}>Bedrooms</Text>
      <View style={styles.pillRow}>
        {BED_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.pill, beds === opt && styles.pillActive]}
            onPress={() => onBeds(opt)}
          >
            <Text
              style={[styles.pillText, beds === opt && styles.pillTextActive]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Baths */}
      <Text style={styles.filterLabel}>Bathrooms</Text>
      <View style={styles.pillRow}>
        {BATH_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.pill, baths === opt && styles.pillActive]}
            onPress={() => onBaths(opt)}
          >
            <Text
              style={[styles.pillText, baths === opt && styles.pillTextActive]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={onReset}>
        <Text style={styles.resetText}>Reset filters</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Main Screen function definition starts here
export default function HomeScreen() {
  const notificationToken = usePushNotifications();
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rent, setRent] = useState("");
  const [bed, setBed] = useState("");
  const [bath, setBath] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [listings, setListings] = useState<Listing[]>([]);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [selectedCoords, setSelectedCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [location, setLocation] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [filterBeds, setFilterBeds] = useState("Any");
  const [filterBaths, setFilterBaths] = useState("Any");

  const auth = getAuth();
  const inputBackground = useThemeColor({}, "inputBackground");
  const inputBorder = useThemeColor({}, "inputBorder");
  const inputText = useThemeColor({}, "inputText");
  const inputPlaceholder = useThemeColor({}, "inputPlaceholder");
  const primaryButton = useThemeColor({}, "primaryButton");
  const primaryButtonText = useThemeColor({}, "primaryButtonText");

  const { role } = useAuth();
  const isBroker = role === "broker";

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (minRent) count++;
    if (maxRent) count++;
    if (filterBeds !== "Any") count++;
    if (filterBaths !== "Any") count++;
    return count;
  }, [minRent, maxRent, filterBeds, filterBaths]);

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const q = searchQuery.toLowerCase();
      if (q) {
        const matches =
          l.title.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.location?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // min price
      if (minRent && l.rent < Number(minRent)) return false;

      // max price
      if (maxRent && l.rent > Number(maxRent)) return false;

      // beds
      if (filterBeds !== "Any") {
        if (filterBeds === "4+") {
          if (l.beds < 4) return false;
        } else {
          if (l.beds !== Number(filterBeds)) return false;
        }
      }

      // baths
      if (filterBaths !== "Any") {
        if (filterBaths === "3+") {
          if (l.baths < 3) return false;
        } else {
          if (l.baths !== Number(filterBaths)) return false;
        }
      }

      return true;
    });
  }, [listings, searchQuery, minRent, maxRent, filterBeds, filterBaths]);

  const resetFilters = () => {
    setMinRent("");
    setMaxRent("");
    setFilterBeds("Any");
    setFilterBaths("Any");
  };

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

  useEffect(() => {
    if (!notificationToken) return;
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    currentUser.getIdToken().then((token) => {
      setUser(currentUser);
      setIdToken(token);
      setIsLoading(false);
      const endpoint = isBroker ? "brokers/register" : "users/register";
      fetch(`https://${IP}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: currentUser.displayName,
          token: notificationToken,
        }),
      });
    });
  }, [notificationToken]);

  useEffect(() => {
    const fetchListings = async () => {
      const res = await fetch(`https://${IP}/listings`);
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
    const listingRes: Response = await fetch(`https://${IP}/listing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        title,
        description,
        location,
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
      const uploadRes = await fetch(`https://${IP}/upload-multiple`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
    } catch (err) {
      console.error("Upload failed:", err);
    }
    alert("Listing created successfully");
    setTitle("");
    setDescription("");
    setRent("");
    setBed("");
    setBath("");
    setImages([]);
    setSelectedCoords(null);
    setLocation("");
  }

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      const selected = result.assets.slice(0, 5).map((asset) => asset.uri);
      setImages(selected);
      setCurrentIndex(0);
    }
  };

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
                value={title}
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
                value={description}
                onChangeText={setDescription}
              />
              <Text style={styles.label}>Monthly rent (NPR)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2200"
                placeholderTextColor={inputPlaceholder}
                keyboardType="numeric"
                value={rent}
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
                    value={bed}
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
                    value={bath}
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
          <View style={styles.tenantContainer}>
            <View style={styles.tenantHeader}>
              <Text style={styles.tenantTitle}>Find Your Home</Text>
              <Text style={styles.tenantSubtitle}>
                {filteredListings.length} of {listings.length} listings
              </Text>
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>⌕</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by title, location…"
                  placeholderTextColor="#aaa"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Text style={styles.clearIcon}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter button */}
              <TouchableOpacity
                style={[
                  styles.filterToggle,
                  showFilters && styles.filterToggleActive,
                ]}
                onPress={() => setShowFilters((v) => !v)}
              >
                <Text
                  style={[
                    styles.filterToggleText,
                    showFilters && styles.filterToggleTextActive,
                  ]}
                >
                  ⚙ Filters
                </Text>
                {activeFilterCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Collapsible filter panel */}
            <FilterPanel
              visible={showFilters}
              minRent={minRent}
              maxRent={maxRent}
              beds={filterBeds}
              baths={filterBaths}
              onMinRent={setMinRent}
              onMaxRent={setMaxRent}
              onBeds={setFilterBeds}
              onBaths={setFilterBaths}
              onReset={resetFilters}
            />

            {/* Results */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {filteredListings.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🏠</Text>
                  <Text style={styles.emptyTitle}>No listings found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try adjusting your search or filters
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");
                      resetFilters();
                    }}
                    style={styles.emptyButton}
                  >
                    <Text style={styles.emptyButtonText}>Clear all</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredListings.map((listing) => (
                  <HouseCard
                    key={listing.id}
                    id={listing.id}
                    image={listing.images.map((img) => `https://${IP}${img}`)}
                    name={listing.title}
                    description={listing.description}
                    location={listing.location}
                    monthlyRent={listing.rent}
                    beds={listing.beds}
                    baths={listing.baths}
                  />
                ))
              )}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // ── Broker styles (unchanged) ──
  title: { fontSize: 28, fontWeight: "bold", padding: 20, textAlign: "center" },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
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
  ImageContainer: { alignItems: "center", marginTop: 50 },
  carouselContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  image: { width: 250, height: 250, marginVertical: 10, borderRadius: 10 },
  arrow: { padding: 10, backgroundColor: "black", borderRadius: 10 },
  arrowText: { fontSize: 30, fontWeight: "bold", color: "white" },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
  },
  map: { flex: 1 },
  locationPreview: { marginTop: 8, fontSize: 14, color: "#666" },

  // ── Tenant styles ──
  tenantContainer: { flex: 1 },

  tenantHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  tenantTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  tenantSubtitle: { fontSize: 13, color: "#888", fontWeight: "500" },

  // Search bar
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 6,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 18, color: "#888" },
  searchInput: { flex: 1, fontSize: 15, color: "#111" },
  clearIcon: { fontSize: 13, color: "#999", paddingLeft: 4 },

  // Filter toggle button
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  filterToggleActive: {
    backgroundColor: "#111",
  },
  filterToggleText: { fontSize: 14, fontWeight: "600", color: "#333" },
  filterToggleTextActive: { color: "#fff" },
  badge: {
    backgroundColor: "#FF5A5F",
    borderRadius: 99,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, color: "#fff", fontWeight: "700" },

  // Filter panel
  filterPanel: {
    overflow: "hidden",
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#111",
    backgroundColor: "#fff",
  },
  priceDash: { fontSize: 16, color: "#aaa", fontWeight: "500" },

  pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  pillActive: { backgroundColor: "#111", borderColor: "#111" },
  pillText: { fontSize: 13, fontWeight: "600", color: "#555" },
  pillTextActive: { color: "#fff" },

  resetButton: { alignSelf: "flex-end", marginTop: 14, marginBottom: 12 },
  resetText: { fontSize: 13, color: "#FF5A5F", fontWeight: "600" },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#222" },
  emptySubtitle: { fontSize: 14, color: "#888" },
  emptyButton: {
    marginTop: 16,
    backgroundColor: "#111",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 99,
  },
  emptyButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
