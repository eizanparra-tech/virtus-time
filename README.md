# VIRTUS TIME

Aplicación de registro de horas para VIRTUS COMPANY (16 socios), inspirada en Clockify.

Este README explica lo que ya está construido (**Fases 1 a 3**): estructura del proyecto, diseño base, acceso por perfiles, base de datos, cronómetro, registro de horas, y gestión de proyectos, tareas y equipo. Las fases siguientes (dashboards y estadísticas, informes automáticos, calendario...) se construirán encima de esta base, una a una.

## Qué funciona ya de verdad

- Proyecto Next.js 16 + TypeScript + Tailwind CSS v4, desplegado en Vercel.
- Conexión a Supabase (solo como base de datos PostgreSQL; no se usan contraseñas).
- **Entrada por perfiles, sin contraseñas**: una pantalla con el nombre de cada socio; tocas el tuyo y entras. Un asistente de configuración inicial (`/setup`) crea el primer perfil (administrador), y solo funciona una vez.
- **Cronómetro**: elegir proyecto, escribir en qué trabajas (obligatorio), iniciar/pausar/reanudar/finalizar; el tiempo se calcula siempre a partir de una hora real guardada en el servidor, nunca inventado en el navegador. Solo puede haber un cronómetro activo por socio.
- **Registro manual de horas** y **Mis registros**: historial propio por día, con edición (descripción, fecha, duración) y borrado, guardando el historial de cambios.
- **Proyectos**: crear proyectos (admin), ver el detalle de cada uno, editarlo y asignarle socios.
- **Tareas**: crear tareas dentro de un proyecto, con responsable y fecha límite opcionales, cambiar su estado, y borrarlas (quien las creó o un administrador).
- **Equipo**: dar de alta nuevos socios desde la web (sin que tengan que crear nada ellos), activar/desactivar cuentas y asignar el rol de administrador.
- El menú lateral y la estructura visual de las 10 secciones de la aplicación (Dashboard, Cronómetro, Mis registros, Proyectos, Tareas, Equipo, Estadísticas, Informes semanales, Calendario, Configuración), adaptada a móvil.
- **Instalable como app**: tiene icono y configuración para que, desde el móvil, cualquiera pueda pulsar "Añadir a pantalla de inicio" y usarla como una app normal, sin pasar por ninguna tienda de aplicaciones.
- Un sistema de diseño propio (colores, tipografías, componentes) para que el resto de fases sean coherentes visualmente.

Estadísticas, Informes semanales y Calendario todavía muestran una pantalla "Próximamente en la Fase X": la estructura y la navegación ya funcionan, pero la funcionalidad de cada una se construye en su fase correspondiente.

### Sobre no usar contraseñas

Decidimos que cada socio entra eligiendo su nombre de una lista, sin contraseña. Es mucho más cómodo para 16 compañeros de confianza, pero significa que cualquiera que tenga el enlace podría entrar como si fuera otra persona. Si en algún momento queréis añadir algo de protección (por ejemplo, un PIN corto por persona), es un cambio pequeño y lo podemos añadir más adelante sin rehacer nada.

## Antes de nada: crea tu proyecto de Supabase

Supabase es la base de datos de VIRTUS TIME (guarda los perfiles, proyectos y horas). Es gratis para empezar. Tienes que crear tú la cuenta porque es tuya y de la empresa:

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (puedes usar tu correo o GitHub).
2. Crea un proyecto nuevo. Elige una región cercana (por ejemplo, Europa - Frankfurt). Guarda bien la contraseña de base de datos que te pida, por si la necesitas más adelante.
3. Cuando el proyecto esté listo, ve a **Project Settings → Data API** y copia la **Project URL**.
4. Ve a **Project Settings → API Keys** y copia la clave **`service_role`** (es secreta, no la compartas; no hace falta ninguna otra clave).
5. Ve a **SQL Editor**, pega el contenido completo del archivo [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) de este proyecto y pulsa "Run". Esto crea todas las tablas.

