import { IP } from "@/constants/config";
import { useAuth } from "@/context/auth-context";
import { useIsFocused } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Conversation = {
  id: string;
  user_uid: string;
  broker_uid: string;
  listing_id: string;
};

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

type User = {
  id: string;
  name: string;
  email: string;
};

export default function Inbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [broker, setBroker] = useState<Broker[]>([]);
  const [l_user, setL_users] = useState<User[]>([]);

  const { user, role } = useAuth();
  const isBroker = role === "broker";

  const isFocused = useIsFocused();
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const endpoint = isBroker
          ? `http://${IP}:3000/conversations/broker/${user.uid}`
          : `http://${IP}:3000/conversations/user/${user.uid}`;

        const res = await fetch(endpoint);
        const data: Conversation[] = await res.json();
        setConversations(data);
      } catch (err) {
        console.log("Failed to load conversations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user, isBroker, isFocused]);

  useEffect(() => {
    const fetchListings = async () => {
      const res = await fetch(`http://${IP}:3000/listings`);
      const data = await res.json();
      setListings(data);
    };

    fetchListings();
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      const res = await fetch(`http://${IP}:3000/brokers/register`);
      const data = await res.json();
      setBroker(data);
    };

    fetchListings();
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      const res = await fetch(`http://${IP}:3000/users/register`);
      const data = await res.json();
      setL_users(data);
    };

    fetchListings();
  }, []);

  useEffect(() => {
    if (
      !conversationId ||
      conversations.length === 0 ||
      hasAutoOpened ||
      listings.length === 0 ||
      broker.length === 0 ||
      l_user.length === 0
    ) {
      return;
    }

    const target = conversations.find((c) => c.id === conversationId);
    if (!target) return;

    const listing = listings.find((l) => l.id === Number(target.listing_id));
    const ListImage = listing ? `http://${IP}:3000${listing.images[0]}` : null;

    const broker_list = broker.find((b) => b.id === target.broker_uid);
    const user_list = l_user.find((u) => u.id === target.user_uid);

    const name = isBroker
      ? user_list
        ? user_list.name
        : ""
      : broker_list
        ? broker_list.name
        : "";

    chatBox(target.id, name, ListImage || "", listing ? listing.title : "");
    setHasAutoOpened(true);
  }, [conversationId, conversations, listings, broker, l_user, hasAutoOpened]);

  const chatBox = (id: string, name: string, uri: string, title: string) => {
    router.push({
      pathname: "/chat",
      params: { conversationId: id, name: name, uri: uri, title: title },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
          Inbox
        </Text>

        {isLoading ? (
          <Text>Loading conversations...</Text>
        ) : conversations.length === 0 ? (
          <Text>No conversations yet.</Text>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const otherUid = isBroker ? item.user_uid : item.broker_uid;
              const listing = listings.find(
                (l) => l.id === Number(item.listing_id),
              );
              const ListImage = listing
                ? `http://${IP}:3000${listing.images[0]}`
                : null;

              const broker_list = broker.find((b) => b.id === item.broker_uid);

              const user_list = l_user.find((u) => u.id === item.user_uid);
              return (
                <TouchableOpacity
                  onPress={() =>
                    chatBox(
                      item.id,
                      isBroker
                        ? user_list
                          ? user_list.name
                          : ""
                        : broker_list
                          ? broker_list.name
                          : "",
                      ListImage ? ListImage : "",
                      listing ? listing.title : "",
                    )
                  }
                >
                  <View
                    style={{
                      flexDirection: "row",
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      borderBottomWidth: 1,
                      borderColor: "#f0f0f0",
                      alignItems: "center",
                      backgroundColor: "white",
                    }}
                  >
                    {/* Avatar */}
                    <Image
                      source={
                        ListImage
                          ? { uri: ListImage }
                          : require("@/assets/images/icon.png")
                      }
                      style={{
                        width: 90,
                        height: 90,
                        borderRadius: 8,
                        marginRight: 12,
                      }}
                    />

                    {/* Text Content */}
                    <View style={{ flex: 1 }}>
                      {/* Listing */}
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          marginBottom: 4,
                        }}
                        numberOfLines={2}
                      >
                        Listing #{item.listing_id} :{" "}
                        {listing ? listing.title : null}
                      </Text>

                      {/* Participants */}
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#666",
                        }}
                        numberOfLines={1}
                      >
                        User: {user_list ? user_list.name : null}
                      </Text>

                      <Text
                        style={{
                          fontSize: 14,
                          color: "#666",
                        }}
                        numberOfLines={1}
                      >
                        Broker: {broker_list ? broker_list.name : null}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
