import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security | MedGPT Scholar",
  description: "Discover the security measures MedGPT Scholar uses to keep your data protected and private.",
};

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
