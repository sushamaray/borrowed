"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const MessagesInner = dynamic(() => import("./MessagesInner"), { ssr: false });

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  );
}
