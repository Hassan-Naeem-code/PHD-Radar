import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { TopBar } from "@/components/dashboard/TopBar";
import { VerifyEmailBanner } from "@/components/dashboard/VerifyEmailBanner";
import { OnboardingGate } from "@/components/dashboard/OnboardingGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingGate />
      <Sidebar />
      <MobileNav />
      <main className="lg:pl-64">
        <VerifyEmailBanner />
        <TopBar />
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
