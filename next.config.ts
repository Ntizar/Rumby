import type { NextConfig } from "next";

/**
 * Rumby corre como app dinamica en Vercel.
 * Necesitamos route handlers (/api/nap/*, /api/dgt/*, etc.) para no exponer
 * claves de NAP/Navitia/DGT en el cliente.
 *
 * El export estatico de GitHub Pages queda deprecado.
 */
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
