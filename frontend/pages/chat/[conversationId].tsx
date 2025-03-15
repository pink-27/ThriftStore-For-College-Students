import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";

const ChatPage = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { conversationId } = router.query;
  const { user } = useUser();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to the bottom whenever messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // Runs when `messages` change

  useEffect(() => {
    if (!conversationId || !user) return;

    const fetchPreviousMessages = async () => {
      const token = await getToken();

      try {
        const res = await fetch(
          `http://localhost:5012/api/chat/${conversationId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
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

    // WebSocket Setup
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
    const token = await getToken();
    try {
      const res = await fetch("http://localhost:5012/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
        id="messages"
      >
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.senderId === user?.id ? "You" : "Anon"}: </strong>
            <span>{msg.text || msg.message}</span>
          </div>
        ))}
        {/* Empty div for auto-scrolling */}
        <div ref={messagesEndRef} />
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
