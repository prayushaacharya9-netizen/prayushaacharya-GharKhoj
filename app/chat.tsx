import { IP } from "@/constants/config";
import { useAuth } from "@/context/auth-context";
import { useLocalSearchParams } from "expo-router";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Message = {
  id: string;
  conversation_id: string;
  sender_uid: string;
  text: string;
  created_at: string;
};

export default function ChatScreen() {
  const { conversationId, name, uri, title } = useLocalSearchParams<{
    conversationId: string;
    name: string;
    uri: string;
    title: string;
  }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const auth = getAuth();

  const { role } = useAuth();
  const isBroker = role === "broker";

  const sendMessage = async () => {
    if (!input.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    const res = await fetch(`https://${IP}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        text: input,
        is_broker: isBroker,
      }),
    });

    const newMessage = await res.json();

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  useEffect(() => {
    if (!conversationId) return;

    let interval: number;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`https://${IP}/messages/${conversationId}`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.log("Failed to load messages:", err);
      }
    };

    // Initial fetch
    fetchMessages();

    // Poll every 3 seconds
    interval = setInterval(fetchMessages, 3000);

    // Cleanup when leaving screen
    return () => clearInterval(interval);
  }, [conversationId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <View
          style={{
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 12,
            backgroundColor: "white",
            borderBottomWidth: 1,
            borderColor: "#eee",
          }}
        >
          <Text style={{ fontWeight: "600", fontSize: 16 }}>{title}</Text>
          <Image
            source={uri ? { uri: uri } : require("@/assets/images/icon.png")}
            style={{
              width: 70,
              height: 70,
              borderRadius: 25,
              margin: 10,
              marginRight: 10,
            }}
          />

          <Text style={{ color: "#666", fontSize: 13 }}>
            Chatting with: {name}
          </Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item, index) => item?.id ?? index.toString()}
          contentContainerStyle={{ padding: 12 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => {
            const currentUid = auth.currentUser?.uid;
            const isMine = item.sender_uid === currentUid;

            return (
              <View
                style={{
                  marginBottom: 10,
                  alignItems: isMine ? "flex-end" : "flex-start",
                }}
              >
                <View
                  style={{
                    backgroundColor: isMine ? "#007AFF" : "white",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    maxWidth: "75%",
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Text
                    style={{ color: isMine ? "white" : "black", fontSize: 15 }}
                  >
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
        />
        <View
          style={{
            flexDirection: "row",
            padding: 10,
            backgroundColor: "white",
            borderTopWidth: 1,
            borderColor: "#eee",
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            style={{
              flex: 1,
              backgroundColor: "#f2f2f2",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginRight: 8,
              fontSize: 15,
            }}
          />

          <View
            style={{
              backgroundColor: "#007AFF",
              borderRadius: 20,
              paddingHorizontal: 16,
              justifyContent: "center",
            }}
          >
            <Text
              onPress={sendMessage}
              style={{ color: "white", fontWeight: "600" }}
            >
              Send
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
