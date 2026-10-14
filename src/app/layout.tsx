import type { Metadata } from "next";
// Tipografías autoalojadas (no dependen de Google Fonts en el momento de
// compilar ni en producción): se descargan como paquetes npm normales.
import "@fontsource-variable/manrope";
import "@fontsource-variable/fraunces";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIRTUS TIME",
  description: "Registro de horas y estadísticas de VIRTUS COMPANY",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
