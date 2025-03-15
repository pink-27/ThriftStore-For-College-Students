import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
const ProductDetail = () => {
  const [product, setProduct] = useState<any>(null);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sellername, setsellername] = useState<any>(null);
  const router = useRouter();
  const { user } = useUser();
  const { id } = router.query;
  const { getToken } = useAuth();

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      const token = await getToken(); // Get the Clerk authentication token

      const res = await fetch(`http://localhost:5010/api/products/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Attach the token
        },
      });
      const data = await res.json();
      setProduct(data.product);
      setEditProduct(data.product);

      setsellername(data.Sellername.firstName + " " + data.Sellername.lastName);
    };
    fetchProduct();
  }, [id]);
  const generateConversationId = (userId: string, sellerId: string) => {
    return [userId, sellerId].sort().join("-");
  };
  const handleChat = () => {
    if (!user) {
      alert("Please log in to chat with the seller.");
      return;
    }

    const conversationId = generateConversationId(user.id, product.seller);
    router.push(`/chat/${conversationId}`);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("Please log in to add to wishlist.");
      return;
    }
    const token = await getToken();
    const res = await fetch("http://localhost:5011/api/wishlist/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user: user.id,
        product: { _id: product._id, name: product.name },
      }),
    });

    if (!res.ok) {
      console.error("Error adding to wishlist:", await res.json());
    }
  };

  const handleOrder = async () => {
    const token = await getToken();
    if (!user) {
      alert("Please log in to place an order.");
      return;
    }
    await fetch("/api/orders/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId: product._id }),
    });
  };

  const handleUpdate = async () => {
    if (!editProduct) return;
    const token = await getToken();

    const res = await fetch(`http://localhost:5010/api/products/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Attach the token
      },
      body: JSON.stringify(editProduct),
    });

    if (res.ok) {
      const updatedProduct = await res.json();
      setProduct(updatedProduct.updatedProduct);

      setIsEditing(false);
    }
  };

  if (!product) return <p>Loading product...</p>;
  console.log(user?.id, product.seller);
  return (
    <div>
      <h2>Seller: {sellername}</h2>
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <p>
        <strong>Price:</strong> ${product.price}
      </p>
      <button onClick={handleSubmit}>Add to Wishlist</button>
      <button onClick={handleOrder}>Place an Order</button>
      {user && user.id !== product.seller && (
        <button onClick={handleChat}>Chat with the Seller</button>
      )}

      {user?.id === product.seller && (
        <>
          <button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Cancel Edit" : "Edit Product"}
          </button>

          {isEditing && (
            <div>
              <h2>Edit Product</h2>
              <input
                type="text"
                value={editProduct?.name || ""}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, name: e.target.value })
                }
              />
              <textarea
                value={editProduct?.description || ""}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    description: e.target.value,
                  })
                }
              />
              <input
                type="number"
                value={editProduct?.price || ""}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    price: parseFloat(e.target.value),
                  })
                }
              />
              <button onClick={handleUpdate}>Save Changes</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductDetail;
