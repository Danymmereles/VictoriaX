// ===========================================================================
// Usos de variables de un árbol (ver ast.js): qué se lee y qué se asigna.
// Lógica pura. Los usan los controles que dependen de la tabla de
// variables (components/diagrama/validacion.js).
//
//   { lecturas: [{ nombre, indexada, entera? }],
//     asignaciones: [{ nombre, indexada }],
//     subrutina: { nombre, parametros } | null }
// entera: el Resultado muestra el vector completo (TPS).
// ===========================================================================

export function usosDe(arbol) {
    const usos = { lecturas: [], asignaciones: [], subrutina: null };

    const leer = (a) => {
        if (!a) return;

        switch (a.tipo) {
            case "variable":
                leer(a.indice);
                usos.lecturas.push({ nombre: a.nombre, indexada: Boolean(a.indice) });
                break;
            case "unario":
            case "negacion":
                leer(a.operando);
                break;
            case "binario":
            case "comparacion":
                leer(a.izq);
                leer(a.der);
                break;
            case "logica":
                a.operandos.forEach(leer);
                break;
            case "llamada":
                a.argumentos.forEach(leer);
                break;
            default:
                break;
        }
    };

    switch (arbol.tipo) {
        case "sentencias":
            arbol.sentencias.forEach((s) => {
                leer(s.destino.indice);
                usos.asignaciones.push({ nombre: s.destino.nombre, indexada: Boolean(s.destino.indice) });
                leer(s.valor);
            });
            break;
        case "resultado":
            arbol.nombres.forEach((nombre) =>
                usos.lecturas.push({ nombre, indexada: false, entera: true })
            );
            break;
        case "para":
            // Asigna la variable (al empezar y en cada vuelta) y la lee (+ 1)
            usos.asignaciones.push({ nombre: arbol.variable, indexada: false });
            leer(arbol.desde);
            leer(arbol.hasta);
            break;
        case "firma":
            usos.subrutina = { nombre: arbol.nombre, parametros: arbol.parametros };
            break;
        case "etiqueta":
        case "fdp":
        case "random":
            break;
        default:
            leer(arbol);
    }

    return usos;
}
