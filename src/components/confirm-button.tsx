"use client";

/** Tombol submit yang meminta konfirmasi dulu (AC-06.3). */
export function ConfirmButton({
  message,
  className,
  children,
  label,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
  /** Wajib untuk tombol yang isinya hanya ikon. */
  label?: string;
}) {
  return (
    <button
      className={className}
      aria-label={label}
      title={label}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
