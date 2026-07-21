import "./globals.css";
import { CartProvider } from "../../context/CartContext";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/home/footer";
import { UserProvider } from "../../context/UserContext";
import PWARegister from "../../components/pwa/pwa-register";
import FloatingActionButton from "../../components/home/FloatingActionButton";

const SITE_URL = "https://cartvan.com";
const SITE_NAME = "Cartvan";
const DEFAULT_TITLE =
  "Cartvan | Trusted Online Shopping Platform in Bangladesh";
const DEFAULT_DESCRIPTION =
  "Shop quality products online at competitive prices with fast delivery across Bangladesh from Cartvan.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo-192.png",
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/logo-512.png",
        width: 512,
        height: 512,
        alt: "Cartvan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/logo-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport = {
  themeColor: "#f472b6",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-BD">
      <body className="flex flex-col min-h-screen bg-gray-50">
        <PWARegister />
        <UserProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-grow bg-pink-50">
              <div className="mx-auto w-full">{children}</div>
            </main>
            <Footer />
            <FloatingActionButton />
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
