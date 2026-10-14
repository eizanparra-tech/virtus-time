import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // "Cache Components" (antes PPR) está pensado para páginas con partes
  // estáticas y partes dinámicas. En VIRTUS TIME casi todo depende de la
  // sesión del socio que ha iniciado sesión, así que lo desactivamos y
  // usamos el renderizado dinámico clásico (el habitual hasta Next.js 15).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
