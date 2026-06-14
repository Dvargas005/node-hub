import { db } from "@/lib/db";
import { SignAgreementForm } from "@/components/agreements/sign-agreement-form";

export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#130A06] px-4 py-10 text-[#F5F6FC]">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-2">
          <span className="text-xl font-bold text-[#FFC919]">N.O.D.E.</span>
          <span className="text-xs opacity-60">Powered by Nouvos</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <div className="rounded-lg border border-white/10 bg-white/5 p-8">
        <h1 className="text-xl font-semibold text-[#FFC919]">{title}</h1>
        <p className="mt-2 text-sm opacity-80">{body}</p>
      </div>
    </Shell>
  );
}

function fmt(d: Date | null | undefined) {
  return d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";
}

export default async function SignAgreementPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;
  if (!token) return <Notice title="Invalid link" body="This signing link is missing its token. Please use the link from your email." />;

  const ag = await db.agreement.findUnique({
    where: { token },
    include: {
      ticket: {
        include: {
          user: { select: { name: true } },
          variant: { include: { service: true } },
        },
      },
    },
  });

  if (!ag) return <Notice title="Agreement not found" body="We couldn't find this agreement. The link may be incorrect or it may have been removed." />;
  if (ag.status === "DRAFT") return <Notice title="Not ready yet" body="This agreement is still being prepared. You'll get an email when it's ready to sign." />;
  if (ag.status === "EXPIRED" || (ag.expiresAt && ag.expiresAt < new Date()))
    return <Notice title="Link expired" body="This signing link has expired. Please ask your project manager to resend it." />;

  const svc = ag.ticket.variant.service.name;
  const credits = ag.priceCredits;

  const Body = (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6 sm:p-8">
      <p className="text-xs uppercase tracking-wide opacity-50">Service agreement · Request #{ag.ticket.number}</p>
      <h1 className="mt-1 text-2xl font-bold">{ag.title}</h1>
      <p className="mt-1 text-sm opacity-70">Prepared for {ag.ticket.user.name}</p>

      <Section label="What will be provided">{ag.scope}</Section>

      <div className="mt-6">
        <p className="text-sm font-semibold text-[#FFC919]">Deliverables</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm opacity-90">
          {ag.deliverables.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </div>

      <Section label="How it will be provided">{ag.method}</Section>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <Fact label="Estimated timeline" value={`${ag.timelineDays} working day${ag.timelineDays === 1 ? "" : "s"}`} />
        <Fact label="Estimated completion" value={fmt(ag.targetDate)} />
        <Fact label="Price" value={`$${credits.toLocaleString()} (${credits} credits)`} />
        <Fact label="Service" value={svc} />
      </div>

      <p className="mt-6 rounded-md bg-black/30 p-3 text-xs opacity-60">
        Prices are in USD (1 credit = $1). This agreement defines the scope above; work outside it may require a new
        request. Timelines are estimates from the start of work.
      </p>
    </div>
  );

  if (ag.status === "SIGNED") {
    return (
      <Shell>
        {Body}
        <div className="mt-6 rounded-lg border border-[#FFC919]/40 bg-[#FFC919]/10 p-6">
          <p className="font-semibold text-[#FFC919]">Signed ✓</p>
          <p className="mt-1 text-sm opacity-80">
            Signed by {ag.signerName} on {fmt(ag.signedAt)}
            {ag.requestedDate ? ` · requested by ${fmt(ag.requestedDate)}` : ""}.
          </p>
        </div>
      </Shell>
    );
  }

  // status === SENT → show the form
  return (
    <Shell>
      {Body}
      <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Review &amp; sign</h2>
        <p className="mt-1 mb-5 text-sm opacity-70">Work begins once this agreement is signed.</p>
        <SignAgreementForm token={token} />
      </div>
    </Shell>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-[#FFC919]">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm opacity-90">{children}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-black/20 p-3">
      <p className="text-xs opacity-50">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
