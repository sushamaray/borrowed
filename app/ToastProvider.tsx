"use client";

import dynamic from "next/dynamic";

const HotToaster = dynamic(
  () => import("react-hot-toast").then((module) => module.Toaster),
  {
    ssr: false,
  },
);

export default function ToastProvider() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        style: {
          border: "1px solid #c5dfe0",
          borderRadius: "16px",
          color: "#0f2a2a",
        },
      }}
    />
  );
}
