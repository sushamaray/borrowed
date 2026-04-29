import type { Metadata } from "next";

import SocialAuthRedirectClient from "../../login/SocialAuthRedirectClient";

export const metadata: Metadata = {
  title: "Facebook Sign Up | Borrowed",
  description: "Create a Borrowed account with Facebook.",
};

export default function Page() {
  return <SocialAuthRedirectClient provider="facebook" mode="register" />;
}
