import { IP } from "@/constants/config";
import { useAuth } from "@/context/auth-context";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Conversation = {
  id: string;
  user_uid: string;
  broker_uid: string;
  listing_id: string;
};

export default function Inbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user, role } = useAuth();
  const isBroker = role === "broker";

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
  }, [user, isBroker]);

  const chatBox = (id: string) => {
    router.push({
      pathname: "/chat",
      params: { conversationId: id },
    });
  };

  {
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

                return (
                  <TouchableOpacity onPress={() => chatBox(item.id)}>
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
                      <View
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: "#007AFF",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 14,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "bold",
                            fontSize: 16,
                          }}
                        >
                          {otherUid?.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      {/* Text Content */}
                      <View style={{ flex: 1 }}>
                        {/* Listing */}
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            marginBottom: 4,
                          }}
                          numberOfLines={1}
                        >
                          Listing #{item.listing_id}
                        </Text>

                        {/* Participants */}
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#666",
                          }}
                          numberOfLines={1}
                        >
                          User: {item.user_uid.slice(0, 8)}...
                        </Text>

                        <Text
                          style={{
                            fontSize: 14,
                            color: "#666",
                          }}
                          numberOfLines={1}
                        >
                          Broker: {item.broker_uid.slice(0, 8)}...
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
}
