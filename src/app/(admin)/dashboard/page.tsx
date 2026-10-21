import React, { Suspense } from "react";
import ModernSaasDashboard from "@/components/dashboard/ModernSaasDashboard";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Đang tải Dashboard...</div>}>
      <ModernSaasDashboard />
    </Suspense>
  );
}
