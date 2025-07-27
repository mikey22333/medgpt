

import Link from "next/link";
import { ShieldCheck, Shield, LockKeyhole, FileText } from "lucide-react";

export default function HipaaPage() {
  return (
    <main className="min-h-screen bg-white text-slate-800 py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="space-y-4">
          <h1 className="text-4xl font-bold">HIPAA Compliance</h1>
          <p className="text-lg text-slate-600">
            CliniSynth is built with U.S. HIPAA principles in mind. While we
            are not currently classified as a covered entity, we implement
            industry-standard safeguards to help users handle Protected Health
            Information (PHI) responsibly.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" /> What is HIPAA?
          </h2>
          <p>
            The Health Insurance Portability and Accountability Act (HIPAA)
            governs the security and privacy of health data in the United
            States. Any organization that processes or stores PHI is required
            to follow strict administrative, technical, and physical safeguards.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" /> Our Commitment
          </h2>
          <p>
            We designed CliniSynth to respect the confidentiality of patient
            data. The platform can be used as part of HIPAA-compliant workflows
            and helps healthcare professionals avoid exposing identifiable PHI.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <LockKeyhole className="w-5 h-5" /> How We Align with HIPAA
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Data Encryption:</strong> All traffic is protected with
              HTTPS / TLS. Data at rest is encrypted with AES-256.
            </li>
            <li>
              <strong>Access Control:</strong> User-level authentication and
              role-based permissions protect sensitive data.
            </li>
            <li>
              <strong>Audit Trails:</strong> System activity is logged and stored
              securely for accountability.
            </li>
            <li>
              <strong>No PHI Retention:</strong> We do not persist PHI unless
              explicitly required by the user.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Disclaimer
          </h2>
          <p>
            CliniSynth itself is not a covered entity. Users are encouraged
            to avoid submitting patient-identifiable information unless they are
            authorized and have obtained proper consent.
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
