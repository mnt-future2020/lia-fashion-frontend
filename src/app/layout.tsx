import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from '@/contexts/CartContext';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import { UserAuthProvider } from "@/contexts/UserAuthContext";
import { UserCartProvider } from '@/contexts/UserCartContext'
import { Toaster } from "react-hot-toast";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import ClientErrorProvider from "@/components/ClientErrorProvider";

const poppins = Poppins({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Lia Fashion – Your Online Boutique for Elegant Indian Fashion",
  description: "Welcome to LiaFashion.in – your go-to boutique for stylish women’s wear. Explore our collection of elegant Kurtis, stretchable Jeggings, trendy Coord Sets, flowy Umbrella cuts, and versatile Leggings. Fashion meets comfort at prices you’ll love.",
  icons: {
    icon: [
      {
        url: "/assets/images/logo.png",
        type: "image/png",
      },
    ],
    shortcut: ["/assets/images/logo.png"],
    apple: [
      {
        url: "/assets/images/logo.png",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/react-toastify/dist/ReactToastify.css" />
      </head>
      <body className={`${poppins.className} antialiased`}>
        <ClientErrorProvider>
          <AuthProvider>
            <UserAuthProvider>
              <CartProvider>
                <UserCartProvider>
                  {children}
                  <ToastContainer
                    role="alert"
                    aria-live="polite"
                    aria-atomic="true"
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                  />
                  <WhatsAppFloat />
                  <Toaster />
                </UserCartProvider>
              </CartProvider>
            </UserAuthProvider>
          </AuthProvider>
        </ClientErrorProvider>
      </body>
    </html>
  );
}
