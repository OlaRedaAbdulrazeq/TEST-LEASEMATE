// app/unit/page.tsx
import React, { Suspense } from "react";
import UnitPageContent from "./UnitPageContent";

export default function UnitsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">...جاري التحميل</div>}>
      <UnitPageContent />
    </Suspense>
  );
}
