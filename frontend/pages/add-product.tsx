import { useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs"; // Import Clerk's useUser hook
import { useAuth } from "@clerk/nextjs";
const AddProduct = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();
  const { user } = useUser(); // Get the logged-in user
  const { getToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to add a product.");
      return;
    }

    const sellerId = user.id; // Get Clerk user ID
    console.log(
      JSON.stringify({ name, description, price, category, sellerId })
    );
    const token = await getToken();
    // console.log(token);
    const response = await fetch("http://localhost:5010/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Attach the token
      },
      body: JSON.stringify({ name, description, price, category, sellerId }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(data.message);
      router.push("/"); // Redirect after successful submission
    } else {
      setError(data.message);
    }
  };

  return (
    <div>
      <h1>Add Product</h1>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Price:</label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Category:</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>

        <button type="submit">Add Product</button>
      </form>
    </div>
  );
};

export default AddProduct;
