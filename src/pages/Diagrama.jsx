import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useTheme from "../hooks/useTheme";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { cargarAnalisis } from "@/lib/analisisPrevioStorage";

import {
    ReactFlow,
    ReactFlowProvider,
    SelectionMode,
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import Sidebar from "../components/diagrama/Sidebar.jsx";
import VariablesPanel from "../components/diagrama/VariablesPanel.jsx";
import EdgeMarkers, { withEdgeMarkers } from "../components/diagrama/EdgeMarkers.jsx";
import DiagramaTabs, {
    VISTAS,
    panelId,
    tabId,
} from "../components/diagrama/DiagramaTabs.jsx";
import ExecutionView from "../components/diagrama/ExecutionView.jsx";
import PageBar from "../components/diagrama/PageBar.jsx";
import GenerationNotice from "../components/diagrama/GenerationNotice.jsx";
import { generarDiagrama } from "../components/diagrama/generacion/index.js";
import {
    CALL_NODE_TYPE,
    MAIN_PAGE_ID,
    crearNodoContexto,
    crearPaginaFuncion,
    derivarPaginas,
    emptyPage,
    esAncla,
    esContexto,
    nombreLlamadaPorDefecto,
    problemasDeNodos,
    sincronizarAncla,
    tieneContenido,
    validarNombreNodo,
} from "../components/diagrama/pages.js";
import { PageProvider } from "../components/diagrama/PageContext.jsx";
import {
    funcionesDeDatos,
    sincronizarConAnalisis,
} from "../components/diagrama/variables.js";
import CustomNode from "../components/diagrama/CustomNode.jsx";
import {
    DnDProvider,
    useDnD,
} from "../components/diagrama/DnDContext.jsx";
import useUndoRedo from "../components/diagrama/useUndoRedo.js";
import { itemDeBarra } from "../components/diagrama/sidebarItems.js";
import { HistoryProvider } from "../components/diagrama/HistoryContext.jsx";

import "../components/diagrama/DiagramaTheme.css";
import "../components/diagrama/Diagrama.css";


const nodeTypes = {
    custom: CustomNode,
};


// Posición del lienzo para una página que se abre por primera vez
const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };

// Al abrir la página de una variable de datos por primera vez, su
// nodo ancla (inicio) queda centrado arriba. Ancho del nodo: 160px.
const ANCHOR_WIDTH = 160;
const ANCHOR_TOP = 70;

// Igual con el Contexto al abrir el diagrama. Ancho mínimo: 180px.
const CONTEXT_WIDTH = 180;

// Tipo de conector al entrar (también el de los generados)
const INITIAL_EDGE_TYPE = "default";

/*
 * Viewport que deja el inicio de la página (Contexto o ancla)
 * centrado arriba, a tamaño real. Los nodos generados se ubican
 * por su centro superior (origin [0.5, 0]); los demás, por su
 * esquina superior izquierda.
 */
function initialViewport(nodes, canvasWidth) {
    const start = nodes.find((node) => esContexto(node) || esAncla(node));

    if (!start) {
        return DEFAULT_VIEWPORT;
    }

    const width = esContexto(start) ? CONTEXT_WIDTH : ANCHOR_WIDTH;
    const centered = start.origin?.[0] === 0.5;
    const centerX = start.position.x + (centered ? 0 : width / 2);

    return {
        x: Math.max(canvasWidth / 2, width / 2) - centerX,
        y: ANCHOR_TOP - start.position.y,
        zoom: 1,
    };
}

const deselect = (items) =>
    items.map((item) => (item.selected ? { ...item, selected: false } : item));


// El click derecho se usa para mover el lienzo
const preventContextMenu = (event) => {
    event.preventDefault();
};



/*
 * Editor del diagrama.
 *   active: false cuando hay otra vista abierta (Ejecución):
 *           se desactivan Supr y los atajos de Deshacer/Rehacer.
 *   onRun:  botón Ejecutar de la barra lateral.
 */
