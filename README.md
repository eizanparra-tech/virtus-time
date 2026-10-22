# VIRTUS TIME

Aplicación de registro de horas para VIRTUS COMPANY (16 socios), inspirada en Clockify.

Este README explica lo que ya está construido (**Fases 1 a 8**): estructura del proyecto, diseño base, acceso por perfiles, base de datos, cronómetro, registro de horas, gestión de proyectos/tareas/equipo, estadísticas, informes semanales automáticos, calendario, exportaciones, un repaso de seguridad y, desde la Fase 8, los dos modos de la aplicación (Reloj y Calendario) con las fechas clave. Lo único que queda es que el equipo la use de verdad (ver "Antes de usarla con todo el equipo" más abajo).

## Qué funciona ya de verdad

- Proyecto Next.js 16 + TypeScript + Tailwind CSS v4, desplegado en Vercel.
- Conexión a Supabase (solo como base de datos PostgreSQL; no se usan contraseñas).
- **Entrada por perfiles, sin contraseñas**: una pantalla con el nombre de cada socio; tocas el tuyo y entras. Un asistente de configuración inicial (`/setup`) crea el primer perfil (administrador), y solo funciona una vez.
- **Dos modos, elegidos desde /inicio** (Fase 8): justo después de elegir tu perfil (y cada vez que vuelves a entrar) ves dos logos grandes. **Reloj** abre la aplicación de toda la vida: cronómetro, mis registros, proyectos, equipo, estadísticas, informes semanales y configuración. **Calendario** abre el calendario, las tareas y las fechas clave. Para cambiar de uno a otro sin volver a `/inicio`, hay un pequeño interruptor arriba del menú lateral con los dos mismos iconos.
- **Cronómetro**: elegir proyecto, escribir en qué trabajas (obligatorio), iniciar/pausar/reanudar/finalizar; el tiempo se calcula siempre a partir de una hora real guardada en el servidor, nunca inventado en el navegador. Solo puede haber un cronómetro activo por socio.
- **Registro manual de horas** y **Mis registros**: historial propio por día, con edición (descripción, fecha, duración) y borrado, guardando el historial de cambios.
- **Proyectos**: crear proyectos (admin), ver el detalle de cada uno, editarlo y asignarle socios.
- **Tareas**: crear tareas dentro de un proyecto, con responsable y fecha límite opcionales, cambiar su estado, y borrarlas (quien las creó o un administrador).
- **Equipo**: dar de alta nuevos socios desde la web (sin que tengan que crear nada ellos), activar/desactivar cuentas y asignar el rol de administrador.
- **Estadísticas**: horas por proyecto, por socio (vista de empresa para administradores) y su evolución día a día o semana a semana, con un selector de periodo (esta semana / este mes / últimas 12 semanas) y la comparativa frente al periodo anterior. Todo calculado al momento a partir de los registros reales, con gráficos de Recharts.
- **Informes semanales**: cada lunes de madrugada se genera automáticamente (tarea programada en Vercel) el informe de la semana que acaba de terminar, con las horas reales por proyecto y por socio, y quién no registró nada. Un resumen escrito por IA describe esos mismos números en un párrafo, sin inventar causas ni juicios; si no hay clave de IA configurada, el informe se genera igual, solo que sin ese párrafo. Un administrador también puede generarlo o recalcularlo a mano desde la propia página. También se puede **exportar cualquier informe a PDF**.
- **Calendario**: el tiempo registrado en tres vistas (día, semana, mes), con un color distinto para cada proyecto; en la vista mes cada día muestra una mini barra de colores proporcional a las horas de cada proyecto. La vista semana compara el total con la semana anterior. Los administradores pueden ver el calendario de toda la empresa, no solo el suyo, y **corregir o borrar el registro de cualquier socio** desde ahí (no solo los propios). Desde cualquier vista se puede **exportar los registros del periodo a CSV o a Excel**. Desde la Fase 8, el calendario también marca los días con **tareas que vencen** y con **fechas clave** (ver siguiente punto).
- **Fechas clave** (Fase 8): avisos sueltos sobre una fecha importante — una entrega, una reunión, un hito — que no son una tarea de nadie en concreto, solo una marca en el calendario visible para toda la empresa. Cualquier socio puede añadir una (con un título, una fecha y, si quiere, un proyecto relacionado y una descripción); solo quien la creó o un administrador puede borrarla.
- **Panel de informes en Configuración** (solo administradores): el estado del último informe semanal generado, con enlace directo a verlo.
- El menú lateral y la estructura visual de las 11 secciones de la aplicación, repartidas en dos modos (Reloj: Dashboard, Cronómetro, Mis registros, Proyectos, Equipo, Estadísticas, Informes semanales, Configuración — Calendario: Calendario, Tareas, Fechas clave), adaptada a móvil.
- **Instalable como app**: tiene icono y configuración para que, desde el móvil, cualquiera pueda pulsar "Añadir a pantalla de inicio" y usarla como una app normal, sin pasar por ninguna tienda de aplicaciones. Respeta la zona del notch/barra de estado en los dispositivos que la tienen.
- Un sistema de diseño propio (colores, tipografías, componentes) para que toda la aplicación sea coherente visualmente.

