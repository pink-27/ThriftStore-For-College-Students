import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

const Orders = () => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Track loading state
  console.log(userId);
  const { getToken } = useAuth();
  useEffect(() => {
    const fetchOrders = async () => {
      const token = await getToken();
      console.log(token);
      const res = await fetch("http://localhost:5014/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`, // Pass userId for fetching user-specific orders
        },
      });
      let data = await res.json();
      data.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log(data);
      setOrders(data);
      setLoading(false); // Data has loaded
    };

    fetchOrders();
  }, []);
  if (!isLoaded) return <h1>Loading...</h1>; // Ensure auth is loaded
  if (!isSignedIn) {
    return <h1>Please sign in to view your orders.</h1>;
  }

  const handleCancelOrder = async (orderId: string) => {
    const token = await getToken();
    console.log(orderId);
    const res = await fetch(`http://localhost:5014/api/orders/${orderId}`, {
      method: "PATCH", // Use PATCH instead of DELETE to update order status
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      // Update the state to reflect the canceled order
      let data = await res.json();
      console.log(data);

      data.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(data);
    }
  };

  if (loading) return <h1>Loading...</h1>; // Prevent rendering before data loads

  console.log(orders);
  if (!orders.length) {
    return (
      <div>
        <h1>No Orders</h1>
      </div>
    );
  }
  if (!("product" in orders[0])) {
    return (
      <div>
        <h1>No Orders</h1>
      </div>
    );
  }

  return (
    <div>
      <h1>Your Orders</h1>

      <div>
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>{order.product.name}</h3>
            <p>{order.product.description}</p>
            <p>
              <strong>Price:</strong> ${order.product.price}
            </p>
            <p>
              <strong>Category:</strong> {order.product.category}
            </p>
            <p>
              <strong>Status:</strong> {order.status}
            </p>
            <Link href={`/product/${order.product._id}`} passHref>
              <button>View Product</button>
            </Link>
            {order.status !== "canceled" && (
              <button onClick={() => handleCancelOrder(order.id)}>
                Cancel Order
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
