import Link from "next/link";
import { ShieldOff } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4f9]">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
          <ShieldOff className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-[#18122e] mb-2 tracking-tight">
          Access Denied
        </h1>
        <p className="text-[#5a5175] text-sm mb-6 leading-relaxed">
          You don&apos;t have permission to view this page. Admin access is
          required.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-[#3b2a80] text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-[#31236a] transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
