// ===========================================================================
// Validación del texto de los nodos con la BNF (v0.15, ver lib/lenguaje).
// Lógica pura, sin React.
//
// problemasDeSintaxis({ nodes, pagina, paginas, variables }) → { [nodeId]: mensaje }
//
// Dos pasos por nodo:
//   1. Sintaxis: el texto respeta la gramática de su tipo de nodo.
//   2. Uso de las variables (si la sintaxis está bien):
//      - en Main, cada nombre tiene que estar en la tabla de variables
//        o ser una variable de datos;
//      - el Contexto solo cambia variables de la tabla (valores iniciales);
//      - una variable de datos solo se asigna en su propia pestaña;
//      - un vector se usa con índice (TPS[I]) y una variable común sin él.
//        En el Resultado el vector va entero (TPS);
//      - a un Random (R1) no se le asigna un valor;
//      - una Subrutina no choca con otro nombre, usa los mismos parámetros
//        que su pestaña y no se llama a sí misma (funcionGenerada.js);
//      - el Para (v0.16) crea su variable: en su página se puede usar
//        aunque no esté en la tabla. No puede ser una variable de datos,
//        un Random, una subrutina ni un vector.
//   En las pestañas de las variables de datos y de las subrutinas no se
//   exige que los nombres estén en la tabla (pueden usar variables propias).
//
// Los nodos vacíos no se marcan (todavía no se escribieron). La Entrada
// no tiene sintaxis por ahora; Salida y Entrada / Salida ya no existen. Los nodos
// pendientes y las llamadas tienen sus propios mensajes (pages.js), que
// tienen prioridad: ver Diagrama.jsx.
// ===========================================================================

import { analizar, esNombreDeRandom } from "@/lib/lenguaje";
import { MAIN_PAGE_ID } from "./pages.js";
import { problemaDeSubrutina } from "./funcionGenerada.js";
import { PARTES_DEL_PARA } from "@/lib/lenguaje";
import { analizarNodoPara, esPara, paraVacio, variablesDeLosPara } from "./para/para.js";

// Tipo de nodo → regla de la BNF
const REGLA_POR_TIPO = {
    decision: "decision",
    process: "asignacion",
    context: "contexto",
    document: "resultado",
    connector: "etiqueta",
    // Función Generada (v0.15). La fdp se revisa en pages.js
    subroutine: "subrutina",
    random: "random",
};

export const reglaDeNodo = (node) => {
    // v0.17: el inicio de la pestaña es la firma; los demás nodos la
    // llaman y pueden guardar lo que devuelve (IN = calcular())
    if (node?.data?.type === "subroutine" && !node.data.anchorOf) {
        return "llamada";
    }
    return REGLA_POR_TIPO[node?.data?.type] ?? null;
};

// v0.17: el Fin de una subrutina devuelve algo (obligatorio)
const FALTA_RETORNO =
    "Escribí lo que devuelve la subrutina: una variable o un valor (por ejemplo, I o 0). Quien la llama lo guarda con IN = nombre().";


// Los nodos se revisan cada vez que cambia la página (también al moverlos):
// el análisis de cada texto se guarda para no repetirlo.
const cache = new Map();
const LIMITE_CACHE = 500;

function analizarConCache(texto, regla) {
    const clave = `${regla}\u0000${texto}`;

    if (!cache.has(clave)) {
        if (cache.size >= LIMITE_CACHE) {
            cache.delete(cache.keys().next().value);
        }
        cache.set(clave, analizar(texto, regla));
    }

    return cache.get(clave);
}

const conLinea = (mensaje, linea, regla) =>
    (regla === "asignacion" || regla === "contexto") && linea > 1
        ? `Línea ${linea}: ${mensaje}`
        : mensaje;


/*
 * Problema de uso de variables de un nodo ya analizado, o null.
 *   tabla:   Map nombre → variable de la tabla ({ esVector, esRandom })
 *   datos:   Set de nombres de variables de datos
 *   contexto: { subrutinas, ocupados } para los nodos Subrutina
 */
