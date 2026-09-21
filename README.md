# AI WEEKLY — by Luis Martínez Plano

Portal editorial estático sobre inteligencia artificial. HTML, CSS y JavaScript puro, sin frameworks, fuentes remotas, dependencias de ejecución ni paso de compilación necesario para GitHub Pages.

## Páginas

- `index.html`: portada y selección de la edición más reciente.
- `archive.html`: histórico con búsqueda y filtros.
- `editions/2026-09-14.html`: edición #01, semana del 14 al 20 de septiembre de 2026.
- `assets/styles.css` y `assets/app.js`: diseño responsive, tema claro/oscuro, búsqueda y filtros combinables.
- `data/editions.json`: índice de ediciones.
- `data/2026-09-14.json`: contenido editorial, análisis y fuentes de la primera edición.
- `.nojekyll`: publicación directa de archivos estáticos.

Las páginas contienen todo el contenido: navegación y lectura funcionan sin JavaScript. El JavaScript añade búsqueda insensible a tildes, filtros, contador y estado vacío, y guarda el tema localmente cuando el navegador lo permite. No hay analítica ni formularios que recojan datos.

## Navegación histórica automática

El JavaScript compartido añade **Ediciones ▾** al header de portada, archivo y todas las ediciones, sin modificar el contenido de las páginas históricas. Lee `data/editions.json` al abrir cada página y ordena las ediciones por `startDate`, de más reciente a más antigua. La edición mostrada se marca como activa; en portada se identifica mediante el enlace principal a la edición, y en el archivo no se marca ninguna.

Dentro de cada edición, la navegación inferior calcula la edición anterior (más antigua) y la siguiente (más reciente) a partir del mismo índice. Los extremos sin edición disponible se muestran desactivados. No se generan ediciones ficticias para completar la navegación.

El selector admite Tab, Enter/Espacio, flecha abajo y Escape; se cierra al hacer clic fuera o mover el foco fuera. Si falla la carga del índice, conserva un enlace al archivo y muestra un mensaje. Sin JavaScript, siguen disponibles los enlaces estáticos al archivo. La carga del JSON requiere HTTP(S): para probarla localmente, usar `node scripts/preview.mjs` en vez de abrir un archivo `file://`.

Las rutas se resuelven desde `assets/app.js`, de modo que funcionan bajo `/ai-weekly/` y desde `editions/`. Al añadir una edición al JSON y publicar su HTML, el selector y las relaciones se actualizan sin regenerar las páginas históricas. No hay que editar el menú manualmente.

## Vista local

Abrir `index.html` directamente o servir la carpeta con cualquier servidor estático. Con Node.js instalado, `node scripts/preview.mjs` sirve el sitio en `http://127.0.0.1:4173/ai-weekly/`, reproduciendo la subruta de GitHub Pages. No requiere instalar paquetes.

## Publicación en GitHub Pages

1. Subir estos archivos a `main` en `luismrtnz/ai-weekly`.
2. En GitHub, abrir **Settings → Pages → Build and deployment**.
3. Seleccionar **Deploy from a branch**, rama **main**, carpeta **/ (root)** y guardar.
4. Consultar el despliegue en Actions. La URL esperada es `https://luismrtnz.github.io/ai-weekly/`.

Todas las rutas del portal son relativas; no requieren dominio propio ni reescrituras. El repositorio no necesita una dependencia de Node para publicarse: los HTML generados están versionados.

## Añadir una edición sin borrar el histórico

1. Crear `data/AAAA-MM-DD.json` con el mismo esquema que la primera edición: `articles` y `watch`. Cada artículo tiene un `id` único, `section` (`actualidad`, `developer`, `negocio` o `politica`), categorías, título, resumen, `why`, etiqueta, fuente y URL.
2. **Añadir** un registro a `data/editions.json`, conservando todos los existentes. Usar como `slug` el lunes de la semana; indicar número, fechas, título, resumen, `url`, `content` y categorías. `url` debe apuntar a `editions/AAAA-MM-DD.html`.
3. Ejecutar `node scripts/build.mjs`. Actualiza `index.html` y `archive.html` y crea las páginas nuevas. Las ediciones HTML existentes se conservan sin sobrescribirse.
4. Revisar contenido, fuentes, fechas, navegación, filtros y vista móvil. Ejecutar `node scripts/check.mjs` para comprobar rutas locales, fragmentos e índice.
5. Hacer commit y push a `main`. GitHub Pages publicará los archivos si ya está activado.

Para una corrección deliberada en una edición existente, editar su JSON y ejecutar `node scripts/build.mjs --update=AAAA-MM-DD`. Documentar las correcciones editoriales relevantes. No reutilizar slugs ni borrar páginas publicadas. Los estilos y JavaScript compartidos pueden evolucionar sin cambiar el contenido histórico.

## Criterio editorial

La edición #01 se cierra el 20 de septiembre y se publica el 21. Cada noticia enlaza su fuente. «Por qué importa» es interpretación editorial. Las previsiones se identifican como tales y las variaciones bursátiles indican la sesión, no un rendimiento semanal. PyTorch 2.14 y la guía de supervisión humana se incluyen como seguimiento/contexto, sin atribuirles un lanzamiento dentro de la semana.

El generador es una herramienta de mantenimiento opcional escrita con módulos nativos de Node.js (18 o posterior); no añade frameworks al portal.
