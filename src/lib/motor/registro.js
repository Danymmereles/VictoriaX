// ===========================================================================
// Registro de la evolución de las variables, para el gráfico de la
// ejecución. Lógica pura.
//
// En una simulación por eventos, las variables cambian de a saltos: valen
// lo mismo desde un instante T hasta el siguiente. Por eso se guarda un
// punto por cada instante: justo antes de que T cambie, se anotan T y el
// valor de cada variable en ese momento (cómo quedaron después de todo lo
// que pasó en ese instante). Al terminar se anota el último instante.
// El gráfico los une en escalones (cada valor se mantiene hasta el
// siguiente T).
//
//   new Registro(memoria, { tiempo: "T", variables: ["NS", "CANT"] })
//   memoria avisa con anotar(Tanterior) cada vez que T cambia de valor
//   serie() → { tiempo, t: Float64Array,
//               series: [{ nombre, valores: Float64Array }], recortado }
//
// Valores: los números tal cual; TRUE = 1 y FALSE = 0; NULL o una
// variable que todavía no existe quedan sin punto (NaN). Solo variables
// globales (las de la tabla y las de los Para de Main).
// ===========================================================================

// Tope de instantes guardados (memoria del navegador); después se deja
// de anotar y la serie avisa que quedó recortada
export const MAX_INSTANTES = 2_000_000;

const comoNumero = (valor) =>
    typeof valor === "number" ? valor : valor === true ? 1 : valor === false ? 0 : NaN;

export class Registro {
    constructor(memoria, { tiempo = "T", variables = [] } = {}) {
        this.memoria = memoria;
        this.tiempo = tiempo;
        this.variables = variables;

        this.t = [];
        this.valores = variables.map(() => []);
        this.recortado = false;
        this.cerrado = false;
    }

    // Anota el instante t con el valor actual de cada variable
    anotar(t) {
        const instante = comoNumero(t);

        if (Number.isNaN(instante)) {
            return;
        }

        if (this.t.length >= MAX_INSTANTES) {
            this.recortado = true;
            return;
        }

        this.t.push(instante);
        this.variables.forEach((nombre, i) => {
            this.valores[i].push(comoNumero(this.memoria.globales.get(nombre)));
        });
    }

    // Al terminar la ejecución: el último instante
    cerrar() {
        if (this.cerrado) return;
        this.cerrado = true;
        this.anotar(this.memoria.globales.get(this.tiempo));
    }

    serie() {
        return {
            tiempo: this.tiempo,
            t: Float64Array.from(this.t),
            series: this.variables.map((nombre, i) => ({
                nombre,
                valores: Float64Array.from(this.valores[i]),
            })),
            recortado: this.recortado,
        };
    }
}
