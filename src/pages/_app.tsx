import type { AppProps } from "next/app";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/themes";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { supabase } from "@/lib/supabaseClient";
import { queryClient } from "@/lib/queryClient";
import { UserProvider } from "@/contexts/UserContext";
import { RoomsProvider } from "@/contexts/RoomsContext";
import { InvitationsProvider } from "@/contexts/InvitationsContext";
import { MessagesProvider } from "@/contexts/messages/MessagesContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <UserProvider>
            <RoomsProvider>
              <InvitationsProvider>
                <MessagesProvider>
                  <Component {...pageProps} />
                </MessagesProvider>
              </InvitationsProvider>
            </RoomsProvider>
          </UserProvider>
          </ThemeProvider>
        {/* React Query Devtools - only shows in development */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionContextProvider>
  );
}