function problemaDeUso({ node, usos, regla, pagina, tabla, datos, contexto, contadores = new Set() }) {
    const enMain = pagina.id === MAIN_PAGE_ID;
    // Los Para de la página crean su variable (no hace falta en la tabla)
    const existe = (nombre) => tabla.has(nombre) || datos.has(nombre) || contadores.has(nombre);

    if (regla === "subrutina") {
        // El ancla es la definición: no se compara consigo misma
        return null;
    }

    if (regla === "llamada") {
        const problema = problemaDeSubrutina({ firma: usos.subrutina, pagina, ...contexto });
        if (problema) return problema;
        // Sigue: el destino y los parámetros, como cualquier asignación
    }

    for (const { nombre } of usos.asignaciones) {
        if (tabla.get(nombre)?.esRandom) {
            return `${nombre} es un Random: toma un valor nuevo cada vez que pasa por su nodo, no se le asigna.`;
        }

        if (regla === "contexto" && !tabla.has(nombre)) {
            return datos.has(nombre)
                ? `"${nombre}" es una variable de datos: el Contexto solo cambia variables de la tabla.`
                : `"${nombre}" no está en la tabla de variables: el Contexto solo cambia sus valores iniciales.`;
        }

        if (datos.has(nombre) && nombre !== pagina.nombre) {
            return `"${nombre}" es una variable de datos: se calcula en su propia pestaña.`;
        }
    }

    if (regla === "para") {
        const problema = problemaDeVariableDelPara(usos.asignaciones[0].nombre, { tabla, datos, contexto });
        if (problema) return problema;
    }

    if (enMain) {
        const desconocido = [...usos.asignaciones, ...usos.lecturas].find(
            ({ nombre }) => !existe(nombre)
        );

        if (desconocido) {
            return esNombreDeRandom(desconocido.nombre)
                ? `${desconocido.nombre} es un Random que no está en el diagrama: agregá un nodo Random ${desconocido.nombre}.`
                : `"${desconocido.nombre}" no está en la tabla de variables.`;
        }
    }

    for (const uso of [...usos.asignaciones, ...usos.lecturas]) {
        const variable = tabla.get(uso.nombre);

        if (!variable) {
            continue;
        }

        if (variable.esVector && !uso.indexada && !uso.entera) {
            return `"${uso.nombre}" es un vector: usá ${uso.nombre}[I] (las posiciones van de 0 a N - 1).`;
        }

        if (!variable.esVector && uso.indexada) {
            return `"${uso.nombre}" no es un vector: va sin [ ].`;
        }
    }

    return null;
}


// La variable de un Para: no puede ser otra cosa que una variable común
function problemaDeVariableDelPara(nombre, { tabla, datos, contexto }) {
    if (datos.has(nombre)) {
        return `"${nombre}" es una variable de datos: el Para necesita una variable común (por ejemplo, I).`;
    }

    if (contexto.subrutinas.some((s) => s.nombre === nombre)) {
        return `"${nombre}" es una subrutina: el Para necesita otro nombre.`;
    }

    if (tabla.get(nombre)?.esVector) {
        return `"${nombre}" es un vector: el Para necesita una variable común.`;
    }

    return null;
}

// Nodo Para: sus tres partes y el uso de las variables
function problemaDelPara(node, entorno) {
    if (paraVacio(node.data)) {
        return null;
    }

    const resultado = analizarNodoPara(node.data);

    if (!resultado.ok) {
        const { campo, mensaje } = resultado.error;
        return `${PARTES_DEL_PARA[campo]}: ${mensaje}`;
    }

    return problemaDeUso({ node, usos: resultado.usos, regla: "para", ...entorno });
}


export function problemasDeSintaxis({ nodes, pagina, paginas = [], variables = [] }) {
    const problemas = {};

    if (!pagina) {
        return problemas;
    }

    const tabla = new Map(
        variables
            .map((v) => [String(v.nombre ?? "").trim(), v])
            .filter(([nombre]) => nombre)
    );
    const datos = new Set(
        paginas.filter((p) => p.tipo === "fdp").map((p) => p.nombre)
    );

    // Para los nodos Subrutina: las que ya existen y los nombres ocupados
    const contexto = {
        subrutinas: paginas
            .filter((p) => p.tipo === "subrutina")
            .map((p) => ({ nombre: p.nombre, parametros: p.parametros })),
        ocupados: {
            variables: new Set(variables.filter((v) => !v.esRandom).map((v) => String(v.nombre ?? "").trim())),
            datos,
            randoms: new Set(variables.filter((v) => v.esRandom).map((v) => v.nombre)),
        },
    };

    // Variables que crean los Para de esta página
    const contadores = variablesDeLosPara(nodes);

    nodes.forEach((node) => {
        if (esPara(node)) {
            const problema = problemaDelPara(node, { pagina, tabla, datos, contexto, contadores });
            if (problema) problemas[node.id] = problema;
            return;
        }

        const esRetorno = node.data?.type === "end" && pagina.tipo === "subrutina";
        const regla = esRetorno ? "retorno" : reglaDeNodo(node);
        const texto = String(node.data?.label ?? "");

        if (esRetorno && !texto.trim()) {
            problemas[node.id] = FALTA_RETORNO;
            return;
        }

        if (!regla || !texto.trim()) {
            return;
        }

        const resultado = analizarConCache(texto, regla);

        if (!resultado.ok) {
            problemas[node.id] = conLinea(resultado.error.mensaje, resultado.error.linea, regla);
            return;
        }

        const problema = problemaDeUso({
            node,
            usos: resultado.usos,
            regla,
            pagina,
            tabla,
            datos,
            contexto,
            contadores,
        });

        if (problema) {
            problemas[node.id] = problema;
        }
    });

    return problemas;
}
