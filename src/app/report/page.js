import { Suspense } from "react";
import { ResearchReport } from "@/components/paper/ResearchReport";

export const metadata = {
  title: "Research report · Cross-Lingual Tokenization Asymmetry",
};

export default function ReportPage() {
  return (
    <Suspense fallback={<p className="paper-status">Loading report…</p>}>
      <ResearchReport />
    </Suspense>
  );
}
