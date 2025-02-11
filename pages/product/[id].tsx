// pages/product/[id].tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const ProductDetail = () => {
  const [product, setProduct] = useState<any>(null);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false); // Toggle edit mode
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      setProduct(data);
      setEditProduct(data);
    };
    fetchProduct();
  }, [id]);

  const handleSubmit = async () => {
    await fetch("/api/wishlist/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product }),
    });
  };

  const handleOrder = async () => {
    await fetch("/api/orders/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product._id }),
    });
  };

  const handleUpdate = async () => {
    if (!editProduct) return;
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editProduct),
    });

    if (res.ok) {
      const updatedProduct = await res.json();
      setProduct(updatedProduct);
      setIsEditing(false); // Exit edit mode after saving
    }
  };

  if (!product) {
    return <p>Loading product...</p>;
  }

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>
        <strong>Price:</strong> ${product.price}
      </p>
      <button onClick={handleSubmit}>Add to Wishlist</button>
      <button onClick={handleOrder}>Place an Order</button>

      {/* Edit Mode Toggle */}
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
              setEditProduct({ ...editProduct, description: e.target.value })
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
    </div>
  );
};

export default ProductDetail;
