"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AllianceRow {
  id: string;
  name: string;
  code: string;
  discountPercent: number;
  bonusCredits: number;
  revenueShare: number;
  referredCount: number;
  isActive: boolean;
  contactName: string | null;
  contactEmail: string | null;
}

export function AlliancesClient({
  alliances,
}: {
  alliances: AllianceRow[];
}) {
  return (
    <div className="space-y-6">
      <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
        Alianzas
      </h1>

      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
            {alliances.length} alianzas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(245,246,252,0.1)] hover:bg-transparent">
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Nombre</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Código</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Descuento</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Créditos bonus</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Revenue share</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Referidos</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alliances.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-[rgba(245,246,252,0.4)] py-8"
                    >
                      No hay alianzas
                    </TableCell>
                  </TableRow>
                )}
                {alliances.map((a: any) => (
                  <TableRow
                    key={a.id}
                    className="border-[rgba(245,246,252,0.06)] hover:bg-[rgba(255,255,255,0.03)]"
                  >
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-[var(--ice-white)]">
                          {a.name}
                        </p>
                        {a.contactName && (
                          <p className="text-xs text-[rgba(245,246,252,0.4)]">
                            {a.contactName}
                            {a.contactEmail && ` · ${a.contactEmail}`}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-[var(--gold-bar)]">
                      {a.code}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ice-white)]">
                      {a.discountPercent}%
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ice-white)]">
                      {a.bonusCredits}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ice-white)]">
                      ${a.revenueShare}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--ice-white)]">
                      {a.referredCount}
                    </TableCell>
                    <TableCell>
                      {a.isActive ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Activa
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                          Inactiva
                        </Badge>
                      )}
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
