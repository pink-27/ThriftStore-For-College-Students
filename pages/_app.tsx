import type { AppProps } from "next/app";
import Layout from "./components/Layout";
import { NotificationProvider } from "../context/NotificationContext";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <NotificationProvider>
        <Component {...pageProps} />
      </NotificationProvider>
    </Layout>
  );
}
