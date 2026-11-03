import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";

/*
 * =====================================================
 * HISTORIAL DEL DIAGRAMA (Deshacer / Rehacer)
 * -----------------------------------------------------
 * Guarda "fotos" (snapshots) del diagrama: nodos,
 * conectores y datos extra (meta), por ejemplo el tipo
 * de conector elegido.
 *
 * Regla de uso: llamar a takeSnapshot() JUSTO ANTES de
 * cada cambio que se quiera poder deshacer.
 *
 * Debe usarse dentro de <ReactFlowProvider>.
 * =====================================================
 */

const MAX_HISTORY = 100;

export default function useUndoRedo({
    getMeta,
    onRestore,
    maxHistory = MAX_HISTORY,
    // false = los atajos de teclado no actúan (p. ej. otra vista activa)
    shortcutsEnabled = true,
} = {}) {
    const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();

    const [past, setPast] = useState([]);
    const [future, setFuture] = useState([]);

    // Siempre la última versión de los callbacks externos
    const getMetaRef = useRef(getMeta);
    const onRestoreRef = useRef(onRestore);
    getMetaRef.current = getMeta;
    onRestoreRef.current = onRestore;

    const createSnapshot = useCallback(
        () => ({
            nodes: getNodes(),
            edges: getEdges(),
            meta: getMetaRef.current?.(),
        }),
        [getNodes, getEdges]
    );

    const restore = useCallback(
        (snapshot) => {
            setNodes(snapshot.nodes);
            setEdges(snapshot.edges);
            onRestoreRef.current?.(snapshot);
        },
        [setNodes, setEdges]
    );

    // Guardar el estado actual antes de un cambio
    const takeSnapshot = useCallback(() => {
        const snapshot = createSnapshot();

        setPast((stack) => [...stack, snapshot].slice(-maxHistory));
        // Un cambio nuevo invalida lo que se podía rehacer
        setFuture([]);
    }, [createSnapshot, maxHistory]);

    const undo = useCallback(() => {
        if (past.length === 0) {
            return;
        }

        const previous = past[past.length - 1];
        // La foto del estado actual se toma ANTES de restaurar
        const current = createSnapshot();

        setPast(past.slice(0, -1));
        setFuture((stack) => [...stack, current]);
        restore(previous);
    }, [past, createSnapshot, restore]);

    const redo = useCallback(() => {
        if (future.length === 0) {
            return;
        }

        const next = future[future.length - 1];
        // La foto del estado actual se toma ANTES de restaurar
        const current = createSnapshot();

        setFuture(future.slice(0, -1));
        setPast((stack) => [...stack, current]);
        restore(next);
    }, [future, createSnapshot, restore]);

    useHistoryShortcuts({ undo, redo, enabled: shortcutsEnabled });

    const canUndo = past.length > 0;
    const canRedo = future.length > 0;

    return useMemo(
        () => ({ undo, redo, takeSnapshot, canUndo, canRedo }),
        [undo, redo, takeSnapshot, canUndo, canRedo]
    );
}


/*
 * Atajos de teclado:
 *   Ctrl/Cmd + Z          → Deshacer
 *   Ctrl/Cmd + Shift + Z  → Rehacer
 *   Ctrl/Cmd + Y          → Rehacer
 * No actúan mientras se escribe en un campo de texto.
 */
function isTypingTarget(target) {
    return (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
    );
}

function useHistoryShortcuts({ undo, redo, enabled }) {
    const handlersRef = useRef({ undo, redo });
    handlersRef.current = { undo, redo };

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        const onKeyDown = (event) => {
            if (!(event.ctrlKey || event.metaKey) || isTypingTarget(event.target)) {
                return;
            }

            const key = event.key.toLowerCase();

            if (key === "z" && !event.shiftKey) {
                event.preventDefault();
                handlersRef.current.undo();
            } else if ((key === "z" && event.shiftKey) || key === "y") {
                event.preventDefault();
                handlersRef.current.redo();
            }
        };

        document.addEventListener("keydown", onKeyDown);

        return () => document.removeEventListener("keydown", onKeyDown);
    }, [enabled]);
}
