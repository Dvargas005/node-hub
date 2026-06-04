import { BackLink } from "@/components/layout/back-link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--asphalt-black)]">
      <div className="w-full max-w-md px-4">
        <div className="mb-6">
          <BackLink />
        </div>
        {children}
      </div>
    </div>
  );
}
