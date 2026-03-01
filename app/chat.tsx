import { IP } from "@/constants/config";
import { useAuth } from "@/context/auth-context";
import { useLocalSearchParams } from "expo-router";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Button,
  FlatList,
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
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
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

    const res = await fetch(`http://${IP}:3000/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        text: input,
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
        const res = await fetch(`http://${IP}:3000/messages/${conversationId}`);
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
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={{ flex: 1 }}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 10 }}
            renderItem={({ item }) => {
              const currentUid = auth.currentUser?.uid;
              const isMine = item.sender_uid === currentUid;

              return (
                <View
                  style={{
                    width: "100%",
                    marginBottom: 10,
                    alignItems: isMine ? "flex-end" : "flex-start",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isMine ? "#007AFF" : "#E5E5EA",
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 18,
                      maxWidth: "75%",
                    }}
                  >
                    <Text style={{ color: isMine ? "white" : "black" }}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          {/* Input area */}
          <View
            style={{
              flexDirection: "row",
              padding: 10,
              borderTopWidth: 1,
              borderColor: "#ddd",
              backgroundColor: "white",
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type message..."
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginRight: 8,
              }}
            />
            <Button title="Send" onPress={sendMessage} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
