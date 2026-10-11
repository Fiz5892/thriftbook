import Link from "next/link";
import { Mascot } from "@/components/mascot";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Mascot mood="oops" className="mb-4 w-36" />
      <h1 className="text-2xl text-ink font-extrabold">Halamannya nggak ketemu.</h1>
      <p className="mt-2 text-muted">
        Mungkin bukunya sudah dihapus pemiliknya, atau tautannya salah ketik.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-yellow">
          Ke beranda
        </Link>
        <Link href="/cari" className="btn btn-outline">
          Cari buku
        </Link>
      </div>
    </main>
  );
}
