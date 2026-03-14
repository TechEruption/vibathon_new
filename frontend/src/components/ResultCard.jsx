export default function ResultCard({ title, children, accent = "pink" }) {
  const accentClass = accent === "green" ? "border-green-200 bg-green-50" : "border-pink-200 bg-pink-50";

  return (
    <div className={`rounded-2xl border p-6 shadow-lg ${accentClass} transition`}> 
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 text-sm text-slate-800">{children}</div>
    </div>
  );
}
