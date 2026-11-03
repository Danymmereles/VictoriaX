import { createContext, useContext } from "react";

/*
 * Comparte el historial (useUndoRedo) con los componentes
 * del diagrama: la barra lateral y los nodos.
 * Los valores por defecto evitan errores si un componente
 * se usa fuera del editor.
 */
const HistoryContext = createContext({
    undo: () => {},
    redo: () => {},
    takeSnapshot: () => {},
    canUndo: false,
    canRedo: false,
});

export const HistoryProvider = HistoryContext.Provider;

export function useHistory() {
    return useContext(HistoryContext);
}
