import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { Beranda } from "./beranda";
import { Landing } from "./landing";

/** Tamu melihat landing page; pengguna yang sudah masuk langsung ke beranda katalog. */
export default async function Home() {
  const supabase = await createClient();
  const viewer = await getViewer(supabase);
  return viewer ? <Beranda supabase={supabase} userId={viewer.id} /> : <Landing />;
}
