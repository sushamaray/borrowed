import type { Metadata } from "next";

import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Register | Borrowed",
  description: "Create a new Borrowed account.",
};

export default function Page() {
  return <RegisterClient />;
}
