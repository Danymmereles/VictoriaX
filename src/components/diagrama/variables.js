// ===========================================================================
// Variables del diagrama: modelo y validación.
// Lógica pura, sin dependencias de React. La usa VariablesPanel y, más
// adelante, la validación del diagrama (consistencia de las variables).
// ===========================================================================

let _id = 0;
export const nuevoIdVariable = () => `var_${Date.now()}_${_id++}`;

export const VALOR_INICIAL_DEFAULT = "0";

// { id, nombre, valorInicial } — los valores se guardan como texto (lo que
// escribe el usuario) y se convierten con valorNumerico() cuando se usen.
//
// Las variables que vienen del Análisis Previo además tienen:
//   origen: "datos" | "control" | "estado" | "resultado"
//   descripcion, esVector, dimension
// Su nombre no se edita en el diagrama: se corrige en el Análisis Previo.
export function nuevaVariable(id = nuevoIdVariable(), cambios = {}) {
    return {
        id,
        nombre: "",
        valorInicial: VALOR_INICIAL_DEFAULT,
        ...cambios,
    };
}

const NOMBRE_VALIDO = /^[A-Za-z_][A-Za-z0-9_]*$/;
const NUMERO_VALIDO = /^-?\d+([.,]\d+)?$/;

export function valorNumerico(valor) {
    return Number(String(valor).trim().replace(",", "."));
}

/*
 * Devuelve los errores por variable:
 *   { [id]: { nombre?: string, valorInicial?: string } }
 * Una variable sin errores no aparece en el resultado.
 *
 * nombresReservados: nombres que no se pueden usar en la tabla
 * (las variables de datos, que son funciones de probabilidad).
 */
export function validarVariables(variables, { nombresReservados = [] } = {}) {
    const reservados = new Set(
        nombresReservados.map((n) => String(n).trim().toUpperCase())
    );

    const errores = {};

    const agregar = (id, campo, mensaje) => {
        errores[id] = { ...errores[id], [campo]: mensaje };
    };

    // Cantidad de veces que aparece cada nombre (sin distinguir mayúsculas)
    const repeticiones = {};
    variables.forEach((v) => {
        const clave = v.nombre.trim().toUpperCase();
        if (clave) {
            repeticiones[clave] = (repeticiones[clave] || 0) + 1;
        }
    });

    variables.forEach((v) => {
        const nombre = v.nombre.trim();
        const valor = String(v.valorInicial ?? "").trim();

        if (!nombre) {
            agregar(v.id, "nombre", "La variable necesita un nombre.");
        } else if (!NOMBRE_VALIDO.test(nombre)) {
            agregar(
                v.id,
                "nombre",
                "Usá solo letras, números y _, sin empezar con un número."
            );
        } else if (repeticiones[nombre.toUpperCase()] > 1) {
            agregar(v.id, "nombre", `La variable "${nombre}" está repetida.`);
        } else if (reservados.has(nombre.toUpperCase())) {
            agregar(
                v.id,
                "nombre",
                `"${nombre}" es una variable de datos: se define en su propia pestaña.`
            );
        }

        if (!valor) {
            agregar(v.id, "valorInicial", "El valor inicial no puede quedar vacío.");
        } else if (!NUMERO_VALIDO.test(valor)) {
            agregar(v.id, "valorInicial", "El valor inicial debe ser un número.");
        }
    });

    return errores;
}


// ===========================================================================
// Importación desde el Análisis Previo
// ===========================================================================

// Orden en el que se listan en la tabla
export const CATEGORIAS_ANALISIS = {
    datos: "Variable de Datos",
    control: "Variable de Control",
    estado: "Variable de Estado",
    resultado: "Variable de Resultado",
};

/*
 * Otros orígenes, además de las cuatro categorías del análisis:
 *   futuro:   sigla de la tabla de Eventos Futuros (TPLL, TPS). Viene del
 *             Análisis Previo: su nombre no se edita acá.
 *   generada: agregada al generar el diagrama (T, TF, HV, índices...).
 *             Se puede renombrar o borrar como una propia.
 */
