// ===========================================================================
// Imagen (PNG o JPG) de la página del diagrama que se está viendo.
//
// Sin dependencias: se copia el contenido del lienzo de React Flow con
// todos sus estilos ya calculados (colores del tema, tamaños, posiciones),
// se lo mete en un SVG (foreignObject) y se lo dibuja en un canvas.
// Es la misma técnica que usa la librería html-to-image.
//
//   - Sale el diagrama entero, no solo lo que entra en pantalla, a tamaño
//     real (zoom 1) y al doble de resolución para que el texto se lea bien.
//   - Sin los elementos de edición: puntos de conexión, manijas de las
//     flechas, rectángulo de selección. La selección se saca antes de
//     llamar a esta función (ver Diagrama.jsx).
//   - Fondo: el que se ve en pantalla (tema claro u oscuro), sin la grilla
//     de puntos (ver colorDeFondo).
// ===========================================================================

import { cssDeFuentes } from "./fuentes.js";

const MARGEN = 32;
const ESCALA = 2;
const CALIDAD_JPG = 0.95;
// Tope de píxeles del canvas (los navegadores fallan con imágenes enormes)
const MAXIMO_PIXELES = 40_000_000;

// Lo que no va en la imagen
const EXCLUIR = [
    ".react-flow__handle",
    ".react-flow__edge-interaction",
    ".react-flow__nodesselection",
    ".react-flow__selection",
    ".edge-handle",
    ".edge-guides",
    ".flow-node__notice",
    "input",
    "textarea",
].join(",");

// Propiedades que no hace falta copiar (animaciones, cursor...)
const OMITIR = /^(transition|animation|cursor|will-change|pointer-events|caret|-webkit-tap)/;

function copiarEstilos(original, copia) {
    const calculado = getComputedStyle(original);
    let estilo = "";

    for (let i = 0; i < calculado.length; i++) {
        const propiedad = calculado[i];

        if (!OMITIR.test(propiedad)) {
            estilo += `${propiedad}:${calculado.getPropertyValue(propiedad)};`;
        }
    }

    copia.setAttribute("style", estilo);
}

function clonarConEstilos(original) {
    if (original.nodeType === Node.TEXT_NODE) {
        return original.cloneNode(false);
    }

    if (original.nodeType !== Node.ELEMENT_NODE || original.matches(EXCLUIR)) {
        return null;
    }

    const copia = original.cloneNode(false);
    copiarEstilos(original, copia);

    original.childNodes.forEach((hijo) => {
        const c = clonarConEstilos(hijo);
        if (c) copia.appendChild(c);
    });

    return copia;
}

/*
 * Rectángulo que ocupa el diagrama, en coordenadas del lienzo:
 * nodos y flechas, con su zoom y desplazamiento actuales descontados.
 */
function limitesDelDiagrama(flujo, viewport) {
    const caja = flujo.getBoundingClientRect();
    const { a: zoom, e: dx, f: dy } = new DOMMatrixReadOnly(getComputedStyle(viewport).transform);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    viewport
        .querySelectorAll(".react-flow__node, .react-flow__edge-path, .flow-node__badge")
        .forEach((elemento) => {
            const r = elemento.getBoundingClientRect();

            if (r.width === 0 && r.height === 0) return;

            minX = Math.min(minX, (r.left - caja.left - dx) / zoom);
            minY = Math.min(minY, (r.top - caja.top - dy) / zoom);
            maxX = Math.max(maxX, (r.right - caja.left - dx) / zoom);
            maxY = Math.max(maxY, (r.bottom - caja.top - dy) / zoom);
        });

    if (minX === Infinity) {
        return null;
    }

    return { x: minX - MARGEN, y: minY - MARGEN, ancho: maxX - minX + 2 * MARGEN, alto: maxY - minY + 2 * MARGEN };
}

// ¿El color tapa lo que está detrás? (alfa 1)
function esOpaco(color) {
    if (!color || color === "transparent") return false;
    const partes = color.match(/[\d.]+/g);
    if (/^rgba/.test(color) || color.includes("/")) {
        return Boolean(partes) && Number(partes[partes.length - 1]) >= 1;
    }
    return true;
}

