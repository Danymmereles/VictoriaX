import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Workflow } from "lucide-react";
import NavBar from "@/components/home/NavBar";
import Footer from "@/components/home/Footer";
import { useCallback, useState } from "react";

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

import Sidebar from "../components/SideBar";
import CustomNode from "../components/CustomNode";

import { DnDProvider, useDnD } from "../components/DnDContext";

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

        default:
            return "Nodo";
    }
}

function Flow() {
    const [nodes, setNodes, onNodesChange] =
        useNodesState([]);

    const [edges, setEdges, onEdgesChange] =
        useEdgesState([]);

    const { screenToFlowPosition } = useReactFlow();

    // Obtenemos el tipo de nodo que se está arrastrando
    const [type] = useDnD();

    // Crear conexión
    const onConnect = useCallback(
        (params) => {
            setEdges((currentEdges) =>
                addEdge(params, currentEdges)
            );
        },
        [setEdges]
    );

    // Permitir Drop
    const onDragOver = useCallback((event) => {
        event.preventDefault();

        event.dataTransfer.dropEffect = "move";
    }, []);

    // Crear nodo
    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            // Si no existe un tipo, no hacemos nada
            if (!type) {
                return;
            }

            // Convertimos las coordenadas del mouse
            // a coordenadas internas de React Flow
            const position = screenToFlowPosition({
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

    return (
        <div className="flow-container">

            <Sidebar />

            <div className="flow-area">

                <ReactFlow
                    nodes={nodes}
                    edges={edges}

                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}

                    onConnect={onConnect}

                    onDragOver={onDragOver}
                    onDrop={onDrop}

                    nodeTypes={nodeTypes}

                    fitView
                >
                    <Background />
                    <Controls />
                </ReactFlow>

            </div>

        </div>
    );
}

export default function Diagrama() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-3xl px-6 py-32 text-center">
        <Workflow className="mx-auto w-10 h-10 text-[#AF9BEF]" />
          
        <Link to="/modo-libre" className="mt-10 inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm hover:border-[#AF9BEF]">
          <ArrowLeft className="w-4 h-4" /> Volver al análisis previo
        </Link>
      </main>
      <Footer />
    </div>
  );
}