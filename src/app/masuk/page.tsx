import { LoginButton } from "./login-button";
import { Mascot } from "@/components/mascot";
import { Starburst } from "@/components/decor";

const PESAN: Record<string, string> = {
  domain: "Pakai akun Google kampus UM (…@students.um.ac.id atau …@um.ac.id), ya.",
  gagal: "Loginnya gagal. Coba lagi sebentar.",
  kode: "Loginnya belum selesai. Coba ulangi dari awal.",
};

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-4 py-10 md:py-16">
      <div className="card card-lg grid w-full overflow-hidden md:grid-cols-2">
        <div className="relative hidden place-items-center border-r-2 border-ink bg-lilac p-10 md:grid">
          <Mascot mood="wave" className="anim-bob w-56" />
          <Starburst className="absolute left-6 top-6 size-24 -rotate-12">Khusus sivitas UM</Starburst>
        </div>
        <div className="flex flex-col gap-5 p-6 md:p-10">
          <Mascot mood="wave" className="w-20 md:hidden" />
          <h1 className="text-2xl font-extrabold text-ink md:text-3xl">Masuk ke thriftbook.</h1>
          <p>
            Thriftbook khusus sivitas UM. Masuk pakai akun Google kampusmu supaya penjual dan pembeli
            sama-sama tahu mereka ketemu orang kampus.
          </p>
          {error && (
            <p role="alert" className="alert-danger">
              {PESAN[error] ?? PESAN.gagal}
            </p>
          )}
          <LoginButton next={next} />
          <p className="text-sm text-muted">
            Kami hanya memakai email kampus untuk memastikan kamu warga UM. Nama lengkap dan foto
            Google tidak disimpan.
          </p>
        </div>
      </div>
    </main>
  );
}
