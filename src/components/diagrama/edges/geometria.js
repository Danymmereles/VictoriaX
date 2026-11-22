// ===========================================================================
// Geometría compartida por las flechas editables. Lógica pura.
//
// Los lados de un punto de conexión son los valores de Position de React
// Flow ("top", "bottom", "left", "right").
// ===========================================================================

// Hacia dónde sale una flecha de cada lado
export const DIRECCIONES = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 },
};

export const esLateral = (lado) => lado === "left" || lado === "right";

export const sumar = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const restar = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const puntoMedio = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Distancia (en unidades del lienzo) a la que un punto se "pega" a otro
export const IMAN = 6;

// El valor más cercano de los candidatos, si está a menos de `umbral`
export function iman(valor, candidatos, umbral = IMAN) {
    let elegido = valor;
    let mejor = umbral;

    candidatos.forEach((c) => {
        const d = Math.abs(c - valor);
        if (d <= mejor) {
            mejor = d;
            elegido = c;
        }
    });

    return elegido;
}

// Alinea un punto con sus vecinos (misma x o misma y) si está cerca
export const alinear = (p, vecinos) => ({
    x: iman(p.x, vecinos.map((v) => v.x)),
    y: iman(p.y, vecinos.map((v) => v.y)),
});

// Distancia de p al segmento a-b
export function distanciaASegmento(p, a, b) {
    const largo2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;

    if (largo2 === 0) {
        return distancia(p, a);
    }

    const t = Math.max(
        0,
        Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / largo2)
    );

    return distancia(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
}

const n = (v) => Math.round(v * 100) / 100;
export const coord = (p) => `${n(p.x)} ${n(p.y)}`;
