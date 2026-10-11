import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteForm } from "./form";

export default async function HapusAkunPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/masuk?next=/akun/hapus");

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-2xl font-bold text-navy-900">Hapus akun</h1>
      <p className="mt-3">Ini akan menghapus permanen:</p>
      <ul className="mt-2 list-disc pl-5">
        <li>profil dan nomor WhatsAppmu,</li>
        <li>semua listing beserta fotonya,</li>
        <li>semua Dicari dan riwayat kontakmu.</li>
      </ul>
      <p className="mt-3 text-muted">
        Laporan yang pernah kamu kirim tetap ada tanpa identitasmu. Kalau kamu butuh salinan
        datamu, unduh dulu dari halaman Akun.
      </p>
      <DeleteForm />
    </main>
  );
}
