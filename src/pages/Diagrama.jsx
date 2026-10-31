import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import useTheme from "../hooks/useTheme";

import {
    ReactFlow,
    ReactFlowProvider,
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
import CustomNode from "../components/diagrama/CustomNode.jsx";
import {
    DnDProvider,
    useDnD,
} from "../components/diagrama/DnDContext.jsx";

import "../components/diagrama/Diagrama.css";


const nodeTypes = {
    custom: CustomNode,
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

    // Tipo de conector global: aplica a todos los edges
    const [edgeType, setEdgeType] =
        useState("default");


    // Cambiar el tipo de todos los conectores existentes
    const changeEdgeType = useCallback(
        (newType) => {
            setEdgeType(newType);

            setEdges((currentEdges) =>
                currentEdges.map((edge) => ({
                    ...edge,
                    type: newType,
                }))
            );
        },
        [setEdges]
    );


    // Los conectores nuevos usan el tipo seleccionado
    const defaultEdgeOptions = useMemo(
        () => ({ type: edgeType }),
        [edgeType]
    );


    // Crear conexión entre nodos
    const onConnect = useCallback(
        (params) => {
            setEdges((currentEdges) =>
                addEdge(
                    { ...params, type: edgeType },
                    currentEdges
                )
            );
        },
        [setEdges, edgeType]
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


            setNodes((currentNodes) => [
                ...currentNodes,
                newNode,
            ]);

        },
        [
            type,
            screenToFlowPosition,
            setNodes,
        ]
    );

    const theme = useTheme();

    return (
        <div className="diagram-flow-container">

            {/* Barra lateral */}
            <Sidebar
                edgeType={edgeType}
                onEdgeTypeChange={changeEdgeType}
            />

            {/* Área de React Flow */}
            <div className="diagram-flow-area">

                <ReactFlow
                    nodes={nodes}
                    edges={edges}

                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}

                    onConnect={onConnect}

                    onDragOver={onDragOver}
                    onDrop={onDrop}

                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}

                    deleteKeyCode="Delete"
                    colorMode={theme}

                    fitView
                >

                    <Background />

                    <Controls />

                    <MiniMap
                        pannable
                        zoomable
                    />


                </ReactFlow>

            </div>

        </div>
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