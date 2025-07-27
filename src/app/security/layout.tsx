import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security | CliniSynth",
  description: "Discover the security measures CliniSynth uses to keep your data protected and private.",
};

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
