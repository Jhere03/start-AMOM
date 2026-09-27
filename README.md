# start-AMOM ✦ Para dedicar

Una web de dedicatoria: un ramo de **flores amarillas dibujado como constelación** en un cielo nocturno.
Cada pétalo de la flor principal guarda un motivo por el que amas a esa persona.

## Personalizar (un solo archivo)

Edita [`config/dedicatoria.ts`](config/dedicatoria.ts):

```ts
export const NOMBRE = "Amor";            // ← el nombre aparece en toda la web
export const FIRMA = "Con todo mi amor"; // firma final ("" para ocultarla)
export const MOTIVOS = [ ... ];          // un motivo por pétalo
```

El nombre aparece en la pantalla de apertura, el mensaje principal, el centro de la flor (su inicial),
el título de la pestaña, la sección de motivos, el cierre y el pie de página.
La flor principal tiene tantos pétalos como motivos (se recomiendan de 6 a 12).

## Ejecutar

Requiere [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
npm run dev      # http://localhost:3000
```

## Publicar gratis

Sube el repositorio a GitHub e impórtalo en [Vercel](https://vercel.com/new): se despliega sin configurar nada
y te da un enlace para compartir.

## Tecnología

Next.js · TypeScript · Tailwind CSS · shadcn/ui · framer-motion · lucide-react
