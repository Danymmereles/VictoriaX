// ===========================================================================
// Revisión completa antes de ejecutar (botón Ejecutar). Lógica pura.
//
// Junta, para TODAS las páginas (no solo la que se está viendo):
//   1. caminos.js       un punto de salida con varias flechas;
//   2. los controles del editor: sintaxis y uso de variables
//      (validacion.js), nodos para completar y llamadas (pages.js);
//   3. armarPrograma.js salidas sin conectar, Conectores, nodos vacíos,
//      Entrada y Entrada / Salida, páginas sin Fin; y arma el programa.
//
// revisarDiagrama({ foto, paginas, variables }) → { errores, programa }
//   foto:      fotoDelDiagrama(...)
//   paginas:   las páginas del editor (derivarPaginas)
//   variables: la tabla con los Random (todasLasVariables)
// Si hay errores, programa es null y no se ejecuta.
// ===========================================================================

import { problemasDeNodos } from "../pages.js";
import { problemasDeSintaxis } from "../validacion.js";

import { armarPrograma } from "./armarPrograma.js";
import { describirNodo, revisarCaminos } from "./caminos.js";

export function revisarDiagrama({ foto, paginas, variables }) {
    const errores = revisarCaminos(foto);
    const conProblema = new Set();

    foto.forEach((paginaFoto) => {
        const pagina = paginas.find((p) => p.id === paginaFoto.id);
        const nodos = new Map(paginaFoto.nodes.map((node) => [node.id, node]));

        const problemas = {
            ...problemasDeSintaxis({ nodes: paginaFoto.nodes, pagina, paginas, variables }),
            ...problemasDeNodos({ nodes: paginaFoto.nodes, pagina, paginas }),
        };

        Object.entries(problemas).forEach(([nodoId, mensaje]) => {
            conProblema.add(nodoId);
            errores.push({
                paginaId: paginaFoto.id,
                pagina: paginaFoto.firma ?? paginaFoto.nombre,
                nodoId,
                mensaje: `${describirNodo(nodos.get(nodoId))}: ${mensaje}`,
            });
        });
    });

    const armado = armarPrograma({ paginas: foto, variables });

    // Un error de texto ya informado por el editor no se repite
    armado.errores
        .filter((e) => !(e.clase === "sintaxis" && conProblema.has(e.nodoId)))
        .forEach(({ clase, ...e }) => errores.push(e));

    return { errores, programa: errores.length ? null : armado.programa };
}
