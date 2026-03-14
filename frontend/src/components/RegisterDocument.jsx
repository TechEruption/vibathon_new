import { useState } from "react";
import { registerDocument } from "../services/api";
import ResultCard from "./ResultCard";

export default function RegisterDocument() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await registerDocument(file);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/70 p-6 shadow-xl backdrop-blur">
      <h2 className="text-xl font-semibold text-slate-900">Register Document</h2>
      <p className="mt-1 text-sm text-slate-600">Upload a file to store its proof on Avalanche.</p>

      <div className="mt-6 space-y-4">
        <input
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="w-full rounded-xl border border-slate-200 p-3" 
        />

        <button
          className="w-full rounded-xl bg-gradient-to-r from-pink-400 to-peach px-6 py-3 font-semibold text-white shadow hover:scale-[1.02] hover:shadow-xl transition"
          disabled={!file || loading}
          onClick={handleUpload}
        >
          {loading ? "Registering…" : "Register Document"}
        </button>

        {error ? (
          <ResultCard title="Error" accent="red">
            <div className="text-red-700">{error}</div>
          </ResultCard>
        ) : null}

        {result ? (
          <ResultCard title={result.alreadyRegistered ? "Already Registered" : "Registered"} accent={result.alreadyRegistered ? "red" : "green"}>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Hash:</span> {result.hash}
              </div>
              <div>
                <span className="font-semibold">Owner:</span> {result.owner}
              </div>
              <div>
                <span className="font-semibold">Timestamp:</span> {result.timestamp}
              </div>
              {!result.alreadyRegistered ? (
                <div className="mt-2">
                  <a
                    className="inline-flex items-center rounded-full bg-gradient-to-r from-peach to-pink-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:scale-105 transition"
                    href={result.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download Proof Certificate
                  </a>
                </div>
              ) : null}
            </div>
          </ResultCard>
        ) : null}
      </div>
    </div>
  );
}
