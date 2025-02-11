import Link from "next/link";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div>
      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          gap: "20px",
          padding: "10px",
          borderBottom: "2px solid #ddd",
        }}
      >
        <Link href="/">Home</Link>
        <Link href="/wishlist">Wishlist</Link>
        <Link href="/add-product">Add Product</Link>
        <Link href="/orders">Orders</Link>
        <Link href="/register">Register</Link>
      </nav>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
};
export default Layout;
