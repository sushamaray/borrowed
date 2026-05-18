import type { Metadata } from "next";

import SocialAuthRedirectClient from "../../login/SocialAuthRedirectClient";

export const metadata: Metadata = {
  title: "Google Sign Up | Borrowed",
  description: "Create a Borrowed account with Google.",
};

export default function Page() {
  return <SocialAuthRedirectClient provider="google" mode="register" />;
}
