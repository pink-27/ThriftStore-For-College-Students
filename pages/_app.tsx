import type { AppProps } from "next/app";
import Layout from "./components/Layout";
import { NotificationProvider } from "../context/NotificationContext";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <Layout>
        <NotificationProvider>
          <Component {...pageProps} />
        </NotificationProvider>
      </Layout>
    </ClerkProvider>
  );
}
