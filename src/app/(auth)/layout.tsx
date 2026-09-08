import * as React from "react";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/20">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2.5 font-black text-xl tracking-tight">
          <Image
            src="/logo.png"
            alt="MCQ Quiz Manager"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl object-contain shadow-md"
          />
          <span>MCQ Quiz Manager</span>
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
