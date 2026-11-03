import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
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


function Flow() {

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

                        deleteKeyCode="Delete"
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

    return (
        <div className="min-h-screen bg-background text-foreground">

            <NavBar />


            <main className="diagram-page">

                {/* Editor */}
                <ReactFlowProvider>

                    <DnDProvider>

                        <Flow />

                    </DnDProvider>

                </ReactFlowProvider>


                {/* Volver */}
                <div className="diagram-footer-action">

                    <Link
                        to="/modo-libre"
                        className="diagram-back-button"
                    >
                        <ArrowLeft className="w-4 h-4" />

                        Volver al análisis previo

                    </Link>

                </div>

            </main>


            <Footer />

        </div>
    );
}