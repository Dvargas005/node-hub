"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { ContactIcons } from "@/components/admin/contact-links";

interface ClientRow {
  id: string;
  name: string;
  email: string;
  businessName: string | null;
  planName: string | null;
  planSlug: string | null;
  creditsRemaining: number | null;
  monthlyCredits: number | null;
  activeTickets: number;
  allianceName: string | null;
  allianceCode: string | null;
  assignedPmId: string | null;
  assignedPmName: string | null;
  createdAt: string;
  phone: string | null;
  whatsappNumber: string | null;
  telegramId: string | null;
  linkedinUrl: string | null;
  instagramHandle: string | null;
  preferredContact: string | null;
}

const planColors: Record<string, string> = {
  member: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  growth: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pro: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export function ClientsClient({
  clients,
  plans,
  isAdmin,
  pms,
}: {
  clients: ClientRow[];
  plans: { slug: string; name: string }[];
  isAdmin: boolean;
  pms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [filterAlliance, setFilterAlliance] = useState(false);

  const handleAssignPm = async (clientId: string, pmId: string) => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/assign-pm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pmId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err: any) {
      console.error("Error assigning PM", err);
    }
  };

  const filtered = useMemo(() => {
    return clients.filter((c: any) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.email.toLowerCase().includes(q) &&
          !(c.businessName || "").toLowerCase().includes(q)
        )
          return false;
      }
      if (filterPlan) {
        if (filterPlan === "__none") { if (c.planSlug !== null) return false; }
        else if (c.planSlug !== filterPlan) return false;
      }
      if (filterAlliance && !c.allianceName) return false;
      return true;
    });
  }, [clients, search, filterPlan, filterAlliance]);

  return (
    <div className="space-y-6">
      <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
        Clients
      </h1>

      {/* Filters */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(245,246,252,0.4)]" />
              <Input
                placeholder="Search by name, email or business..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
              />
            </div>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
            >
              <option value="">All plans</option>
              {plans.map((p: any) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
              <option value="__none">No plan</option>
            </select>
            <button
              onClick={() => setFilterAlliance(!filterAlliance)}
              className={`h-9 rounded-md border px-3 text-sm transition-colors ${
                filterAlliance
                  ? "border-[var(--gold-bar)] bg-[rgba(255,201,25,0.1)] text-[var(--gold-bar)]"
                  : "border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.5)]"
              }`}
            >
              With alliance
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
            {filtered.length} clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(245,246,252,0.1)] hover:bg-transparent">
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Name</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Business</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Contact</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Plan</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Credits</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Tickets</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">PM</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Alliance</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-[rgba(245,246,252,0.4)] py-8"
                    >
                      No clients found
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((c: any) => (
                  <TableRow
                    key={c.id}
                    className="border-[rgba(245,246,252,0.06)] hover:bg-[rgba(255,255,255,0.03)]"
                  >
                    <TableCell className="text-[var(--ice-white)] font-medium">
                      <div>{c.name}</div>
                      <div className="text-xs text-[rgba(245,246,252,0.5)] font-normal">{c.email}</div>
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      {c.businessName || (
                        <span className="text-[rgba(245,246,252,0.3)]">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ContactIcons
                        contact={{
                          email: c.email,
                          phone: c.phone,
                          whatsappNumber: c.whatsappNumber,
                          telegramId: c.telegramId,
                          linkedinUrl: c.linkedinUrl,
                          instagramHandle: c.instagramHandle,
                          preferredContact: c.preferredContact,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {c.planSlug ? (
                        <Badge className={planColors[c.planSlug] || ""}>
                          {c.planName}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                          No plan
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      {c.creditsRemaining !== null ? (
                        <span>
                          <span className="text-[var(--ice-white)]">
                            {c.creditsRemaining}
                          </span>
                          /{c.monthlyCredits}
                        </span>
                      ) : (
                        <span className="text-[rgba(245,246,252,0.3)]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ice-white)]">
                      {c.activeTickets}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      {isAdmin ? (
                        <select
                          value={c.assignedPmId || ""}
                          onChange={(e) => {
                            if (e.target.value) handleAssignPm(c.id, e.target.value);
                          }}
                          className="h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
                        >
                          <option value="">Unassigned</option>
                          {pms.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        c.assignedPmName || (
                          <span className="text-[rgba(245,246,252,0.3)]">—</span>
                        )
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      {c.allianceName ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          {c.allianceName}
                        </Badge>
                      ) : (
                        <span className="text-[rgba(245,246,252,0.3)]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.5)]">
                      {new Date(c.createdAt).toLocaleDateString("es-MX")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