function Flow({ active = true, onRun }) {

    // Análisis Previo (se guarda en cada cambio, por eso está
    // al día al "Pasar a Diagramar")
    const [analisis] = useState(cargarAnalisis);

    // Variables de datos = funciones de probabilidad: cada una
    // tiene su página (no van en la tabla de valores iniciales)
    const funciones = useMemo(
        () => funcionesDeDatos(analisis),
        [analisis]
    );

    const nombresDeFunciones = useMemo(
        () => funciones.map((f) => f.nombre),
        [funciones]
    );

    // Lista de páginas: Main + una por variable de datos
    const pages = useMemo(
        () => derivarPaginas(funciones),
        [funciones]
    );

    // Diagrama generado desde el Análisis Previo, una sola vez al
    // entrar (ver generacion/). Si no se puede generar, Main arranca
    // solo con el Contexto, como antes.
    const [generacion] = useState(() =>
        generarDiagrama(analisis, {
            paginas: pages,
            edgeType: INITIAL_EDGE_TYPE,
        })
    );

    // Aviso de lo generado y de lo que falta completar
    const [showNotice, setShowNotice] = useState(true);

    // Main arranca siempre con el nodo Contexto (inicio fijo)
    const [nodes, setNodes, onNodesChange] =
        useNodesState(() =>
            generacion.generado ? generacion.main.nodes : [crearNodoContexto()]
        );

    const [edges, setEdges, onEdgesChange] =
        useEdgesState(() =>
            generacion.generado ? generacion.main.edges : []
        );

    const {
        screenToFlowPosition,
        getNodes,
        getEdges,
        getViewport,
        setViewport,
    } = useReactFlow();

    // Elemento de la barra lateral que se está arrastrando
    const [dragItemId] = useDnD();

    // Variables con valor inicial: Control, Estado y Resultado
    // del Análisis Previo, más las que agrega la generación
    // (T, TF, HV, tiempos de los eventos...) y las que se
    // agreguen a mano
    const [variables, setVariables] =
        useState(() => [
            ...sincronizarConAnalisis([], analisis),
            ...(generacion.variables ?? []),
        ]);

    // Tipo de conector global: aplica a todos los edges
    // de TODAS las páginas
    const [edgeType, setEdgeType] =
        useState(INITIAL_EDGE_TYPE);


    // ---------------------------------------------------
    // Páginas del algoritmo: Main + una por cada variable de
    // datos (ver pages.js). React Flow muestra solo la página
    // activa; las demás quedan guardadas acá. Las páginas de
    // datos generadas arrancan guardadas.
    // ---------------------------------------------------
    const [activePage, setActivePage] =
        useState(MAIN_PAGE_ID);

    const pagesStoreRef = useRef(
        generacion.generado ? { ...generacion.paginas } : {}
    );
    // Fuerza un render al cambiar lo guardado (p. ej. hasDiagram)
    const [, setStoreVersion] = useState(0);

    const applyEdgeTypeToStoredPages = useCallback((newType) => {
        const store = pagesStoreRef.current;

        Object.keys(store).forEach((pageId) => {
            store[pageId] = {
                ...store[pageId],
                edges: store[pageId].edges.map((edge) => ({
                    ...edge,
                    type: newType,
                })),
            };
        });
    }, []);


    // Historial (Deshacer / Rehacer): uno por página.
    // También guarda el tipo de conector para que el
    // selector vuelva atrás.
    const history = useUndoRedo({
        scope: activePage,
        shortcutsEnabled: active,
        getMeta: () => ({ edgeType }),
        onRestore: (snapshot) => {
            const restoredType = snapshot.meta?.edgeType;

            if (restoredType && restoredType !== edgeType) {
                setEdgeType(restoredType);
                applyEdgeTypeToStoredPages(restoredType);
            }
        },
    });

    const { takeSnapshot } = history;

    const currentPage = useMemo(
        () => pages.find((page) => page.id === activePage),
        [pages, activePage]
    );


    // El nodo ancla siempre muestra el nombre del nodo de Main
    const displayNodes = useMemo(
        () => sincronizarAncla(nodes, currentPage),
        [nodes, currentPage]
    );


    // Contexto para los nodos: errores a marcar y validación
    // de nombres (una variable no puede llamarse a sí misma)
    const nodeIssues = useMemo(
        () => problemasDeNodos({ nodes, pagina: currentPage, paginas: pages }),
        [nodes, currentPage, pages]
    );

    const validateLabel = useCallback(
        ({ data, nombre }) =>
            validarNombreNodo({ data, nombre, pagina: currentPage }),
        [currentPage]
    );

    const pageContext = useMemo(
        () => ({ page: currentPage, nodeIssues, validateLabel }),
        [currentPage, nodeIssues, validateLabel]
    );


    // Lienzo: para ubicar el nodo ancla al abrir una variable
    const canvasRef = useRef(null);


    // Al abrir el diagrama, el Contexto (inicio de Main) queda
    // centrado arriba, a tamaño real
    useEffect(() => {
        const width = canvasRef.current?.clientWidth ?? 0;

        setViewport(initialViewport(nodes, width));
        // Solo al montar
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // Cambiar de página: guardar la actual y cargar la otra
    const switchPage = useCallback(
        (pageId) => {
            if (pageId === activePage) {
                return;
            }

            pagesStoreRef.current[activePage] = {
                nodes: getNodes(),
                edges: getEdges(),
                viewport: getViewport(),
            };

            const page = pages.find((p) => p.id === pageId);
            const width = canvasRef.current?.clientWidth ?? 0;

            // Primera vez que se abre una variable: arranca con
            // su nodo ancla (o con lo generado), centrado arriba
            const target =
                pagesStoreRef.current[pageId] ??
                (pageId === MAIN_PAGE_ID || !page
                    ? emptyPage()
                    : crearPaginaFuncion(page));

            setNodes(deselect(target.nodes));
            setEdges(deselect(target.edges));
            setViewport(target.viewport ?? initialViewport(target.nodes, width));

            setActivePage(pageId);
            setStoreVersion((v) => v + 1);
        },
        [
            activePage,
            pages,
            getNodes,
            getEdges,
            getViewport,
            setNodes,
            setEdges,
            setViewport,
        ]
    );


    // Si la página activa deja de existir, volver a Main
    useEffect(() => {
        if (!pages.some((page) => page.id === activePage)) {
            switchPage(MAIN_PAGE_ID);
        }
    }, [pages, activePage, switchPage]);


    // ¿El usuario hizo algo en alguna página? (los nodos fijos,
    // Contexto y anclas, no cuentan salvo que se haya escrito en él)
    const hasDiagram =
        tieneContenido({ nodes, edges }) ||
        Object.entries(pagesStoreRef.current).some(
            ([pageId, page]) => pageId !== activePage && tieneContenido(page)
        );


    // Cambiar el tipo de todos los conectores existentes
    // (en todas las páginas)
    const changeEdgeType = useCallback(
        (newType) => {
            if (newType === edgeType) {
                return;
            }

            takeSnapshot();
            setEdgeType(newType);
            applyEdgeTypeToStoredPages(newType);

            setEdges((currentEdges) =>
                currentEdges.map((edge) => ({
                    ...edge,
                    type: newType,
                }))
            );
        },
        [setEdges, edgeType, takeSnapshot, applyEdgeTypeToStoredPages]
    );


    // Todos los conectores terminan en flecha (markerEnd)
    const edgesWithMarkers = useMemo(
        () => withEdgeMarkers(edges),
        [edges]
    );


    // Los conectores nuevos usan el tipo seleccionado
    const defaultEdgeOptions = useMemo(
        () => ({ type: edgeType }),
        [edgeType]
    );


    // Crear conexión entre nodos
    const onConnect = useCallback(
        (params) => {
            takeSnapshot();

            setEdges((currentEdges) =>
                addEdge(
                    { ...params, type: edgeType },
                    currentEdges
                )
            );
        },
        [setEdges, edgeType, takeSnapshot]
    );


    // Permitir soltar elementos
    const onDragOver = useCallback((event) => {

        event.preventDefault();

        event.dataTransfer.dropEffect = "move";

    }, []);


    // Crear nodo al soltar
    const onDrop = useCallback(
        (event) => {

            event.preventDefault();

            const item = itemDeBarra(dragItemId);

            if (!item) {
                return;
            }

            const { type } = item;


            const position =
                screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                });


            // Los nodos nacen vacíos: muestran su nombre atenuado
            // como ayuda (ver nodeNames.js). Una llamada (Preparación)
            // arranca con una variable de datos que se pueda llamar
            // desde acá, si hay alguna.
            const label =
                type === CALL_NODE_TYPE
                    ? nombreLlamadaPorDefecto({
                        pagina: currentPage,
                        paginas: pages,
                        generico: "",
                    })
                    : "";


            const newNode = {

                id: `${type}-${Date.now()}`,

                type: "custom",

                position,

                data: {
                    type,
                    label,
                    // p. ej. el lado del punto de un Conector
                    ...item.data,
                },

            };


            takeSnapshot();

            setNodes((currentNodes) => [
                ...currentNodes,
                newNode,
            ]);

        },
        [
            dragItemId,
            screenToFlowPosition,
            setNodes,
            takeSnapshot,
            currentPage,
            pages,
        ]
    );


    // Antes de borrar (tecla Supr), guardar en el historial
    const onBeforeDelete = useCallback(
        async ({ nodes: toDelete, edges: edgesToDelete }) => {
            if (toDelete.length > 0 || edgesToDelete.length > 0) {
                takeSnapshot();
            }

            return true;
        },
        [takeSnapshot]
    );

    const theme = useTheme();

    return (
        <HistoryProvider value={history}>
            <div className="diagram-flow-container">

                {/* Barra lateral */}
                <Sidebar
                    edgeType={edgeType}
                    onEdgeTypeChange={changeEdgeType}
                    onRun={onRun}
                    hasDiagram={hasDiagram}
                />

                {/* Área de React Flow */}
                <div className="diagram-flow-area">

                    {/* Definición de las flechas de los conectores */}
                    <EdgeMarkers />

                    <div className="diagram-canvas" ref={canvasRef}>
                        <PageProvider value={pageContext}>
                            <ReactFlow
                                nodes={displayNodes}
                                edges={edgesWithMarkers}

                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}

                                onConnect={onConnect}

                                // Historial: guardar antes de mover o borrar
                                onNodeDragStart={takeSnapshot}
                                onSelectionDragStart={takeSnapshot}
                                onBeforeDelete={onBeforeDelete}

                                onDragOver={onDragOver}
                                onDrop={onDrop}

                                nodeTypes={nodeTypes}
                                defaultEdgeOptions={defaultEdgeOptions}

                                deleteKeyCode={active ? "Delete" : null}
                                colorMode={theme}

                                // Click derecho + arrastrar: mover el lienzo
                                panOnDrag={[2]}
                                // Click izquierdo + arrastrar: selección múltiple
                                selectionOnDrag
                                selectionMode={SelectionMode.Partial}
                                // Sin menú contextual del navegador al usar el click derecho
                                onPaneContextMenu={preventContextMenu}
                                onNodeContextMenu={preventContextMenu}
                                onEdgeContextMenu={preventContextMenu}
                                onSelectionContextMenu={preventContextMenu}
                            >

                                <Background />

                                <Controls />

                                <MiniMap
                                    pannable
                                    zoomable
                                    nodeClassName={(node) =>
                                        `minimap-node--${node.data?.type}`
                                    }
                                />


                            </ReactFlow>
                        </PageProvider>

                        {/* Qué se generó desde el Análisis Previo */}
                        {showNotice && (
                            <GenerationNotice
                                generacion={generacion}
                                onClose={() => setShowNotice(false)}
                            />
                        )}
                    </div>

                    {/* Páginas: Main + variables de datos */}
                    <PageBar
                        pages={pages}
                        activePage={activePage}
                        onSelect={switchPage}
                    />

                </div>

                {/* Barra lateral derecha: variables */}
                <VariablesPanel
                    variables={variables}
                    onChange={setVariables}
                    reservedNames={nombresDeFunciones}
                />

            </div>
        </HistoryProvider>
    );
}


