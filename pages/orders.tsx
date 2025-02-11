import { useEffect, useState } from "react";
import Link from "next/link";

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);

  const handleCancelOrder = async (orderId: string) => {
    console.log(orderId);
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: "PATCH", // Use PATCH instead of DELETE to update order status
      headers: {
        "Content-Type": "application/json",
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

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch("/api/orders");
      let data = await res.json();
      data.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log(data);
      setOrders(data);
    };

    fetchOrders();
  }, []);

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
