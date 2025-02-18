import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export default function Home() {
  const { user } = useUser(); // Get user info if signed in

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Welcome to Thrift Store</h1>

      {/* If the user is signed in, show their details */}
      <SignedIn>
        <div>
          <h2>Hello, {user?.firstName}!</h2>
          <p>Email: {user?.primaryEmailAddress?.emailAddress}</p>
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>

      {/* If the user is signed out, show sign-in button */}
      <SignedOut>
        <p>Please sign in or create an account to continue.</p>
        <SignInButton />
      </SignedOut>
    </div>
  );
}
