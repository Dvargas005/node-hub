export const ticketStatusLabels: Record<string, string> = {
  NEW: "Nuevo",
  REVIEWING: "En revisión",
  ASSIGNED: "Asignado",
  IN_PROGRESS: "En progreso",
  DELIVERED: "Entregado",
  REVISION: "Revisión",
  COMPLETED: "Completado",
  CANCELED: "Cancelado",
};

export const ticketStatusColors: Record<string, string> = {
  NEW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  REVIEWING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ASSIGNED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  IN_PROGRESS: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  DELIVERED: "bg-green-500/20 text-green-400 border-green-500/30",
  REVISION: "bg-red-500/20 text-red-400 border-red-500/30",
  COMPLETED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  CANCELED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export const priorityLabels: Record<string, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const priorityColors: Record<string, string> = {
  LOW: "text-gray-400",
  NORMAL: "text-blue-400",
  HIGH: "text-orange-400",
  URGENT: "text-red-400",
};

export const availabilityLabels: Record<string, string> = {
  AVAILABLE: "Disponible",
  BUSY: "Ocupado",
  ON_LEAVE: "Ausente",
  INACTIVE: "Inactivo",
};

export const availabilityColors: Record<string, string> = {
  AVAILABLE: "bg-green-500/20 text-green-400 border-green-500/30",
  BUSY: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ON_LEAVE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  INACTIVE: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export const freelancerRoleLabels: Record<string, string> = {
  GRAPHIC_DESIGNER: "Diseñador",
  AI_DEVELOPER: "Desarrollador IA",
  COMMUNITY_MANAGER: "Community Manager",
};

export const categoryLabels: Record<string, string> = {
  DESIGN: "Diseño",
  WEB: "Web",
  MARKETING: "Marketing",
};

export const categoryColors: Record<string, string> = {
  DESIGN: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  WEB: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  MARKETING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};
