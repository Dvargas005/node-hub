"use client";

import { useState, useMemo } from "react";
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
import {
  availabilityLabels,
  availabilityColors,
  freelancerRoleLabels,
  categoryLabels,
} from "@/lib/status-labels";

interface FreelancerRow {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  skillTags: string[];
  monthlySalary: number;
  currentLoad: number;
  clientCapacity: number;
  availability: string;
  pmName: string;
}

export function FreelancersClient({
  freelancers,
}: {
  freelancers: FreelancerRow[];
}) {
  const [filterRole, setFilterRole] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");

  const filtered = useMemo(() => {
    return freelancers.filter((f) => {
      if (filterRole && f.role !== filterRole) return false;
      if (filterAvailability && f.availability !== filterAvailability)
        return false;
      return true;
    });
  }, [freelancers, filterRole, filterAvailability]);

  return (
    <div className="space-y-6">
      <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
        Freelancers
      </h1>

      {/* Filters */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 text-sm text-[var(--ice-white)]"
            >
              <option value="">Todos los roles</option>
              <option value="GRAPHIC_DESIGNER">Diseñador</option>
              <option value="AI_DEVELOPER">Desarrollador IA</option>
              <option value="COMMUNITY_MANAGER">Community Manager</option>
            </select>
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 text-sm text-[var(--ice-white)]"
            >
              <option value="">Toda disponibilidad</option>
              <option value="AVAILABLE">Disponible</option>
              <option value="BUSY">Ocupado</option>
              <option value="ON_LEAVE">Ausente</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
            {filtered.length} freelancers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(245,246,252,0.1)] hover:bg-transparent">
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Nombre</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Email</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Rol</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Skills</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Salario</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Carga</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">Disponibilidad</TableHead>
                  <TableHead className="text-[rgba(245,246,252,0.5)]">PM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-[rgba(245,246,252,0.4)] py-8"
                    >
                      No hay freelancers
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((f) => (
                  <TableRow
                    key={f.id}
                    className="border-[rgba(245,246,252,0.06)] hover:bg-[rgba(255,255,255,0.03)]"
                  >
                    <TableCell className="text-[var(--ice-white)] font-medium">
                      {f.name}
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      {f.email}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.7)] border-[rgba(245,246,252,0.1)]">
                        {freelancerRoleLabels[f.role] || f.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {f.skills.map((s) => (
                          <Badge
                            key={s}
                            className="text-[10px] bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.5)] border-[rgba(245,246,252,0.1)]"
                          >
                            {categoryLabels[s] || s}
                          </Badge>
                        ))}
                        {f.skillTags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] bg-[rgba(255,255,255,0.03)] text-[rgba(245,246,252,0.4)] px-1.5 py-0.5 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      ${(f.monthlySalary / 100).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="w-20">
                        <div className="flex justify-between text-xs text-[rgba(245,246,252,0.4)] mb-1">
                          <span>
                            {f.currentLoad}/{f.clientCapacity}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.1)]">
                          <div
                            className="h-full rounded-full bg-[var(--gold-bar)]"
                            style={{
                              width: `${Math.min(
                                (f.currentLoad / f.clientCapacity) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={availabilityColors[f.availability] || ""}
                      >
                        {availabilityLabels[f.availability] || f.availability}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[rgba(245,246,252,0.6)]">
                      {f.pmName}
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
