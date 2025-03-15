import { createContext, useContext, useEffect, useState } from "react";

interface NotificationContextProps {
  notifications: string[];
  addNotification: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notifications, setNotifications] = useState<string[]>([]);

  const addNotification = (message: string) => {
    setNotifications((prev) => [...prev, message]);

    // Remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 5000);
  };

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (event) => {
      console.log("📩 Notification Event:", event);
      const data = JSON.parse(event.data);

      if (data.message.includes("wishlist!")) {
        addNotification(`🛍️ ${data.message}`);
      } else if (data.message.includes("Order placed")) {
        addNotification(`📦 ${data.message}`);
      } else {
        addNotification(`🔔 ${data.message}`);
      }
    };

    ws.onerror = (error) => console.error("❌ WebSocket Error:", error);
    ws.onclose = () => console.log("🔌 WebSocket disconnected");

    return () => ws.close();
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification }}>
      {/* Floating Notifications UI */}
      <div className="fixed bottom-5 right-5 space-y-2">
        {notifications.map((notif, index) => (
          <div
            key={index}
            className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in"
          >
            {notif}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
      `}</style>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
