// pages/wishlist.tsx
import Link from "next/link";
import { useEffect, useState } from "react";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    const fetchWishlist = async () => {
      const res = await fetch("/api/wishlist");
      //   console.log(res);
      const data = await res.json();

      setWishlist(data);
    };

    fetchWishlist();
  }, []);

  const handleDelete = async (productId: string) => {
    // setProduct(prod);
    const res = await fetch(`/api/wishlist`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setWishlist(data);
    }
  };

  const handlePlaceOrder = async (productId: string) => {
    // setProduct(prod);
    const res = await fetch(`/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
