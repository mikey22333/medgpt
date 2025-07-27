import { Metadata } from "next";

export const metadata: Metadata = {
  title: "HIPAA Compliance | CliniSynth",
  description:
    "Learn how CliniSynth aligns with HIPAA security & privacy principles to keep your healthcare data protected.",
};

export default function HipaaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
