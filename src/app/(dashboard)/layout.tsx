import * as React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />

      <div className="flex-1 flex w-full">
        <Sidebar className="hidden md:flex" />

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
