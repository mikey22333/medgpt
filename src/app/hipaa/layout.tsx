import { Metadata } from "next";

export const metadata: Metadata = {
  title: "HIPAA Compliance | MedGPT Scholar",
  description:
    "Learn how MedGPT Scholar aligns with HIPAA security & privacy principles to keep your healthcare data protected.",
};

export default function HipaaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
