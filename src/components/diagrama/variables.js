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
 */
export function validarVariables(variables) {
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
        }

        if (!valor) {
            agregar(v.id, "valorInicial", "El valor inicial no puede quedar vacío.");
        } else if (!NUMERO_VALIDO.test(valor)) {
            agregar(v.id, "valorInicial", "El valor inicial debe ser un número.");
        }
    });

    return errores;
}
