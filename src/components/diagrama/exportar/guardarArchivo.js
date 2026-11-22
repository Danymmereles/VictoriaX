// ===========================================================================
// Guardar un archivo eligiendo la carpeta.
//
// Con la API de acceso a archivos (Chrome, Edge, Opera) se abre el diálogo
// "Guardar como" del sistema. Hay que pedirlo apenas el usuario hace clic
// (el navegador solo lo permite durante un gesto del usuario), por eso se
// separa en dos pasos: elegir dónde y, después, escribir.
//
// Sin esa API (Firefox, Safari) se descarga como siempre: el navegador lo
// guarda en Descargas, o pregunta dónde si así está configurado.
// ===========================================================================

export const FORMATOS = {
    png: { tipo: "image/png", extension: ".png", descripcion: "Imagen PNG" },
    jpg: { tipo: "image/jpeg", extension: ".jpg", descripcion: "Imagen JPG" },
    json: { tipo: "application/json", extension: ".json", descripcion: "Diagrama (JSON)" },
};

export const puedeElegirCarpeta = () =>
    typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";

/*
 * Paso 1, durante el clic: abre "Guardar como".
 * Devuelve el destino, o null si el usuario canceló.
 */
export async function elegirDestino(nombre, formato) {
    const f = FORMATOS[formato];

    if (!puedeElegirCarpeta()) {
        return { tipo: "descarga", nombre };
    }

    try {
        const archivo = await window.showSaveFilePicker({
            suggestedName: nombre,
            types: [{ description: f.descripcion, accept: { [f.tipo]: [f.extension] } }],
        });

        return { tipo: "archivo", archivo, nombre: archivo.name };
    } catch (error) {
        if (error?.name === "AbortError") {
            return null;
        }

        // Bloqueado (p. ej. dentro de un iframe): descarga común
        return { tipo: "descarga", nombre };
    }
}

// Paso 2: escribe el contenido en el destino elegido
export async function guardarEn(destino, blob) {
    if (destino.tipo === "archivo") {
        const escritura = await destino.archivo.createWritable();
        await escritura.write(blob);
        await escritura.close();
        return;
    }

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = destino.nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Nombre de archivo seguro: "diagrama-Main.png"
export function nombreDeArchivo(base, formato) {
    const limpio = String(base)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return `${limpio || "diagrama"}${FORMATOS[formato].extension}`;
}