## Configura el proyecto en tu ordenador

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Copia el archivo de variables de entorno y rellénalo:
   ```bash
   cp .env.local.example .env.local
   ```
   Abre `.env.local` y rellena:
   - `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` con los datos de tu proyecto de Supabase.
   - `SESSION_SECRET`: una cadena aleatoria larga que protege la sesión de cada perfil. Genérala con `openssl rand -hex 32` (en la terminal) y pégala tal cual.
   - Deja `ANTHROPIC_API_KEY` y `CRON_SECRET` para más adelante (Fase 5).
3. Arranca la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```
4. Abre [http://localhost:3000](http://localhost:3000). Como todavía no hay ningún perfil, la aplicación te llevará directamente a **Configuración inicial**: escribes tu nombre y quedas como el primer administrador. A partir de ese momento, esa pantalla deja de estar disponible; el resto de socios entrarán por `/login` eligiendo su nombre (los añadirás tú desde la web en la Fase 3).

## Cómo tener un enlace real de internet (no solo en tu ordenador)

Lo de arriba (`localhost:3000`) solo funciona en tu ordenador, mientras lo tengas encendido. Para que los 16 socios puedan entrar desde su móvil con un enlace real (y poder instalarlo como app), hace falta publicarla en un sitio como **Vercel**:

1. Crea una cuenta gratis en [vercel.com](https://vercel.com) (puedes entrar con GitHub).
2. Conectamos este proyecto a tu cuenta de Vercel y ponemos ahí las mismas variables de `.env.local`.
3. Vercel te da un enlace del tipo `https://virtus-time.vercel.app` (o un dominio propio si tenéis uno), siempre encendido.
4. Desde el móvil, cualquiera abre ese enlace y pulsa "Añadir a pantalla de inicio" (Android) o "Compartir → Añadir a pantalla de inicio" (iPhone): les queda un icono de VIRTUS TIME como una app más.

Dime cuándo quieres que lo publiquemos — podemos hacerlo ya mismo con lo que hay construido, o esperar a tener más fases listas. Los dos servicios (Supabase y Vercel) tienen un plan gratuito que debería bastar para 16 socios.

## Cómo seguir trabajando en VS Code con Claude Code

1. Descarga el archivo `.zip` que te he enviado en la conversación y descomprímelo en la carpeta donde quieras tener el proyecto.
2. Ábrela con VS Code.
3. Sigue los pasos de "Configura el proyecto en tu ordenador" de arriba.
4. A partir de ahí, puedes pedirme que continúe con la **Fase 2** directamente desde VS Code.

(Alternativa: si conectas este chat a tu ordenador desde la app de escritorio de Claude, puedo escribir los archivos directamente en tu carpeta de proyecto la próxima vez, sin necesidad de descomprimir nada.)

## Estructura del proyecto

```
src/
  app/
    (auth)/login/        Pantalla "¿Quién eres?" (elegir perfil)
    (auth)/setup/        Configuración inicial (primer perfil)
    (app)/                Aplicación con sesión iniciada (menú lateral + páginas)
  components/
    ui/                   Botones, tarjetas, campos de formulario, etc.
    layout/                Menú lateral, cabecera, menú de usuario
  lib/
    session.ts             Sesión por cookie firmada (sin contraseñas)
    supabase/db.ts          Conexión con la base de datos (desde el servidor)
  types/
    database.types.ts      Tipos de la base de datos (en TypeScript)
  proxy.ts                 Protege las rutas privadas
supabase/
  migrations/0001_init.sql  Toda la base de datos: tablas e índices
public/
  manifest.webmanifest       Hace que la app se pueda instalar en el móvil
  icons/                      Iconos de la app
```

## Fases

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Base del proyecto, acceso por perfiles, base de datos | ✅ Hecho |
| 2 | Cronómetro, registro manual, descripciones libres | ✅ Hecho |
| 3 | Gestión de proyectos, tareas y equipo desde la web | ✅ Hecho |
| 4 | Dashboards y estadísticas | Pendiente |
| 5 | Informes automáticos semanales y conclusiones inteligentes | Pendiente |
| 6 | Histórico, calendario y exportaciones | Pendiente |
| 7 | Pruebas reales, seguridad y publicación | Pendiente |
