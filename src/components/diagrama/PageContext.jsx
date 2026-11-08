import { createContext, useContext } from "react";

/*
 * Información de la página que se está editando, para los nodos:
 *   page:          { id, nombre } de la página activa
 *   nodeIssues:    { [nodeId]: mensaje } — nodos marcados con error
 *   validateLabel: ({ data, nombre }) => mensaje | null — se llama antes de
 *                  aceptar un nombre nuevo; si devuelve mensaje, se rechaza.
 * Los valores por defecto permiten usar los nodos fuera del editor.
 */
const PageContext = createContext({
    page: null,
    nodeIssues: {},
    validateLabel: () => null,
});

export const PageProvider = PageContext.Provider;

export function usePageContext() {
    return useContext(PageContext);
}
