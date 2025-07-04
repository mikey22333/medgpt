

import Link from "next/link";
import { ShieldCheck, Lock, AlertTriangle, Cloud, FileLock2 } from "lucide-react";

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-white text-slate-800 py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold">Security</h1>
          <p className="text-lg text-slate-600">
            Keeping your data secure is our highest priority. Below is an
            overview of how MedGPT Scholar protects your information.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5" /> End-to-End Encryption
          </h2>
          <p>
            All traffic between your browser and our servers is protected with
            TLS/SSL (HTTPS). Data stored at rest is encrypted using the
            industry-standard AES-256 algorithm.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Data Privacy
          </h2>
          <p>
            We never sell or share user data. Application logs are anonymized to
            remove personally identifiable information whenever possible.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileLock2 className="w-5 h-5" /> Access Controls
          </h2>
          <p>
            Role-based access control (RBAC) limits data exposure. Sensitive
            admin actions require multi-factor authentication.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Penetration Testing & Audits
          </h2>
          <p>
            We conduct periodic vulnerability scans and security reviews. We
            welcome responsible disclosure of potential issues.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Cloud className="w-5 h-5" /> Cloud Infrastructure
          </h2>
          <p>
            MedGPT Scholar is hosted on trusted cloud providers with network
            segmentation, firewalls, and continuous monitoring in place.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Responsible Disclosure
          </h2>
          <p>
            Found a vulnerability? Please email <a href="mailto:security@medgpt.ai" className="text-primary hover:underline">security@medgpt.ai</a> and
            our team will investigate promptly.
          </p>
        </section>

        <div className="pt-10 border-t">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
