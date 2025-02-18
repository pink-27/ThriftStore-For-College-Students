import Link from "next/link";
import { ReactNode } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div>
      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px", // Added horizontal padding
          borderBottom: "2px solid #ddd",
        }}
      >
        {/* Left Side - Navigation Links */}
        <div style={{ display: "flex", gap: "20px" }}>
          <Link href="/home">Home</Link>
          <Link href="/wishlist">Wishlist</Link>
          <Link href="/add-product">Add Product</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/inbox">Inbox</Link>
        </div>

        {/* Right Side - Authentication */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <SignedOut>
            <SignInButton mode="modal">
              <button>Sign In</button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
};

export default Layout;