export default function Diagrama() {

    // Vista activa: editor del diagrama o ejecución
    const [vista, setVista] = useState(VISTAS.editor);

    const enEditor = vista === VISTAS.editor;

    // El editor oculto no recibe foco ni clicks (inert).
    // Se asigna por ref para que funcione igual en React 18 y 19.
    const editorRef = useRef(null);

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.inert = !enEditor;
        }
    }, [enEditor]);

    // Pantalla completa: solo el editor (sin barra de
    // navegación ni pie de página)
    return (
        <main className="diagram-page bg-background text-foreground">

            {/* Barra superior: pestañas + modo claro/oscuro */}
            <header className="diagram-topbar">
                <DiagramaTabs
                    value={vista}
                    onChange={setVista}
                />

                <ThemeToggle className="diagram-theme-toggle" />
            </header>

            <div className="diagram-views">

                {/*
                  * Editor: siempre montado (solo se oculta) para no
                  * perder el diagrama ni las variables al cambiar de
                  * pestaña, ya que todavía no se guardan.
                  */}
                <div
                    id={panelId(VISTAS.editor)}
                    role="tabpanel"
                    aria-labelledby={tabId(VISTAS.editor)}
                    ref={editorRef}
                    className={`diagram-view ${enEditor ? "" : "is-hidden"}`}
                >
                    <ReactFlowProvider>

                        <DnDProvider>

                            <Flow
                                active={enEditor}
                                onRun={() => setVista(VISTAS.ejecucion)}
                            />

                        </DnDProvider>

                    </ReactFlowProvider>
                </div>

                {/* Ejecución */}
                {!enEditor && (
                    <div
                        id={panelId(VISTAS.ejecucion)}
                        role="tabpanel"
                        aria-labelledby={tabId(VISTAS.ejecucion)}
                        className="diagram-view diagram-view--overlay"
                    >
                        <ExecutionView
                            onBack={() => setVista(VISTAS.editor)}
                        />
                    </div>
                )}

            </div>

        </main>
    );
}