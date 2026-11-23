import { useReactFlow } from "@xyflow/react";

import { useHistory } from "../HistoryContext";

// Movimiento mínimo (px de pantalla) para que un clic sea un arrastre
const UMBRAL_ARRASTRE = 3;

/*
 * Ruta personalizada de una flecha, para un tipo de flecha.
 *
 * Se guarda en edge.data.rutas[tipo], una por tipo: al cambiar el tipo
 * global de las flechas (EdgeTypeSelector) cada una conserva lo que se
 * le hizo en cada tipo, y al volver aparece igual.
 *
 * Devuelve:
 *   ruta:      la ruta guardada (null = automática)
 *   arrastrar: para onPointerDown de una manija (ver abajo)
 *   cambiar:   cambio puntual (p. ej. doble clic), con historial
 */
export function useEdgeRoute(id, data, tipo) {
    const { setEdges, screenToFlowPosition } = useReactFlow();
    const { takeSnapshot } = useHistory();

    const ruta = data?.rutas?.[tipo] ?? null;

    const guardar = (nueva) => {
        setEdges((edges) =>
            edges.map((edge) => {
                if (edge.id !== id) {
                    return edge;
                }

                const rutas = { ...edge.data?.rutas };

                if (nueva) {
                    rutas[tipo] = nueva;
                } else {
                    delete rutas[tipo];
                }

                return { ...edge, data: { ...edge.data, rutas } };
            })
        );
    };

    /*
     * Arrastre de una manija:
     *   calcular(p): ruta nueva para el punto p del lienzo, siempre a
     *                partir de la ruta que había al empezar
     *   terminar(r): ajuste al soltar (p. ej. quitar quiebres sobrantes)
     * Un clic sin movimiento no cambia nada (así funciona el doble clic).
     * El historial se guarda una sola vez, al empezar a mover.
     */
    const arrastrar = (event, { calcular, terminar = (r) => r }) => {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const inicioX = event.clientX;
        const inicioY = event.clientY;
        let empezado = false;
        let ultima = ruta;

        const mover = (e) => {
            if (!empezado) {
                if (Math.hypot(e.clientX - inicioX, e.clientY - inicioY) < UMBRAL_ARRASTRE) {
                    return;
                }
                empezado = true;
                takeSnapshot();
            }

            ultima = calcular(screenToFlowPosition({ x: e.clientX, y: e.clientY }));
            guardar(ultima);
        };

        const soltar = () => {
            window.removeEventListener("pointermove", mover);
            window.removeEventListener("pointerup", soltar);
            window.removeEventListener("pointercancel", soltar);

            if (empezado) {
                guardar(terminar(ultima));
            }
        };

        window.addEventListener("pointermove", mover);
        window.addEventListener("pointerup", soltar);
        window.addEventListener("pointercancel", soltar);
    };

    const cambiar = (nueva) => {
        takeSnapshot();
        guardar(nueva);
    };

    return { ruta, arrastrar, cambiar };
}
