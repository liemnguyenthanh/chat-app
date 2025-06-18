import EmailAuthForm from "@/components/EmailAuthForm";
import { Container, Box } from "@mui/material";
import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Login() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [session, router]);

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ maxWidth: 420, mx: "auto" }}>
        <EmailAuthForm />
      </Box>
    </Container>
  );
} 