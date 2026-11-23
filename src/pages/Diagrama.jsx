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
import { problemasDeSintaxis } from "../components/diagrama/validacion.js";
import { fotoDelDiagrama } from "../components/diagrama/fotoDelDiagrama.js";
import { problemasDeSalidas } from "../components/diagrama/ejecucion/caminos.js";
import { revisarDiagrama } from "../components/diagrama/ejecucion/revision.js";
import {
    TIPO_RANDOM,
    parametrosDelAncla,
    randomsDelDiagrama,
    siguienteRandom,
    subrutinasEnUso,
    subrutinasNuevas,
} from "../components/diagrama/funcionGenerada.js";
import { PageProvider } from "../components/diagrama/PageContext.jsx";
import {
    funcionesDeDatos,
    sincronizarConAnalisis,
    variablesRandom,
} from "../components/diagrama/variables.js";
// Importar un diagrama guardado (JSON de Exportar)
import { leerDiagrama, tablaDelArchivo } from "../components/diagrama/importar/leerDiagrama.js";
import { EDGE_TYPES } from "../components/diagrama/EdgeTypeSelector.jsx";
import CustomNode from "../components/diagrama/CustomNode.jsx";
// Flechas editables (quiebres, tramos y curvas, como en Lucidchart)
import { edgeTypes } from "../components/diagrama/edges/index.js";
// Exportar a PNG, JPG o JSON
import { useExportar } from "../components/diagrama/exportar/useExportar.js";
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

// Tipo de conector al entrar (también el de los generados): Angular
const INITIAL_EDGE_TYPE = "smoothstep";

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

// Id de la pestaña de una subrutina nueva
let _subrutina = 0;
const nuevoIdSubrutina = () => `subrutina-${Date.now()}-${_subrutina++}`;

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
 *   revisionRef: Flow deja acá revisar() → { errores, programa }
 *           (ver ejecucion/revision.js). Lo usa Diagrama al abrir
 *           la pestaña Ejecución, venga de donde venga.
 */
