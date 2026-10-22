import { Source_Serif_4 } from "next/font/google";

const serif = Source_Serif_4({
  variable: "--font-paper-serif",
  subsets: ["latin", "latin-ext"],
});

export default function ReportLayout({ children }) {
  return <div className={`${serif.variable} paper-root`}>{children}</div>;
}
