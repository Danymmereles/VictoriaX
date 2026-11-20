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

    // Contexto: rectángulo con dos barras verticales a los costados
    context: (w, h, s) => {
        const k = Math.min(14, w * 0.09);

        return (
            <>
                <rect x={s / 2} y={s / 2} width={w - s} height={h - s} rx={6} />
                <path
                    className="flow-shape__line"
                    d={`M ${k} ${s / 2} V ${h - s / 2} M ${w - k} ${s / 2} V ${h - s / 2}`}
                />
            </>
        );
    },

    // Fin: óvalo con un anillo interno (se distingue de la Entrada
    // y hace par con las barras del Contexto, que es el inicio)
    end: (w, h, s) => {
        const k = Math.max(3, Math.min(5, h * 0.1));

        return (
            <>
                <ellipse cx={w / 2} cy={h / 2} rx={(w - s) / 2} ry={(h - s) / 2} />
                <ellipse
                    className="flow-shape__line"
                    cx={w / 2}
                    cy={h / 2}
                    rx={Math.max((w - s) / 2 - k, 1)}
                    ry={Math.max((h - s) / 2 - k, 1)}
                />
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
            {draw(width, height, strokeWidth)}
        </svg>
    );
}
