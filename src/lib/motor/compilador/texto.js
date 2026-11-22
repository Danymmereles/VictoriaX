// ===========================================================================
// Texto de una expresión del AST, para los mensajes de error:
// "TPLL + IA", "TPS[I]". Lógica pura.
// ===========================================================================

const PRECEDENCIA = { OR: 1, AND: 1, comparacion: 2, "+": 3, "-": 3, "*": 4, "/": 4, "%": 4, "\\": 4, unario: 5, "^": 6 };

const numero = (v) => String(v).replace(".", ",");

export function textoDe(a, padre = 0) {
    const entre = (texto, nivel) => (nivel < padre ? `(${texto})` : texto);

    switch (a.tipo) {
        case "numero": return numero(a.valor);
        case "constante": return a.valor === null ? "NULL" : a.valor ? "TRUE" : "FALSE";
        case "variable": return a.indice ? `${a.nombre}[${textoDe(a.indice)}]` : a.nombre;
        case "unario": return entre(`-${textoDe(a.operando, PRECEDENCIA.unario)}`, PRECEDENCIA.unario);
        case "binario": {
            const n = PRECEDENCIA[a.op];
            return entre(`${textoDe(a.izq, n)} ${a.op} ${textoDe(a.der, n + 1)}`, n);
        }
        case "comparacion": {
            const n = PRECEDENCIA.comparacion;
            return entre(`${textoDe(a.izq, n + 1)} ${a.op} ${textoDe(a.der, n + 1)}`, n);
        }
        case "logica": return entre(a.operandos.map((o) => textoDe(o, 2)).join(` ${a.op} `), 1);
        case "negacion": return `NOT (${textoDe(a.operando)})`;
        default: return "?";
    }
}
