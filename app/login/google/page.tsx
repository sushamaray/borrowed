import type { Metadata } from "next";

import SocialAuthRedirectClient from "../SocialAuthRedirectClient";

export const metadata: Metadata = {
  title: "Google Login | Borrowed",
  description: "Sign in to Borrowed with Google.",
};

export default function Page() {
  return <SocialAuthRedirectClient provider="google" mode="login" />;
}
