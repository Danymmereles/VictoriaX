import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useTheme from "../hooks/useTheme";
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
import { sincronizarConAnalisis } from "../components/diagrama/variables.js";
import CustomNode from "../components/diagrama/CustomNode.jsx";
import {
    DnDProvider,
    useDnD,
} from "../components/diagrama/DnDContext.jsx";
import useUndoRedo from "../components/diagrama/useUndoRedo.js";
import { HistoryProvider } from "../components/diagrama/HistoryContext.jsx";

import "../components/diagrama/DiagramaTheme.css";
import "../components/diagrama/Diagrama.css";


const nodeTypes = {
    custom: CustomNode,
};


// El click derecho se usa para mover el lienzo
const preventContextMenu = (event) => {
    event.preventDefault();
};


// Obtener texto del nodo
function getNodeLabel(type) {
    switch (type) {
        case "input":
            return "Entrada";

        case "process":
            return "Proceso";

        case "decision":
            return "Decisión";

        case "output":
            return "Salida";

        case "document":
            return "Documento";

        case "io":
            return "Entrada / Salida";

        case "preparation":
            return "Preparación";

        case "connector":
            return "A";

        default:
            return "Nodo";
    }
}


/*
 * Editor del diagrama.
 *   active: false cuando hay otra vista abierta (Ejecución):
 *           se desactivan Supr y los atajos de Deshacer/Rehacer.
 *   onRun:  botón Ejecutar de la barra lateral.
 */
function Flow({ active = true, onRun }) {

    const [nodes, setNodes, onNodesChange] =
        useNodesState([]);

    const [edges, setEdges, onEdgesChange] =
        useEdgesState([]);

    const { screenToFlowPosition } =
        useReactFlow();

    const [type] = useDnD();

    // Variables del diagrama y sus valores iniciales.
    // Arrancan con TODAS las del Análisis Previo (Datos,
    // Control, Estado y Resultado), que se guarda en cada
    // cambio y por eso está al día al "Pasar a Diagramar".
    const [variables, setVariables] =
        useState(() => sincronizarConAnalisis([], cargarAnalisis()));

    // Tipo de conector global: aplica a todos los edges
    const [edgeType, setEdgeType] =
        useState("default");


    // Historial (Deshacer / Rehacer). También guarda el
    // tipo de conector para que el selector vuelva atrás.
    const history = useUndoRedo({
        shortcutsEnabled: active,
        getMeta: () => ({ edgeType }),
        onRestore: (snapshot) => {
            if (snapshot.meta?.edgeType) {
                setEdgeType(snapshot.meta.edgeType);
            }
        },
    });

    const { takeSnapshot } = history;


    // Cambiar el tipo de todos los conectores existentes
    const changeEdgeType = useCallback(
        (newType) => {
            if (newType === edgeType) {
                return;
            }

            takeSnapshot();
            setEdgeType(newType);

            setEdges((currentEdges) =>
                currentEdges.map((edge) => ({
                    ...edge,
                    type: newType,
                }))
            );
        },
        [setEdges, edgeType, takeSnapshot]
    );


    // Los conectores nuevos usan el tipo seleccionado
    // Todos los conectores terminan en flecha (markerEnd)
    const edgesWithMarkers = useMemo(
        () => withEdgeMarkers(edges),
        [edges]
    );


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

            if (!type) {
                return;
            }


            const position =
                screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                });


            const newNode = {

                id: `${type}-${Date.now()}`,

                type: "custom",

                position,

                data: {
                    type,
                    label: getNodeLabel(type),
                },

            };


            takeSnapshot();

            setNodes((currentNodes) => [
                ...currentNodes,
                newNode,
            ]);

        },
        [
            type,
            screenToFlowPosition,
            setNodes,
            takeSnapshot,
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
                    hasDiagram={nodes.length > 0 || edges.length > 0}
                />

                {/* Área de React Flow */}
                <div className="diagram-flow-area">

                    {/* Definición de las flechas de los conectores */}
                    <EdgeMarkers />

                    <ReactFlow
                        nodes={nodes}
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

                        fitView
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

                </div>

                {/* Barra lateral derecha: variables */}
                <VariablesPanel
                    variables={variables}
                    onChange={setVariables}
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

            <DiagramaTabs
                value={vista}
                onChange={setVista}
            />

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