export const ORIGEN_FUTURO = "futuro";
export const ORIGEN_GENERADA = "generada";

const ORIGENES = {
    ...CATEGORIAS_ANALISIS,
    [ORIGEN_FUTURO]: "Evento futuro",
    [ORIGEN_GENERADA]: "Agregada al generar el diagrama",
};

// Viene del Análisis Previo: nombre fijo, no se borra en el diagrama
export const esImportada = (variable) =>
    Boolean(variable.origen) && variable.origen !== ORIGEN_GENERADA;

/*
 * Toma TODAS las variables cargadas en el Análisis Previo
 * (Datos, Control, Estado y Resultado), sin importar cuántas
 * haya en cada sección. Se ignoran las que no tienen siglas
 * y, si una sigla se repite, se toma la primera.
 */
export function variablesDesdeAnalisis(analisis) {
    if (!analisis?.variables) {
        return [];
    }

    const vistas = new Set();
    const resultado = [];

    Object.keys(CATEGORIAS_ANALISIS).forEach((categoria) => {
        (analisis.variables[categoria] || []).forEach((v) => {
            const nombre = (v.sigla || "").trim();
            const clave = nombre.toUpperCase();

            if (!nombre || vistas.has(clave)) {
                return;
            }

            vistas.add(clave);

            resultado.push(
                nuevaVariable(`analisis_${v.id}`, {
                    nombre,
                    origen: categoria,
                    descripcion: (v.descripcion || "").trim(),
                    esVector: Boolean(v.esVector),
                    dimension: v.esVector ? v.dimension ?? null : null,
                })
            );
        });
    });

    return resultado;
}

export const esVariableDeDatos = (variable) => variable.origen === "datos";

/*
 * Variables de datos del Análisis Previo. Son funciones de
 * probabilidad: no van en la tabla de valores iniciales, sino
 * que cada una tiene su pestaña para definir su algoritmo.
 *   [{ id, nombre, descripcion }]
 */
export function funcionesDeDatos(analisis) {
    return variablesDesdeAnalisis(analisis)
        .filter(esVariableDeDatos)
        .map(({ id, nombre, descripcion }) => ({ id, nombre, descripcion }));
}

/*
 * Variables de la tabla del diagrama (con valor inicial):
 *   - las del análisis (Control, Estado y Resultado; las de Datos
 *     NO, ver funcionesDeDatos) van primero y conservan el valor
 *     inicial que el usuario ya les había puesto;
 *   - las agregadas a mano en el diagrama se mantienen.
 */
export function sincronizarConAnalisis(actuales, analisis) {
    const valoresPrevios = new Map(
        actuales.map((v) => [v.nombre.trim().toUpperCase(), v.valorInicial])
    );

    const importadas = variablesDesdeAnalisis(analisis)
        .filter((v) => !esVariableDeDatos(v))
        .map((v) => ({
            ...v,
            valorInicial:
                valoresPrevios.get(v.nombre.toUpperCase()) ?? v.valorInicial,
        }));

    const propias = actuales.filter((v) => !esImportada(v));

    return [...importadas, ...propias];
}

// Texto descriptivo de una variable importada (para el tooltip)
export function detalleVariable(variable) {
    if (!ORIGENES[variable.origen]) {
        return "";
    }

    const partes = [ORIGENES[variable.origen]];

    if (variable.descripcion) {
        partes.push(variable.descripcion);
    }

    if (variable.esVector) {
        partes.push(`Vector de dimensión ${textoDimension(variable.dimension) || "sin definir"}`);
    }

    return partes.join(" · ");
}

export function textoDimension(dimension) {
    if (!dimension) {
        return "";
    }

    return dimension.tipo === "fijo"
        ? String(dimension.valor)
        : dimension.variableControl || "";
}
