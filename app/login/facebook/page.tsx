import type { Metadata } from "next";

import SocialAuthRedirectClient from "../SocialAuthRedirectClient";

export const metadata: Metadata = {
  title: "Facebook Login | Borrowed",
  description: "Sign in to Borrowed with Facebook.",
};

export default function Page() {
  return <SocialAuthRedirectClient provider="facebook" mode="login" />;
}
