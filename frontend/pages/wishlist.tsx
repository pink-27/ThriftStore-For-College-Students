// pages/wishlist.tsx
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs"; // Import Clerk's useUser hook
import { useRouter } from "next/router";
import { useAuth } from "@clerk/nextjs";

const Wishlist = () => {
  const { getToken } = useAuth();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const router = useRouter();
  const { user } = useUser(); // Get the logged-in user

  useEffect(() => {
    if (!user) {
      return;
    }
    const fetchWishlist = async () => {
      const token = await getToken();
      const res = await fetch(
        `http://localhost:5011/api/wishlist?userId=${user.id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      //   console.log(res);
      const data = await res.json();
      console.log(data);
      setWishlist(data);
    };

    fetchWishlist();
  }, [user]);

  const handleDelete = async (productId: string) => {
    // setProduct(prod);
    const token = await getToken();
    const res = await fetch(`/api/wishlist`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId,
      }),
    });
    const data = await res.json();
    console.log(data);
    if (res.ok) {
      setWishlist(data);
    }
  };

  const handlePlaceOrder = async (productId: string) => {
    // setProduct(prod);
    const token = await getToken();

    const res = await fetch(`/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      // setWishlist(data);
    }
  };

  return (
    <div>
      <h1>Your Wishlist</h1>
      {wishlist.length === 0 ? (
        <p>Your wishlist is empty.</p>
      ) : (
        <ul>
          {wishlist.map((item) => (
            <li key={item._id}>
              <Link href={`/product/${item._id}`}>{item.name}</Link>
              <div>
                <button onClick={() => handlePlaceOrder(item._id)}>Buy</button>
                <button onClick={() => handleDelete(item._id)}>
                  Remove from wishlist
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Wishlist;
