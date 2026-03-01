
'use client';

// This layout is shared by all sign-in and sign-up pages,
// which contain client-side interactivity. Marking this as a
// client component boundary is appropriate as you suggested.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
