// ===========================================================================
// Números al azar de los nodos Random: reales en [0, 1).
//
// Con semilla (mulberry32): la misma semilla da la misma corrida, así se
// puede repetir una ejecución o comparar dos con los mismos números al
// azar. Sin semilla, se elige una y se informa en el resultado.
// ===========================================================================

export const semillaAlAzar = () => Math.floor(Math.random() * 2 ** 32);

export function crearAleatorio(semilla) {
    let estado = semilla >>> 0;

    return function siguiente() {
        estado = (estado + 0x6d2b79f5) >>> 0;
        let t = estado;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
