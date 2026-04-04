import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#130A06] text-[#F5F6FC]">
      <h1 className="text-6xl font-bold text-[#FFC919]">404</h1>
      <p className="text-xl">Pagina no encontrada</p>
      <Link href="/" className="px-6 py-3 bg-[#FFC919] text-[#130A06] font-bold">
        Volver al inicio
      </Link>
    </div>
  );
}
