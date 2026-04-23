import { NextResponse } from "next/server";

/**
 * Proxy a NAP (Punto de Acceso Nacional, transportes.gob.es) para listar
 * operadores de transporte por Area Urbana.
 *
 * - Mantiene la ApiKey en servidor.
 * - Cachea 24h (los operadores rara vez cambian).
 *
 * Uso: GET /api/nap/operators?area=1
 */

export const runtime = "nodejs";
export const revalidate = 86400; // 24h

type NapDataset = {
  conjuntoDatosId: number;
  nombre: string;
  organizacion?: string;
  tipoTransporte?: string;
};

type NapOperator = {
  operadorId: number;
  nombre: string;
  url?: string;
  conjuntosDatos?: NapDataset[];
};

export type RumbyOperator = {
  id: number;
  name: string;
  url: string | null;
  modes: string[];
  datasetsCount: number;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const area = url.searchParams.get("area");

  if (!area) {
    return NextResponse.json({ error: "missing area param" }, { status: 400 });
  }

  const apiKey = process.env.NAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "NAP_API_KEY not configured on server" },
      { status: 503 },
    );
  }

  try {
    const res = await fetch("https://nap.transportes.gob.es/api/Operador/Filter", {
      method: "POST",
      headers: {
        ApiKey: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ areasurbanas: [Number(area)] }),
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `NAP responded ${res.status}` },
        { status: 502 },
      );
    }

    const data: NapOperator[] = await res.json();
    const operators: RumbyOperator[] = data.map((op) => {
      const modes = new Set<string>();
      (op.conjuntosDatos ?? []).forEach((d) => {
        if (d.tipoTransporte) modes.add(d.tipoTransporte);
      });
      return {
        id: op.operadorId,
        name: op.nombre,
        url: op.url ?? null,
        modes: Array.from(modes),
        datasetsCount: op.conjuntosDatos?.length ?? 0,
      };
    });

    // Solo operadores con al menos un dataset; ordena por nombre.
    const filtered = operators
      .filter((o) => o.datasetsCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(
      { area: Number(area), count: filtered.length, operators: filtered },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 },
    );
  }
}