function Flow({ active = true, onRun, revisionRef }) {

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

    // Diagrama generado desde el Análisis Previo, una sola vez al
    // entrar (ver generacion/). Si no se puede generar, Main arranca
    // solo con el Contexto, como antes. Usa las páginas de datos
    // (al entrar todavía no hay subrutinas).
    const [generacion] = useState(() =>
        generarDiagrama(analisis, {
            paginas: derivarPaginas(funciones),
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
    const [storeVersion, setStoreVersion] = useState(0);

    // Subrutinas creadas con la Función Generada tipo Subrutina:
    // [{ id, nombre, parametros }], una pestaña cada una (22/11)
    const [subrutinas, setSubrutinas] = useState([]);

    // Nodos de todas las páginas (la activa y las guardadas), para
    // los Random de la tabla y las subrutinas en uso
    const nodosDeTodas = useMemo(
        () => [
            nodes,
            ...Object.entries(pagesStoreRef.current)
                .filter(([pageId]) => pageId !== activePage)
                .map(([, page]) => page.nodes),
        ],
        // storeVersion: cambió lo guardado
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [nodes, activePage, storeVersion]
    );

    // Random del diagrama (R1, R2...): variables de la tabla sin valor
    // inicial, que aparecen y se van con sus nodos
    const randoms = useMemo(() => randomsDelDiagrama(nodosDeTodas), [nodosDeTodas]);
    const filasRandom = useMemo(() => variablesRandom(randoms), [randoms]);

    // Toda la tabla (para validar los nodos y exportar)
    const todasLasVariables = useMemo(
        () => [...variables, ...filasRandom],
        [variables, filasRandom]
    );

    const enUso = useMemo(() => subrutinasEnUso(nodosDeTodas), [nodosDeTodas]);

    // Lista de páginas: Main, una por variable de datos y una por
    // subrutina
    const pages = useMemo(
        () => derivarPaginas(funciones, subrutinas, enUso),
        [funciones, subrutinas, enUso]
    );

    const nombresDeSubrutinas = useMemo(
        () => subrutinas.map((s) => s.nombre),
        [subrutinas]
    );

    // Nombres que una subrutina nueva no puede usar
    const ocupados = useMemo(
        () => ({
            variables: new Set(variables.map((v) => String(v.nombre ?? "").trim())),
            datos: new Set(nombresDeFunciones),
            randoms: new Set(randoms),
        }),
        [variables, nombresDeFunciones, randoms]
    );

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


    // Subrutinas: al nombrar un nodo Subrutina con un nombre nuevo se
    // crea su pestaña (con el mismo nombre, la llama). En el ancla de
    // una subrutina se cambian sus parámetros.
    useEffect(() => {
        const nuevas = subrutinasNuevas({
            nodes,
            subrutinas,
            pagina: currentPage,
            ocupados,
        });

        if (nuevas.length > 0) {
            setSubrutinas((actuales) => [
                ...actuales,
                ...nuevas.map((firma) => ({ id: nuevoIdSubrutina(), ...firma })),
            ]);
        }

        const propia = subrutinas.find((s) => s.id === currentPage?.id);
        const parametros = propia && parametrosDelAncla(nodes, propia);

        if (parametros) {
            setSubrutinas((actuales) =>
                actuales.map((s) => (s.id === propia.id ? { ...s, parametros } : s))
            );
        }
    }, [nodes, subrutinas, currentPage, ocupados]);


    // Contexto para los nodos: errores a marcar y validación
    // de nombres (una variable no puede llamarse a sí misma).
    // Primero la BNF (sintaxis y uso de variables); los pendientes y
    // las llamadas explican mejor qué hacer, así que tienen prioridad.
    const nodeIssues = useMemo(
        () => ({
            ...problemasDeSintaxis({
                nodes,
                pagina: currentPage,
                paginas: pages,
                variables: todasLasVariables,
            }),
            // Un punto de salida con varias flechas (dos caminos)
            ...problemasDeSalidas({ nodes, edges }),
            ...problemasDeNodos({ nodes, pagina: currentPage, paginas: pages }),
        }),
        [nodes, edges, currentPage, pages, todasLasVariables]
    );

    // Revisión de todo el diagrama antes de interpretarlo: si pasa,
    // devuelve el programa (JSON) para el motor
    useEffect(() => {
        if (!revisionRef) return;

        revisionRef.current = () =>
            revisarDiagrama({
                foto: fotoDelDiagrama({
                    pages,
                    activePage,
                    store: pagesStoreRef.current,
                    activa: { nodes: getNodes(), edges: getEdges() },
                }),
                paginas: pages,
                variables: todasLasVariables,
            });
    }, [revisionRef, pages, activePage, getNodes, getEdges, todasLasVariables]);

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

    // Botón Exportar: imagen de la página actual o JSON de todo
    const exportar = useExportar({
        canvasRef,
        pages,
        activePage,
        pagesStoreRef,
        variables: todasLasVariables,
        edgeType,
    });


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


    // Borrar la pestaña de una subrutina que ya no se usa (botón de la
    // barra de páginas). Si tiene algo dibujado, se pide confirmación.
    const borrarSubrutina = useCallback(
        (pageId) => {
            const pagina = pages.find((p) => p.id === pageId);

            if (pagina?.tipo !== "subrutina") {
                return;
            }

            const contenido =
                pageId === activePage
                    ? { nodes: getNodes(), edges: getEdges() }
                    : pagesStoreRef.current[pageId];

            if (
                contenido &&
                tieneContenido(contenido) &&
                !window.confirm(
                    `¿Borrar la pestaña "${pagina.firma}"? Se pierde lo que dibujaste en ella.`
                )
            ) {
                return;
            }

            if (pageId === activePage) {
                switchPage(MAIN_PAGE_ID);
            }

            delete pagesStoreRef.current[pageId];
            setSubrutinas((actuales) => actuales.filter((s) => s.id !== pageId));
            setStoreVersion((v) => v + 1);
        },
        [pages, activePage, getNodes, getEdges, switchPage]
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


    // Botón Importar: reemplaza todo el diagrama por el de un JSON
    // exportado. Las pestañas de datos salen del Análisis Previo actual
    // (las del archivo se ubican por nombre) y la tabla también se
    // sincroniza con él. Ver importar/leerDiagrama.js.
    const importar = useCallback(
        async (texto) => {
            const leido = leerDiagrama(texto, {
                funciones,
                tiposDeFlecha: EDGE_TYPES.map((t) => t.type),
            });

            if (!leido.ok) {
                return { error: leido.error };
            }

            if (
                hasDiagram &&
                !window.confirm(
                    "¿Reemplazar el diagrama actual por el del archivo? Se pierde lo que no hayas exportado."
                )
            ) {
                return { importado: false };
            }

            const { main, datos, subrutinas: importadas, variables: tabla, edgeType: tipo } =
                leido.diagrama;
            const avisos = [...leido.avisos];

            // Variables del Análisis Previo: mandan las del análisis actual
            // (con el valor inicial del archivo)
            const { variables: nuevasVariables, fuera } = tablaDelArchivo(tabla, analisis);

            if (fuera.length > 0) {
                avisos.push(
                    `No están en el Análisis Previo actual (no se importaron): ${fuera.join(", ")}.`
                );
            }

            pagesStoreRef.current = {
                ...Object.fromEntries(
                    Object.entries(datos).map(([id, pagina]) => [id, { ...pagina, viewport: null }])
                ),
                ...Object.fromEntries(
                    importadas.map((s) => [s.id, { nodes: s.nodes, edges: s.edges, viewport: null }])
                ),
            };

            setSubrutinas(
                importadas.map(({ id, nombre, parametros }) => ({ id, nombre, parametros }))
            );
            setVariables(nuevasVariables);
            setEdgeType(tipo);

            setNodes(main.nodes);
            setEdges(main.edges);
            setActivePage(MAIN_PAGE_ID);
            setViewport(initialViewport(main.nodes, canvasRef.current?.clientWidth ?? 0));

            // Deshacer no vuelve al diagrama anterior
            history.reset();
            setShowNotice(false);
            setStoreVersion((v) => v + 1);

            return { importado: true, avisos };
        },
        // hasDiagram cambia en cada render: se lee el de este render
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [funciones, analisis, hasDiagram, history, setNodes, setEdges, setViewport]
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
            // como ayuda (ver nodeNames.js). Una fdp arranca con una
            // variable de datos que se pueda llamar desde acá, si hay
            // alguna, y un Random con el primer Rn libre (R1, R2...).
            // La Subrutina nace vacía: al nombrarla se crea su pestaña.
            const label =
                type === CALL_NODE_TYPE
                    ? nombreLlamadaPorDefecto({
                        pagina: currentPage,
                        paginas: pages,
                        generico: "",
                    })
                    : type === TIPO_RANDOM
                        ? siguienteRandom(nodosDeTodas)
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
            nodosDeTodas,
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
                    onExport={exportar}
                    onImport={importar}
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
                                edgeTypes={edgeTypes}
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
                        onDelete={borrarSubrutina}
                    />

                </div>

                {/* Barra lateral derecha: variables */}
                <VariablesPanel
                    variables={variables}
                    onChange={setVariables}
                    reservedNames={nombresDeFunciones}
                    subroutineNames={nombresDeSubrutinas}
                    randoms={filasRandom}
                />

            </div>
        </HistoryProvider>
    );
}


export default function Diagrama() {

    // Vista activa: editor del diagrama o ejecución
    const [vista, setVista] = useState(VISTAS.editor);

    // Al abrir Ejecución (botón o pestaña) se revisa el diagrama:
    // si hay errores, se muestran ahí y no se interpreta; si no,
    // queda el programa listo para el motor
    const revisionRef = useRef(null);
    const [revision, setRevision] = useState({ errores: [], programa: null, numero: 0 });

    const cambiarVista = useCallback((nueva) => {
        if (nueva === VISTAS.ejecucion) {
            // Cada revisión con su número: la vista de ejecución empieza de cero
            setRevision((anterior) => ({
                ...(revisionRef.current?.() ?? { errores: [], programa: null }),
                numero: anterior.numero + 1,
            }));
        }
        setVista(nueva);
    }, []);

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
                    onChange={cambiarVista}
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
                                onRun={() => cambiarVista(VISTAS.ejecucion)}
                                revisionRef={revisionRef}
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
                            errores={revision.errores}
                            programa={revision.programa}
                            graficables={revision.graficables}
                            revision={revision.numero}
                            onBack={() => setVista(VISTAS.editor)}
                        />
                    </div>
                )}

            </div>

        </main>
    );
}