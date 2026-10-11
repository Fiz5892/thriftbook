import { LoginButton } from "./login-button";

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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold text-navy-900">Masuk ke thriftbook.</h1>
      <p className="text-ink">
        Thriftbook khusus sivitas UM. Masuk pakai akun Google kampusmu supaya
        penjual dan pembeli sama-sama tahu mereka ketemu orang kampus.
      </p>
      {error && (
        <p role="alert" className="rounded-xl border border-danger px-4 py-3 text-danger">
          {PESAN[error] ?? PESAN.gagal}
        </p>
      )}
      <LoginButton next={next} />
    </main>
  );
}
