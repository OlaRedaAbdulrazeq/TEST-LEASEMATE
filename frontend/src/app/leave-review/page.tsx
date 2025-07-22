// /app/leave-review/page.tsx
"use client";

import { Suspense } from "react";
import LeaveReviewContent from "./LeaveReviewContent";

export default function LeaveReviewPage() {
  return (
    <Suspense fallback={<div className="pt-24 text-center text-gray-500">جارٍ التحميل...</div>}>
      <LeaveReviewContent />
    </Suspense>
  );
}
