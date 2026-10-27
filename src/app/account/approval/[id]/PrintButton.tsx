"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-charcoal px-4 py-2.5 text-sm font-bold text-white hover:bg-charcoal/90">
      <Printer size={15} /> Print or save as PDF
    </button>
  );
}
