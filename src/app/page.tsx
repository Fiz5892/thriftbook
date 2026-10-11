import { createClient } from "@/lib/supabase/server";
import { Beranda } from "./beranda";
import { Landing } from "./landing";

/** Tamu melihat landing page; pengguna yang sudah masuk langsung ke beranda katalog. */
export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? <Beranda supabase={supabase} userId={data.user.id} /> : <Landing supabase={supabase} />;
}
