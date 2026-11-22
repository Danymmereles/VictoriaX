// ===========================================================================
// Fuentes para la imagen exportada.
//
// La imagen se arma como un SVG aparte, que no puede cargar fuentes de
// internet: si no se incrustan, el texto sale con la fuente del sistema.
// Acá se buscan las fuentes de Google que importa la app (index.css:
// Inter), se descargan y se incrustan como datos. Solo el subconjunto
// latino, que alcanza para el español.
//
// Si algo falla (sin conexión, bloqueo), sigue sin fuentes incrustadas.
// ===========================================================================

const ESPERA_MAXIMA = 4000;

let enCache = null;

async function descargar(url, como) {
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), ESPERA_MAXIMA);

    try {
        const respuesta = await fetch(url, { signal: control.signal, mode: "cors" });

        if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`);
        }

        return como === "texto" ? await respuesta.text() : await respuesta.blob();
    } finally {
        clearTimeout(reloj);
    }
}

const comoDataUrl = (blob) =>
    new Promise((resolver, rechazar) => {
        const lector = new FileReader();
        lector.onload = () => resolver(lector.result);
        lector.onerror = rechazar;
        lector.readAsDataURL(blob);
    });

// Hojas de Google Fonts que usa la página (@import o <link>)
function hojasDeFuentes() {
    const urls = new Set();

    for (const hoja of document.styleSheets) {
        if (hoja.href?.includes("fonts.googleapis.com")) {
            urls.add(hoja.href);
        }

        let reglas = [];
        try {
            reglas = hoja.cssRules;
        } catch {
            continue; // hoja de otro origen: no se puede leer
        }

        for (const regla of reglas) {
            if (regla.href?.includes("fonts.googleapis.com")) {
                urls.add(regla.href);
            }
        }
    }

    return [...urls];
}

// Deja solo las @font-face del subconjunto latino, con la fuente incrustada
async function incrustar(css) {
    const caras = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*{[^}]*})/g)]
        .filter(([, subconjunto]) => subconjunto === "latin")
        .map(([, , cara]) => cara);

    const resultado = await Promise.all(
        caras.map(async (cara) => {
            const url = cara.match(/url\(([^)]+)\)/)?.[1]?.replace(/["']/g, "");

            if (!url) {
                return "";
            }

            const datos = await comoDataUrl(await descargar(url, "blob"));
            return cara.replace(/url\([^)]+\)/, `url(${datos})`);
        })
    );

    return resultado.join("\n");
}

/*
 * CSS con las @font-face incrustadas (o "" si no se pudo).
 * Se calcula una vez y queda en memoria.
 */
export async function cssDeFuentes() {
    if (enCache !== null) {
        return enCache;
    }

    try {
        const hojas = await Promise.all(
            hojasDeFuentes().map(async (url) => incrustar(await descargar(url, "texto")))
        );
        enCache = hojas.join("\n");
    } catch {
        enCache = "";
    }

    return enCache;
}
