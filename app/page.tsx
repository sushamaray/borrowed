import type { Metadata } from "next";

import { LoginClient } from "./login";

export const metadata: Metadata = {
  title: "Login | Borrowed",
  description: "Sign in to your Borrowed account.",
};

export default function Page() {
  return <LoginClient />;
}
