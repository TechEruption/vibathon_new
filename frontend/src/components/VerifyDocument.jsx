import { useState } from "react";
import { verifyDocument } from "../services/api";
import ResultCard from "./ResultCard";

export default function VerifyDocument() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await verifyDocument(file);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isVerified = result?.exists;

  return (
    <div className="rounded-3xl bg-white/70 p-6 shadow-xl backdrop-blur">
      <h2 className="text-xl font-semibold text-slate-900">Verify Document</h2>
      <p className="mt-1 text-sm text-slate-600">Upload a file to verify its proof on-chain.</p>

      <div className="mt-6 space-y-4">
        <input
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="w-full rounded-xl border border-slate-200 p-3"
        />

        <button
          className="w-full rounded-xl bg-gradient-to-r from-pink-400 to-peach px-6 py-3 font-semibold text-white shadow hover:scale-[1.02] hover:shadow-xl transition"
          disabled={!file || loading}
          onClick={handleVerify}
        >
          {loading ? "Verifying…" : "Verify Document"}
        </button>

        {error ? (
          <ResultCard title="Error" accent="red">
            <div className="text-red-700">{error}</div>
          </ResultCard>
        ) : null}

        {result ? (
          <ResultCard
            title={isVerified ? "Verified" : "Not Found"}
            accent={isVerified ? "green" : "red"}
          >
            <div className="space-y-2">
              {isVerified ? (
                <>
                  <div>
                    <span className="font-semibold">Hash:</span> {result.hash}
                  </div>
                  <div>
                    <span className="font-semibold">Owner:</span> {result.owner}
                  </div>
                  <div>
                    <span className="font-semibold">Timestamp:</span> {result.timestamp}
                  </div>
                </>
              ) : (
                <div className="text-red-700">No proof found for this document.</div>
              )}
            </div>
          </ResultCard>
        ) : null}
      </div>
    </div>
  );
}
