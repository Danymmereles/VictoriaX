// ===========================================================================
// Intérprete: ejecuta un programa compilado paso a paso. Lógica pura.
//
// Cada paso ejecuta UNA instrucción (un nodo) de la página que está arriba
// de la pila de llamadas:
//   - { siguiente }  sigue en la misma página;
//   - { llamar }     entra a la página de la fdp o de la subrutina y, al
//                    llegar a su Fin, vuelve al nodo siguiente de quien
//                    llamó;
//   - { fin }        termina la página (en Main, termina la ejecución).
//
//   const ejecucion = new Ejecucion(compilado, { semilla, maxPasos });
//   ejecucion.paso()   → { paginaId, nodoId, tipo } o null si terminó
//   ejecucion.correr() → resultado()
//   ejecucion.resultado()
//     { estado: "terminada" | "error" | "limite" | "en curso",
//       pasos, semilla, salidas, variables, error }
//
// salidas: lo que mostró cada Resultado, en orden:
//   [{ paso, pagina, nodoId, valores: [{ nombre, valor }] }]
// error: { mensaje, pagina, paginaId, nodoId, texto, linea }
// ===========================================================================

import { crearAleatorio, semillaAlAzar } from "./runtime/aleatorio.js";
import { ErrorDeEjecucion } from "./runtime/errores.js";
import { Memoria } from "./runtime/memoria.js";

export const MAX_PASOS = 5_000_000;
export const MAX_LLAMADAS = 500;

export class Ejecucion {
    constructor(compilado, { semilla = semillaAlAzar(), maxPasos = MAX_PASOS, maxLlamadas = MAX_LLAMADAS } = {}) {
        this.compilado = compilado;
        this.semilla = semilla;
        this.maxPasos = maxPasos;
        this.maxLlamadas = maxLlamadas;

        this.memoria = new Memoria(compilado);
        this.salidas = [];
        this.pasos = 0;
        this.estado = "en curso";
        this.error = null;

        const aleatorio = crearAleatorio(semilla);

        // Lo que reciben las instrucciones al ejecutarse
        this.ctx = {
            memoria: this.memoria,
            aleatorio,
            emitir: (valores) => {
                const { pagina, nodoId } = this.cima;
                this.salidas.push({ paso: this.pasos, pagina: pagina.titulo, nodoId, valores });
            },
        };

        // Pila de llamadas: { pagina, nodoId, salto }
        this.pila = [];
        this.entrar(compilado.inicio, null);
    }

    get cima() {
        return this.pila[this.pila.length - 1];
    }

    get terminada() {
        return this.estado !== "en curso";
    }

    entrar(pagina, salto) {
        if (this.pila.length >= this.maxLlamadas) {
            throw new ErrorDeEjecucion(
                `Demasiadas llamadas una dentro de otra (${this.maxLlamadas}): ¿una fdp o subrutina se llama a sí misma a través de otra?`
            );
        }

        this.memoria.entrar(pagina);
        this.pila.push({ pagina, nodoId: pagina.inicio, salto });
    }

    // Llegó al Fin de la página de arriba
    volver() {
        const { salto } = this.cima;

        if (this.pila.length === 1) {
            this.pila.pop();
            this.estado = "terminada";
            return;
        }

        // Todavía en la página llamada (p. ej. una fdp que no asignó)
        const datos = salto.alSalir?.(this.memoria, this.memoria.marco);

        this.pila.pop();
        this.memoria.salir();
        salto.alVolver?.(this.memoria, datos);
    }

    paso() {
        if (this.terminada) {
            return null;
        }

        const cima = this.cima;
        const instruccion = cima.pagina.instrucciones.get(cima.nodoId);
        this.pasos++;

        try {
            if (this.pasos > this.maxPasos) {
                this.estado = "limite";
                throw new ErrorDeEjecucion(
                    `Se llegó al límite de ${this.maxPasos.toLocaleString("es-AR")} pasos: ¿hay un ciclo que nunca termina?`
                );
            }

            const salto = instruccion.ejecutar(this.ctx);

            if (salto.fin) {
                this.volver();
            } else if (salto.llamar) {
                const datos = salto.antes?.(this.memoria);
                cima.nodoId = salto.retorno;
                this.entrar(salto.llamar, salto);
                salto.alEntrar?.(this.memoria, datos);
            } else {
                cima.nodoId = salto.siguiente;
            }
        } catch (error) {
            if (!(error instanceof ErrorDeEjecucion)) {
                throw error;
            }

            if (this.estado === "en curso") {
                this.estado = "error";
            }

            this.error = {
                mensaje: error.message,
                linea: error.linea,
                pagina: cima.pagina.titulo,
                paginaId: cima.pagina.id,
                // El nodo del diagrama (la vuelta de un Para es el Para)
                nodoId: instruccion.nodo ?? instruccion.id,
                texto: instruccion.texto,
            };
        }

        return { paginaId: cima.pagina.id, nodoId: instruccion.nodo ?? instruccion.id, tipo: instruccion.tipo };
    }

    correr() {
        while (!this.terminada) {
            this.paso();
        }
        return this.resultado();
    }

    resultado() {
        return {
            estado: this.estado,
            pasos: this.pasos,
            semilla: this.semilla,
            salidas: this.salidas,
            variables: this.memoria.instantanea(),
            error: this.error,
        };
    }
}
