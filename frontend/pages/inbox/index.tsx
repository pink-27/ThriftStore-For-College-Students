import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { set } from "mongoose";
import { useAuth } from "@clerk/nextjs";
import { get } from "http";
const InboxPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const [conversations, setConversations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchInbox = async () => {
      const token = await getToken();
      try {
        const res = await fetch("http://localhost:5012/api/inbox", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch inbox");

        const data = await res.json();
        if (data.length === 0) {
          setConversations([]);
          return;
        }
        console.log(data);
        const conversationList = data[0].conversationIds || [];
        // Ensure it's always an array
        console.log(conversationList);

        setConversations(conversationList);
        console.log(conversationList);
        if (conversationList.length === 0) return; // Avoid unnecessary requests

        // Extract recipient IDs
        const recipientIds = conversationList.map((conversationId: string) => {
          const [user1, user2] = conversationId.split("-");
          return user1 === user.id ? user2 : user1;
        });
        console.log(conversationList);

        console.log(recipientIds);
      } catch (err) {
        setError("Error fetching inbox");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInbox();
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Your Inbox</h1>
      {conversations.length ? (
        <ul>
          {conversations.map((conversationId) => {
            const [user1, user2] = conversationId.split("-");
            const recipientId = user1 === user?.id ? user2 : user1;

            return (
              <li key={conversationId}>
                <button
                  onClick={() => router.push(`/chat/${conversationId}`)}
                  style={{}}
                >
                  Chat with User ID: {recipientId}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No conversations yet.</p>
      )}
    </div>
  );
};

export default InboxPage;
