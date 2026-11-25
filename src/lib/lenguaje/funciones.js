// ===========================================================================
// Catálogo de FUNCIONES del lenguaje (LN, EXP, RAIZ...). Lógica pura.
//
// En esta primera versión de VictoriaX NO hay funciones: el catálogo está
// vacío y el lenguaje se comporta igual que antes (una llamada dentro de
// una cuenta es un error). Queda preparado para una versión futura (PV3,
// ver pendientes-interprete.md): agregar una función es sumar UNA entrada
// acá y su implementación en lib/motor/runtime/funciones.js. El parser,
// el chequeo, los usos y el compilador ya saben manejar llamadas.
//
// Cada entrada:
//   NOMBRE: {
//     argumentos: 1,            // cantidad (o [mínimo, máximo])
//     devuelve: "numero",       // por ahora solo funciones numéricas
//     descripcion: "Logaritmo natural",
//   }
// Ejemplo (no activo):
//   LN: { argumentos: 1, devuelve: "numero", descripcion: "Logaritmo natural" },
//
// Decisiones para cuando se activen:
//   - Los nombres se buscan sin distinguir mayúsculas (como AND o NOT) y
//     habría que sumarlos a las palabras reservadas (nombres.js), para que
//     nadie llame LN a una variable.
//   - Los argumentos se separan con ";" porque la coma es el decimal:
//     MAX(A; 2,5). El ";" se habilita en el léxico solo si hay funciones.
// ===========================================================================

export const FUNCIONES = {};

export const SEPARADOR_DE_ARGUMENTOS = ";";

export const hayFunciones = () => Object.keys(FUNCIONES).length > 0;

export const buscarFuncion = (nombre) => FUNCIONES[String(nombre).toUpperCase()] ?? null;

// ¿Cuántos argumentos acepta? → [mínimo, máximo]
export function rangoDeArgumentos(funcion) {
    const a = funcion.argumentos;
    return Array.isArray(a) ? a : [a, a];
}
