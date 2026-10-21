import { Hero } from "@/components/dashboard/hero";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default function HomePage() {
  return (
    <div className="w-full flex flex-col pb-20">
      {/* Hero Section with Terminal Architecture */}
      <Hero />

      {/* Interactive Tools Dashboard & Search */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-8 mt-2">
        <DashboardView />
      </div>
    </div>
  );
}
