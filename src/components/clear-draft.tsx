"use client";

import { useEffect } from "react";
import { DRAFT_KEY } from "@/lib/draft";

/** Hapus draf form posting setelah listing berhasil terbit (AC-04.9). */
export function ClearDraft() {
  useEffect(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // localStorage bisa diblokir; tidak masalah
    }
  }, []);
  return null;
}