### Sobre no usar contraseñas

Decidimos que cada socio entra eligiendo su nombre de una lista, sin contraseña. Es mucho más cómodo para 16 compañeros de confianza, pero significa que cualquiera que tenga el enlace podría entrar como si fuera otra persona. Si en algún momento queréis añadir algo de protección (por ejemplo, un PIN corto por persona), es un cambio pequeño y lo podemos añadir más adelante sin rehacer nada.

### Repaso de seguridad (Fase 7)

Antes de dar la aplicación por terminada se ha hecho un repaso completo:

- Se corrigió un fallo real: la tarea programada de los informes semanales quedaba bloqueada por la misma protección que exige haber iniciado sesión, así que nunca habría llegado a ejecutarse los lunes. Ya está arreglado y verificado.
- Se corrigió un enlace de inicio de sesión que, manipulado a mano, podía acabar redirigiendo fuera de la aplicación.
- Se ha revisado que cada acción que cambia datos (crear, editar, borrar, cambiar roles...) comprueba en el servidor quién la pide — nunca solo si el botón se ve o no en la pantalla — y que ninguna clave secreta llega nunca al navegador.
- Se ha añadido `robots.txt` para que los buscadores no indexen la aplicación (es privada, de uso interno).

### Importante: vuelve a ejecutar la migración SQL (Fase 8)

La Fase 8 añade una tabla nueva (`key_dates`, para las fechas clave). Antes de usarla, entra en el **SQL Editor** de tu proyecto de Supabase, pega de nuevo el contenido completo de [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) y pulsa "Run". Es seguro repetirlo aunque ya lo hubieras ejecutado antes: todo el archivo está escrito para no duplicar ni borrar nada que ya exista, solo añade lo que falte.

### Antes de usarla con todo el equipo

Esto ya no es código: es la propia prueba real con las 16 personas de VIRTUS COMPANY, y solo la podéis hacer vosotros.

1. Añade a los socios que falten desde **Equipo**.
2. Pide a 2-3 personas que la usen un día normal: cronómetro, registro manual, revisar sus horas.
3. Comprueba el lunes siguiente que el informe semanal se generó solo (o pruébalo a mano desde Informes semanales).
4. Si todo va bien, compártela con el resto del equipo.

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
   - `ANTHROPIC_API_KEY` y `CRON_SECRET` son para los informes semanales (Fase 5); si solo quieres probar la aplicación en tu ordenador puedes dejarlas vacías.
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
    (hub)/inicio/         Pantalla "¿qué modo abro?" (Reloj / Calendario)
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
| 4 | Dashboards y estadísticas | ✅ Hecho |
| 5 | Informes automáticos semanales y conclusiones inteligentes | ✅ Hecho |
| 6 | Histórico, calendario y exportaciones | ✅ Hecho |
| 7 | Pruebas reales, seguridad y publicación | ✅ Hecho (código); la prueba con el equipo la hacéis vosotros |
| 8 | Dos modos de la aplicación (Reloj / Calendario) y fechas clave | ✅ Hecho (código); recuerda volver a ejecutar la migración SQL |
