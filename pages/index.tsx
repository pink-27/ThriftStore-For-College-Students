// pages/index.tsx
import { useEffect, useState } from "react";
// import ProductList from "./components/ProductList";
import Link from "next/link";

const Home = () => {
  const [products, setProducts] = useState<any[]>([]);

  const handleDelete = async (productId: string) => {
    const res = await fetch(`/api/products/${productId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setProducts(products.filter((product) => product._id !== productId));
    }
  };
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    };

    fetchProducts();
  }, []);

  return (
    <div>
      <h1>Welcome to Thrift Store</h1>

      <div>
        {products.map((product) => (
          <div
            key={product._id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>
              <strong>Price:</strong> ${product.price}
            </p>
            <p>
              <strong>Category:</strong> {product.category}
            </p>
            <Link href={`/product/${product._id}`} passHref>
              <button>View Details</button>
            </Link>
            <button onClick={() => handleDelete(product._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
