export const DRAFT_KEY = "thriftbook:draft-listing:v1";
/** Field teks yang disimpan sebagai draf. Foto sengaja tidak, karena sudah ada di server. */
export const DRAFT_FIELDS = [
  "title", "author", "course", "studyProgramId", "semester", "price", "swapWish", "notes",
] as const;
export const DRAFT_RADIOS = ["condition", "offerType"] as const;
