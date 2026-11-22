// ===========================================================================
// Compilador: programa cargado (cargar.js) → programa compilado, con una
// instrucción por nodo (ver nodos.js). Lógica pura.
//
//   expresiones.js  AST de una expresión → función
//   sentencias.js   sentencias de Asignación / Contexto → función
//   nodos.js        nodo → instrucción con ejecutar(ctx)
//   texto.js        texto de una expresión, para los mensajes
// ===========================================================================

import { compilarNodo } from "./nodos.js";

export function compilarPrograma(programa) {
    const paginas = new Map();

    // Para las llamadas: la página compilada de una fdp o subrutina
    const paginaCompilada = (tipo, nombre) => {
        const pagina = programa.paginaDe(tipo, nombre);
        return paginas.get(pagina.id);
    };

    programa.paginas.forEach((pagina) => {
        const instrucciones = new Map();

        pagina.nodos.forEach((nodo) => {
            instrucciones.set(nodo.id, compilarNodo(nodo, paginaCompilada));
        });

        paginas.set(pagina.id, {
            id: pagina.id,
            tipo: pagina.tipo,
            nombre: pagina.nombre,
            titulo: pagina.titulo,
            parametros: pagina.parametros,
            inicio: pagina.inicio,
            instrucciones,
        });
    });

    return {
        paginas,
        inicio: paginas.get(programa.inicio.id),
        variables: programa.variables,
        randoms: programa.randoms,
        datos: programa.datos,
    };
}
