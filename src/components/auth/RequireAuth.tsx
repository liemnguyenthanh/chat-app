import { useSession } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect } from "react";

interface Props {
  children: JSX.Element;
}

export default function RequireAuth({ children }: Props) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    }
  }, [session, router]);

  if (!session) return null;
  return children;
} 