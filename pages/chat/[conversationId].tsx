import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";

const ChatPage = () => {
  const router = useRouter();
  const { conversationId } = router.query;
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!conversationId || !user) return;

    const fetchPreviousMessages = async () => {
      try {
        const res = await fetch(
          `/api/chat/send?conversationId=${conversationId}`
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.chats); // Load previous messages
        } else {
          console.error("Failed to fetch chat history");
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchPreviousMessages();

    // Extract user IDs from conversationId (Format: "user1_user2")
    const [user1, user2] = (conversationId as string).split("-");
    const recipientId = user.id === user1 ? user2 : user1;

    // Add conversation to both users' inboxes
    const updateInbox = async () => {
      try {
        const res = await fetch("/api/inbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, recipientId }),
        });

        if (!res.ok) {
          console.error("Failed to update inbox");
        }
      } catch (error) {
        console.error("Error updating inbox:", error);
      }
    };

    updateInbox();

    // Connect to WebSocket
    const socket = new WebSocket("ws://localhost:8081");
    setWs(socket);

    socket.onopen = () => {
      socket.send(JSON.stringify({ conversationId }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);

      setMessages((prev) => [...prev, data]); // Append new messages
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => socket.close();
  }, [conversationId, user]);

  const sendMessage = async () => {
    if (!user || !conversationId || !input.trim()) return;

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: input,
          senderId: user.id,
        }),
      });

      if (res.ok) {
        setInput(""); // Clear input field
      } else {
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chat</h1>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          height: "300px",
          overflowY: "scroll",
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.senderId === user?.id ? "You" : "Anon"}: </strong>
            <span>{msg.text || msg.message}</span>{" "}
            {/* Handle both old and new messages */}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "10px" }}>
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatPage;
