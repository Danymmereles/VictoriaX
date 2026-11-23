// ===========================================================================
// PROGRAMA: el JSON que describe un diagrama listo para interpretar.
// Lógica pura. Lo arma el editor (components/diagrama/ejecucion/
// armarPrograma.js) y lo lee el motor (cargar.js).
//
// {
//   formato: "victoriax-programa", version: 1, creado: "<fecha ISO>",
//   inicio: "<id de la página Main>",
//   variables: [                      // tabla de Main (sin los Random)
//     { nombre, valorInicial: <número>,
//       esVector?: true, dimension?: { tipo: "fijo", valor: 3 }
//                                   | { tipo: "variable", variable: "N" } }
//   ],
//   randoms: ["R1", "R2"],             // variables de los nodos Random
//   paginas: [
//     { id, tipo: "main" | "fdp" | "subrutina", nombre,
//       parametros?: ["A", "B"],       // solo subrutinas
//       inicio: "<id del primer nodo>",
//       nodos: [
//         { id, tipo, subtipo?, texto, arbol, siguiente | si + no }
//       ] }
//   ]
// }
//
// Nodos (arbol: ver lib/lenguaje/ast.js):
//   contexto         sentencias; siguiente          (solo Main, es el inicio)
//   asignacion       sentencias; siguiente
//   decision         expresión;  si, no
//   resultado        lista de nombres; siguiente
//   funcionGenerada  subtipo "fdp" (llama a la página de datos con ese
//                    nombre), "subrutina" (firma; llama a la página de la
//                    subrutina) o "random" (R1); siguiente
//   fin              sin salidas
// Los Conectores ya vienen resueltos: no aparecen.
//
// Las expresiones pueden tener llamadas a funciones ({ tipo: "llamada" });
// en esta versión no hay ninguna (ver lib/motor/runtime/funciones.js) y el
// compilador rechaza una que no conozca.
//
// validarPrograma(json) → lista de problemas (vacía si se puede cargar).
// Es la verificación del cargador: no confía en quien armó el JSON.
// ===========================================================================

export const FORMATO_PROGRAMA = "victoriax-programa";
export const VERSION_PROGRAMA = 1;

const TIPOS_DE_NODO = ["contexto", "asignacion", "decision", "resultado", "funcionGenerada", "fin"];
const SUBTIPOS = ["fdp", "subrutina", "random"];

export class ErrorDePrograma extends Error {
    constructor(problemas) {
        super(`El programa no se puede cargar: ${problemas.join(" ")}`);
        this.problemas = problemas;
    }
}

export function validarPrograma(json) {
    const problemas = [];
    const p = (mensaje) => problemas.push(mensaje);

    if (!json || json.formato !== FORMATO_PROGRAMA) {
        return [`No es un programa de VictoriaX (formato "${json?.formato}").`];
    }

    if (json.version !== VERSION_PROGRAMA) {
        return [`Versión ${json.version} no soportada (se espera ${VERSION_PROGRAMA}).`];
    }

    if (!Array.isArray(json.paginas) || !Array.isArray(json.variables)) {
        return ["Faltan las páginas o las variables."];
    }

    const paginas = new Map(json.paginas.map((pagina) => [pagina.id, pagina]));

    if (paginas.get(json.inicio)?.tipo !== "main") {
        p("El inicio no es la página Main.");
    }

    const nombres = (tipo) =>
        new Set(json.paginas.filter((pagina) => pagina.tipo === tipo).map((pagina) => pagina.nombre));
    const fdps = nombres("fdp");
    const subrutinas = nombres("subrutina");

    json.paginas.forEach((pagina) => {
        const ids = new Set(pagina.nodos.map((nodo) => nodo.id));
        const en = `(página ${pagina.nombre})`;

        if (!ids.has(pagina.inicio)) {
            p(`El inicio no es un nodo de la página ${en}.`);
        }

        pagina.nodos.forEach((nodo) => {
            if (!TIPOS_DE_NODO.includes(nodo.tipo)) {
                p(`Nodo ${nodo.id} de tipo desconocido "${nodo.tipo}" ${en}.`);
                return;
            }

            const destinos =
                nodo.tipo === "fin" ? [] : nodo.tipo === "decision" ? [nodo.si, nodo.no] : [nodo.siguiente];

            destinos.forEach((destino) => {
                if (!ids.has(destino)) p(`El nodo ${nodo.id} sigue hacia ${destino}, que no existe ${en}.`);
            });

            if (nodo.tipo !== "fin" && !nodo.arbol) {
                p(`El nodo ${nodo.id} no tiene árbol ${en}.`);
            }

            if (nodo.tipo === "funcionGenerada") {
                if (!SUBTIPOS.includes(nodo.subtipo)) {
                    p(`Función Generada ${nodo.id} sin subtipo válido ${en}.`);
                } else if (nodo.subtipo === "fdp" && !fdps.has(nodo.arbol?.nombre)) {
                    p(`La fdp ${nodo.arbol?.nombre} no tiene página ${en}.`);
                } else if (nodo.subtipo === "subrutina" && !subrutinas.has(nodo.arbol?.nombre)) {
                    p(`La subrutina ${nodo.arbol?.nombre} no tiene página ${en}.`);
                }
            }
        });
    });

    return problemas;
}
