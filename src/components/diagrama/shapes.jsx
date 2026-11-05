import "./DiagramaTheme.css";
import "./shapes.css";

/*
 * =====================================================
 * FORMAS DEL DIAGRAMA (SVG)
 * -----------------------------------------------------
 * Única fuente de verdad de las figuras. La usan los
 * nodos del lienzo (CustomNode) y la barra lateral.
 *
 * El SVG se dibuja en píxeles reales (viewBox = tamaño),
 * sin escalar, por eso el contorno mide siempre lo mismo
 * en todas las figuras.
 * =====================================================
 */

export const STROKE_WIDTH = 2;

const SHAPES = {
    // Elipse
    input: (w, h, s) => (
        <ellipse cx={w / 2} cy={h / 2} rx={(w - s) / 2} ry={(h - s) / 2} />
    ),

    // Rectángulo con esquinas levemente redondeadas
    process: (w, h, s) => (
        <rect x={s / 2} y={s / 2} width={w - s} height={h - s} rx={6} />
    ),

    // Rombo
    decision: (w, h, s) => (
        <polygon
            points={`${w / 2},${s / 2} ${w - s / 2},${h / 2} ${w / 2},${h - s / 2} ${s / 2},${h / 2}`}
        />
    ),

    // Rectángulo con extremos totalmente redondeados (píldora)
    output: (w, h, s) => (
        <rect
            x={s / 2}
            y={s / 2}
            width={w - s}
            height={h - s}
            rx={(Math.min(w, h) - s) / 2}
        />
    ),

    // Documento: rectángulo con base ondulada
    document: (w, h, s) => {
        // Trazo original diseñado en 160x90 (x: 4..156, y: 4..76)
        const X = (x) => s / 2 + ((x - 4) / 152) * (w - s);
        const Y = (y) => s / 2 + ((y - 4) / 72) * (h - s);

        return (
            <path
                d={`
                    M ${X(4)} ${Y(4)}
                    H ${X(156)}
                    V ${Y(65)}
                    C ${X(140)} ${Y(78)}, ${X(125)} ${Y(78)}, ${X(110)} ${Y(68)}
                    C ${X(95)} ${Y(58)}, ${X(80)} ${Y(58)}, ${X(65)} ${Y(68)}
                    C ${X(45)} ${Y(82)}, ${X(25)} ${Y(76)}, ${X(4)} ${Y(62)}
                    Z
                `}
            />
        );
    },

    // Paralelogramo
    io: (w, h, s) => {
        const k = w * 0.15;
        return (
            <polygon
                points={`${k},${s / 2} ${w - s / 2},${s / 2} ${w - k},${h - s / 2} ${s / 2},${h - s / 2}`}
            />
        );
    },

    // Hexágono
    preparation: (w, h, s) => {
        const k = w * 0.15;
        return (
            <polygon
                points={`${k},${s / 2} ${w - k},${s / 2} ${w - s / 2},${h / 2} ${w - k},${h - s / 2} ${k},${h - s / 2} ${s / 2},${h / 2}`}
            />
        );
    },

    // Círculo
    connector: (w, h, s) => (
        <ellipse cx={w / 2} cy={h / 2} rx={(w - s) / 2} ry={(h - s) / 2} />
    ),

    // Dado (función random): cara del 5. En el lienzo el punto central
    // se reemplaza por el texto del nodo; en la barra lateral se dibuja.
    random: (w, h, s, { centerPip = false } = {}) => {
        const lado = Math.min(w, h);
        const r = Math.max(lado * 0.065, 2);
        const inset = lado * 0.25;

        const pips = [
            [inset, inset],
            [w - inset, inset],
            [inset, h - inset],
            [w - inset, h - inset],
            ...(centerPip ? [[w / 2, h / 2]] : []),
        ];

        return (
            <>
                <rect
                    x={s / 2}
                    y={s / 2}
                    width={w - s}
                    height={h - s}
                    rx={lado * 0.18}
                />
                {pips.map(([cx, cy]) => (
                    <circle
                        key={`${cx}-${cy}`}
                        className="flow-shape__pip"
                        cx={cx}
                        cy={cy}
                        r={r}
                    />
                ))}
            </>
        );
    },
};

export function FlowShape({
    type,
    width,
    height,
    strokeWidth = STROKE_WIDTH,
    className = "",
    // Detalles opcionales de algunas figuras (p. ej. { centerPip } del dado)
    options,
}) {
    const draw = SHAPES[type] ?? SHAPES.process;

    if (!width || !height) {
        return null;
    }

    return (
        <svg
            className={`flow-shape flow-shape--${type} ${className}`}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            strokeWidth={strokeWidth}
            aria-hidden="true"
        >
            {draw(width, height, strokeWidth, options)}
        </svg>
    );
}
