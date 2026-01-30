import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>{children}
          <ToastContainer position="top-right" autoClose={3000} newestOnTop style={{ zIndex: 999999, position: "fixed" }} />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
