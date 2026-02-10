

# Navegacion Superior - Solo Iconos con Tooltips

## Problema

El boton activo "Dashboard" (con estilo premium/gradiente) es tan ancho que se superpone visualmente con el logo "ScentGenAI". Los demas botones tambien contribuyen a la saturacion visual del menu.

## Solucion

Eliminar todos los textos de los botones de navegacion y dejar **solo iconos**. Al pasar el raton por encima de cada icono, aparecera un **tooltip elegante** con el nombre de la seccion. Esto es limpio, escalable y coherente con la estetica premium.

---

## Cambios

### `src/components/Layout.tsx`

1. Importar `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` de los componentes UI
2. Eliminar los `<span>` con los labels de texto de cada boton de navegacion
3. Cambiar todos los botones de nav a `size="icon"` (cuadrados, compactos)
4. Envolver cada boton en un `Tooltip` que muestra el label al hacer hover
5. Tambien aplicar tooltip al boton de Sign Out (eliminar su texto)
6. Envolver todo el nav en `TooltipProvider`

**Resultado visual:**
```text
[Logo ScentGenAI]          [icono][icono][icono][icono][icono][icono] | [avatar][icono-logout]
```

Cada icono, de un tamaño mayor al actual, mostrara su nombre al pasar el raton por encima con un tooltip elegante.

---

## Detalles Tecnicos

- Se usara el componente `Tooltip` de Radix UI ya existente en el proyecto (`src/components/ui/tooltip.tsx`)
- Los botones pasaran de `size="sm"` a `size="icon"` (42x42px) para consistencia
- Se eliminara la clase `gap-2` ya que no habra texto junto al icono
- El tooltip usara un `delayDuration` corto (200ms) para respuesta rapida
- El estilo premium del boton activo se mantiene pero al ser solo icono, sera compacto y no invadira el logo

### Archivo modificado:
- `src/components/Layout.tsx`

Adicionalmente, los cambios anteriores de trending topics en la seccion Trends, no se han aplicado. Tienes que aplicarlos sin costes de creditos!