// Color CSS cualquiera (p. ej. "hsl(0 0% 100%)") → "rgb(...)" calculado
function normalizarColor(color) {
    const prueba = document.createElement("div");
    prueba.style.backgroundColor = color;
    document.body.appendChild(prueba);
    const calculado = getComputedStyle(prueba).backgroundColor;
    prueba.remove();
    return calculado;
}

/*
 * El fondo que se ve en pantalla. React Flow lo pinta en la capa de la
 * grilla (.react-flow__background) con --xy-background-color, y el
 * contenedor queda transparente: se toma el primero que sea opaco. Sin
 * esto el fondo sale transparente, que en JPG se ve negro.
 */
function colorDeFondo(flujo) {
    const candidatos = [flujo.querySelector(".react-flow__background"), flujo]
        .filter(Boolean)
        .map((el) => getComputedStyle(el).backgroundColor);

    const variable = getComputedStyle(flujo).getPropertyValue("--xy-background-color").trim();
    if (variable) {
        candidatos.push(normalizarColor(variable));
    }

    for (let el = flujo.parentElement; el; el = el.parentElement) {
        candidatos.push(getComputedStyle(el).backgroundColor);
    }

    return candidatos.find(esOpaco) ?? "#ffffff";
}

const cargarImagen = (url) =>
    new Promise((resolver, rechazar) => {
        const imagen = new Image();
        imagen.onload = () => resolver(imagen);
        imagen.onerror = () => rechazar(new Error("No se pudo dibujar el diagrama."));
        imagen.src = url;
    });

/*
 *   flujo:   el elemento .react-flow
 *   formato: "png" | "jpg"
 * Devuelve un Blob con la imagen.
 */
export async function imagenDelDiagrama(flujo, formato) {
    const viewport = flujo.querySelector(".react-flow__viewport");
    const limites = viewport && limitesDelDiagrama(flujo, viewport);

    if (!limites) {
        throw new Error("La página está vacía.");
    }

    const { x, y, ancho, alto } = limites;
    const fondo = colorDeFondo(flujo);

    // Copia del contenido, sin zoom ni desplazamiento: el diagrama queda
    // con su esquina en (0, 0)
    const copia = clonarConEstilos(viewport);
    copia.style.transform = `translate(${-x}px, ${-y}px)`;
    copia.style.transformOrigin = "0 0";
    copia.style.position = "absolute";
    copia.style.left = "0";
    copia.style.top = "0";

    const contenedor = document.createElement("div");
    contenedor.setAttribute(
        "style",
        `position:relative;overflow:hidden;width:${ancho}px;height:${alto}px;background:${fondo};`
    );

    // Puntas de flecha definidas fuera del lienzo (EdgeMarkers): se
    // copian para que las flechas las encuentren
    const marcadores = new Set(
        [...document.querySelectorAll("marker")]
            .map((m) => m.closest("svg"))
            .filter((s) => s && !viewport.contains(s))
    );
    marcadores.forEach((svgDeMarcadores) => {
        const defs = clonarConEstilos(svgDeMarcadores);
        defs.style.position = "absolute";
        defs.style.width = "0";
        defs.style.height = "0";
        contenedor.appendChild(defs);
    });

    contenedor.appendChild(copia);

    const fuentes = await cssDeFuentes();
    const html = new XMLSerializer().serializeToString(contenedor);
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}">` +
        (fuentes ? `<style>${fuentes}</style>` : "") +
        `<foreignObject x="0" y="0" width="100%" height="100%">${html}</foreignObject></svg>`;

    const imagen = await cargarImagen(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);

    const escala = Math.min(ESCALA, Math.sqrt(MAXIMO_PIXELES / (ancho * alto)));
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(ancho * escala);
    canvas.height = Math.ceil(alto * escala);

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(escala, escala);
    ctx.drawImage(imagen, 0, 0, ancho, alto);

    const tipo = formato === "jpg" ? "image/jpeg" : "image/png";

    return new Promise((resolver, rechazar) => {
        canvas.toBlob(
            (blob) => (blob ? resolver(blob) : rechazar(new Error("No se pudo crear la imagen."))),
            tipo,
            CALIDAD_JPG
        );
    });
}
