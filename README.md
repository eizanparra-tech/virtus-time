# VIRTUS TIME

Aplicación de registro de horas para VIRTUS COMPANY (16 socios), inspirada en Clockify.

Este README explica la **Fase 1**: estructura del proyecto, diseño base, autenticación y base de datos. Las fases siguientes (cronómetro, gestión de proyectos, dashboards, informes automáticos, calendario...) se construirán encima de esta base, una a una.

## Qué incluye la Fase 1

- Proyecto Next.js 16 + TypeScript + Tailwind CSS v4, listo para desplegar en Vercel.
- Conexión a Supabase (base de datos PostgreSQL + autenticación).
- Base de datos completa con todas las tablas que usará la aplicación (socios, proyectos, tareas, registros de tiempo, historial de cambios, informes semanales) protegida con Row Level Security.
- Inicio de sesión con correo y contraseña.
- Un asistente de configuración inicial (`/setup`) para crear la cuenta del primer administrador, de forma seguro: solo funciona una vez.
- El menú lateral y la estructura visual de las 10 secciones de la aplicación (Dashboard, Cronómetro, Mis registros, Proyectos, Tareas, Equipo, Estadísticas, Informes semanales, Calendario, Configuración), adaptada a móvil.
- Un sistema de diseño propio (colores, tipografías, componentes) para que el resto de fases sean coherentes visualmente.

Todas las secciones salvo el Dashboard muestran de momento una pantalla "Próximamente en la Fase X": la estructura y la navegación ya funcionan, pero la funcionalidad de cada una se construye en su fase correspondiente, como pediste.

## Antes de nada: crea tu proyecto de Supabase

Supabase es la base de datos (y el sistema de login) de VIRTUS TIME. Es gratis para empezar. Tienes que crear tú la cuenta porque es tuya y de la empresa:

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (puedes usar tu correo o GitHub).
2. Crea un proyecto nuevo. Elige una región cercana (por ejemplo, Europa - Frankfurt). Guarda bien la contraseña de base de datos que te pida, por si la necesitas más adelante.
3. Cuando el proyecto esté listo, ve a **Project Settings → Data API** y copia la **Project URL**.
4. Ve a **Project Settings → API Keys** y copia la clave **`anon public`** y la clave **`service_role`** (esta última es secreta, no la compartas).
5. Ve a **SQL Editor**, pega el contenido completo del archivo [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) de este proyecto y pulsa "Run". Esto crea todas las tablas y la seguridad de la base de datos.

## Configura el proyecto en tu ordenador

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Copia el archivo de variables de entorno y rellénalo con los datos de tu proyecto de Supabase del paso anterior:
   ```bash
   cp .env.local.example .env.local
   ```
   Abre `.env.local` y rellena `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`. Deja `ANTHROPIC_API_KEY` y `CRON_SECRET` para más adelante (Fase 5).
3. Arranca la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```
4. Abre [http://localhost:3000](http://localhost:3000) en el navegador. Como todavía no hay ningún administrador, la aplicación te llevará directamente a la pantalla **Configuración inicial**: ahí creas tu cuenta (quedará como administrador). A partir de ese momento, esa pantalla deja de estar disponible y el resto de personas entrarán por `/login`.

## Cómo seguir trabajando en VS Code con Claude Code

Este proyecto se ha creado en un espacio de trabajo en la nube. Para continuar trabajando en él desde tu VS Code local con Claude Code:

1. Descarga el archivo `.zip` que te he enviado en la conversación y descomprímelo en la carpeta donde quieras tener el proyecto.
2. Ábrela con VS Code.
3. Sigue los pasos de "Configura el proyecto en tu ordenador" de arriba.
4. A partir de ahí, puedes pedirme que continúe con la **Fase 2** (cronómetro y registro manual) directamente desde VS Code.

(Alternativa: si conectas este chat a tu ordenador desde la app de escritorio de Claude, puedo escribir los archivos directamente en tu carpeta de proyecto la próxima vez, sin necesidad de descomprimir nada.)

## Estructura del proyecto

```
src/
  app/
    (auth)/login/        Inicio de sesión
    (auth)/setup/        Configuración inicial (primer administrador)
    (app)/                Aplicación con sesión iniciada (menú lateral + páginas)
  components/
    ui/                   Botones, tarjetas, campos de formulario, etc.
    layout/                Menú lateral, cabecera, menú de usuario
  lib/
    supabase/              Conexión con Supabase (navegador, servidor, administrador)
  types/
    database.types.ts      Tipos de la base de datos (en TypeScript)
  proxy.ts                 Protege las rutas privadas y mantiene la sesión activa
supabase/
  migrations/0001_init.sql  Toda la base de datos: tablas y seguridad (RLS)
```

## Publicar en Vercel (cuando llegue el momento)

Lo veremos con detalle en la Fase 7, pero en resumen: conectarás este proyecto a Vercel, pondrás las mismas variables de entorno que tienes en `.env.local` en la configuración de Vercel, y cada vez que haya cambios se publicarán automáticamente. Los servicios usados (Supabase y Vercel) tienen un plan gratuito que debería ser suficiente para 16 socios; te avisaré con tiempo si en algún momento conviene pasar a un plan de pago.

## Próximas fases

| Fase | Contenido |
|---|---|
| 2 | Cronómetro, registro manual, descripciones libres |
| 3 | Gestión de proyectos, tareas y socios desde la web |
| 4 | Dashboards y estadísticas |
| 5 | Informes automáticos semanales y conclusiones inteligentes |
| 6 | Histórico, calendario y exportaciones |
| 7 | Pruebas reales, seguridad y publicación |
