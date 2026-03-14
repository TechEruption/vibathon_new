import Header from "./components/Header";
import RegisterDocument from "./components/RegisterDocument";
import VerifyDocument from "./components/VerifyDocument";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-soft via-white to-soft">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Header />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <RegisterDocument />
          <VerifyDocument />
        </div>
      </div>
    </div>
  );
}
