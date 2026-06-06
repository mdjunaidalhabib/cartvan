import "./globals.css";
import { CartProvider } from "../../context/CartContext";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/home/footer";
import { UserProvider } from "../../context/UserContext";
import PWARegister from "../../components/pwa/pwa-register";
import FloatingActionButton from "../../components/home/FloatingActionButton";

// ✅ Metadata (UPDATED)
export const metadata = {
  title: "Cartvan | Trusted Best Online Shopping Platform in Bangladesh",
  description:
    "cartvan is a reliable e-commerce platform in Bangladesh offering quality products at competitive prices.",

  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};


// ✅ Correct viewport সেটআপ
export const viewport = {
  themeColor: "#f472b6",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
