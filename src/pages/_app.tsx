import type { AppProps } from "next/app";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/themes";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";
import { UserProvider } from "@/contexts/UserContext";
import { RoomsProvider } from "@/contexts/RoomsContext";
import { InvitationsProvider } from "@/contexts/InvitationsContext";
import { MessagesProvider } from "@/contexts/messages/MessagesContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
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
    </SessionContextProvider>
  );
}
