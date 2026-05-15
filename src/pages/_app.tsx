import type { AppProps } from 'next/app';
import StoreProvider from '@/store/StoreProvider';
import { ThemeProvider } from '@/context/ThemeContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import '../app/globals.css';
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <main className={`${outfit.variable} font-sans`}>
      <StoreProvider>
        <ThemeProvider>
          <SidebarProvider>
            <Component {...pageProps} />
            <ToastContainer 
              position="top-right" 
              autoClose={3000} 
              newestOnTop 
              style={{ zIndex: 999999, position: "fixed" }} 
            />
          </SidebarProvider>
        </ThemeProvider>
      </StoreProvider>
    </main>
  );
}
