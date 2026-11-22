import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    Handle,
    Position,
    useReactFlow,
} from "@xyflow/react";

import { FlowShape } from "./shapes";
import { useHistory } from "./HistoryContext";
import { usePageContext } from "./PageContext";
import { END_NODE_TYPE, NODE_NAMES, placeholderDe } from "./nodeNames";
import "./CustomNode.css";

/*
 * Mide el tamaño real del nodo (sin el zoom del lienzo)
 * para dibujar el SVG a escala 1:1. Así el contorno
 * mide lo mismo en todas las figuras, aunque el nodo
 * crezca por un texto largo.
 */
function useNodeSize(ref) {
    const [size, setSize] = useState(null);

    useLayoutEffect(() => {
        const element = ref.current;

        if (!element) {
            return;
        }

        const measure = () => {
            setSize((current) => {
                const width = element.offsetWidth;
                const height = element.offsetHeight;

                if (current?.width === width && current?.height === height) {
                    return current;
                }

                return { width, height };
            });
        };

        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(element);

        return () => observer.disconnect();
    }, [ref]);

    return size;
}

// Ayuda de los tres tipos de Función Generada (22/11)
const TOOLTIPS_FUNCION_GENERADA = {
    preparation:
        "fdp: llama a una variable de datos del Análisis Previo (p. ej. IA). Doble clic para cambiarla.",
    subroutine:
        "Subrutina: doble clic para escribir su nombre y parámetros, p. ej. calcular() o calcular(A, B). La primera vez crea su pestaña; con el mismo nombre, la llama.",
    random:
        "Random: toma un valor nuevo, entre 0 y 1, cada vez que pasa por acá. Doble clic para cambiar su nombre (R1, R2…).",
};

// Texto de ayuda (tooltip) de un nodo sin problemas
function ayudaDelNodo({ anchorEditable, isAnchor, type, isContext, isConnector, isEnd, multiline }) {
    if (anchorEditable) {
        return "Inicio de la subrutina. Doble clic para cambiar sus parámetros (el nombre no cambia).";
    }
    if (isAnchor) {
        return "Inicio de la variable de datos. Su nombre se cambia en el Análisis Previo.";
    }
    if (TOOLTIPS_FUNCION_GENERADA[type]) {
        return TOOLTIPS_FUNCION_GENERADA[type];
    }
    if (isContext) {
        return "Inicio del algoritmo. Doble clic para cambiar valores iniciales de la tabla (una asignación por línea, p. ej. T = 0; Ctrl+Enter guarda).";
    }
    if (isConnector) {
        return "Doble clic para editar la etiqueta (un nombre, p. ej. C1). Los conectores con la misma etiqueta están vinculados.";
    }
    if (isEnd) {
        return "Fin: el algoritmo de esta página termina acá.";
    }
    if (multiline) {
        return "Doble clic para editar: una sentencia por línea (Ctrl+Enter guarda).";
    }
    return undefined;
}

// Tiempo que se muestra el aviso de un nombre rechazado
const NOTICE_MS = 2800;

// Conector: un único punto de conexión a un costado, que sirve de
// entrada y de salida (dos handles superpuestos, ver ConnectorHandle).
// El lado se elige al arrastrarlo desde la barra lateral (hay un
// Conector para cada lado) y no cambia después.
const CONNECTOR_SIDES = {
    right: Position.Right,
    left: Position.Left,
};

/*
 * Punto único del Conector. Son dos handles en el mismo lugar:
 * uno de entrada (target) y otro de salida (source). React Flow
 * elige el de tipo opuesto al conectar, así que para el usuario
 * es un solo punto que recibe o envía flechas.
 */
function ConnectorHandle({ side }) {
    const position = CONNECTOR_SIDES[side] ?? Position.Right;

    return (
        <>
            <Handle
                type="target"
                position={position}
                id="c-in"
                className="connector-handle"
            />
            <Handle
                type="source"
                position={position}
                id="c-out"
                className="connector-handle"
            />
        </>
    );
}

export default function CustomNode({ id, data, selected }) {
    const { setNodes } = useReactFlow();
    const { takeSnapshot } = useHistory();
    const { nodeIssues, validateLabel } = usePageContext();

    const nodeRef = useRef(null);
    const size = useNodeSize(nodeRef);

    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(data.label);

    // Evita guardar dos veces (Enter + blur al desmontar el input)
    const editingRef = useRef(false);

    // Aviso breve cuando un nombre se rechaza
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        if (!notice) {
            return undefined;
        }

        const timer = setTimeout(() => setNotice(null), NOTICE_MS);
        return () => clearTimeout(timer);
    }, [notice]);

    const isDecision = data.type === "decision";
    const isConnector = data.type === "connector";

    // Fin: texto fijo, solo entrada (arriba). Termina el algoritmo
    // de la página (en Main, la simulación).
    const isEnd = data.type === END_NODE_TYPE;

    // Contexto: inicio fijo de Main, donde se declaran variables
    // (una por línea). Solo tiene salida y se edita en varias líneas.
    const isContext = data.type === "context";

    // Nodo ancla: encabeza la página de su variable de datos.
    // Es el inicio (solo salida) y su nombre viene del Análisis Previo.
    const isAnchor = Boolean(data.anchorOf);

    // El ancla de una subrutina sí se edita: ahí se cambian sus
    // parámetros (el nombre queda fijo, ver pages.js)
    const anchorEditable = isAnchor && data.type === "subroutine";

    // Inicio del algoritmo de la página: no recibe conexiones
    const isStart = isAnchor || isContext;

    // Varias líneas: el Contexto (declaraciones) y la Asignación
    // (una sentencia por línea, ver BNF)
    const multiline = isContext || data.type === "process";

    // Nodo generado desde el Análisis Previo que el usuario tiene
    // que completar (se marca en rojo hasta que lo edite)
    const isPending = Boolean(data.pending);

    const connectorSide = data.handleSide === "left" ? "left" : "right";

    const issue = nodeIssues?.[id];

    const updateData = (changes) => {
        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === id
                    ? { ...node, data: { ...node.data, ...changes } }
                    : node
            )
        );
    };

    const startEditing = () => {
        // Ya editando (p. ej. doble clic dentro del campo para
        // seleccionar una palabra): no reiniciar el texto
        if ((isAnchor && !anchorEditable) || isEnd || editingRef.current) {
            return;
        }

        setText(data.label);
        editingRef.current = true;
        setEditing(true);
    };

    const stopEditing = () => {
        editingRef.current = false;
        setEditing(false);
    };

    /*
     * confirm: el usuario guardó a propósito (Enter o Ctrl+Enter), no
     * solo salió del nodo. Sirve para aceptar tal cual el texto de un
     * nodo generado marcado para completar.
     */
    const saveText = ({ confirm = false } = {}) => {
        if (!editingRef.current) {
            return;
        }

        stopEditing();

        // Un nodo puede quedar vacío: vuelve a mostrar su texto de ayuda
        const newLabel = multiline ? text.replace(/\s+$/, "") : text.trim();
        const changed = newLabel !== data.label;

        if (!changed && !(confirm && isPending)) {
            return;
        }

        const rejection =
            changed && validateLabel?.({ data, nombre: newLabel });

        if (rejection) {
            setText(data.label);
            setNotice(rejection);
            return;
        }

        takeSnapshot();
        updateData({
            label: newLabel,
            // Editado: deja de estar pendiente y pierde la ayuda generada
            ...(isPending && { pending: undefined, hint: undefined }),
        });
    };

    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            setText(data.label);
            stopEditing();
            return;
        }

        // En varias líneas, Enter agrega un renglón y
        // Ctrl/Cmd + Enter guarda
        if (event.key === "Enter" && (!multiline || event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            saveText({ confirm: true });
        }
    };

    // Conector: también se edita con el nodo seleccionado y Enter o F2
    // (es chico, así es más cómodo con el teclado)
    useEffect(() => {
        const wrapper = nodeRef.current?.closest(".react-flow__node");

        if (!isConnector || !wrapper) {
            return undefined;
        }

        const onKeyDown = (event) => {
            if (
                (event.key === "Enter" || event.key === "F2") &&
                !editingRef.current &&
                event.target === wrapper
            ) {
                event.preventDefault();
                startEditing();
            }
        };

        wrapper.addEventListener("keydown", onKeyDown);
        return () => wrapper.removeEventListener("keydown", onKeyDown);
    });

    const tooltip = issue || ayudaDelNodo({
        anchorEditable,
        isAnchor,
        type: data.type,
        isContext,
        isConnector,
        isEnd,
        multiline,
    });

    // Nodo sin texto: muestra su nombre atenuado como ayuda
    // (p. ej. "Asignación"), que desaparece al editar. Los nodos
    // generados traen una ayuda propia (p. ej. "Actualizar estado").
    const placeholder = data.hint || placeholderDe(data.type);
    const isEmpty = !isEnd && !editing && !String(data.label ?? "").trim();

    // Texto que define el tamaño del nodo (ver flow-node__label).
    // Al editar un nodo vacío se mide con el texto de ayuda, así
    // la figura no cambia de tamaño al empezar a escribir.
    const mirrorText = isEnd
        ? NODE_NAMES[END_NODE_TYPE]
        : editing
            ? (text || placeholder) + (text.endsWith("\n") ? "\u00a0" : "")
            : data.label;

    return (
        <div
            ref={nodeRef}
            className={[
                "flow-node",
                `flow-node--${data.type}`,
                selected && "is-selected",
                isAnchor && "is-anchor",
                issue && "has-issue",
            ]
                .filter(Boolean)
                .join(" ")}
            title={tooltip}
            onDoubleClick={isConnector ? startEditing : undefined}
        >
            {isStart && (
                <span className="flow-node__badge" aria-hidden="true">
                    Inicio
                </span>
            )}

            {size && (
                <FlowShape
                    type={data.type}
                    width={size.width}
                    height={size.height}
                    className="flow-node__shape"
                />
            )}

            {/* Entrada arriba (el inicio y el conector no la tienen ahí;
                el Fin solo tiene esta) */}
            {!isStart && !isConnector && (
                <Handle
                    type="target"
                    position={Position.Top}
                    id={isDecision ? "input" : undefined}
                    className={isDecision ? "decision-handle" : undefined}
                />
            )}

            {/*
              * Al editar, el texto sigue en su lugar (invisible) y es
              * el que define el tamaño del nodo; el input se superpone
              * encima sin ocupar espacio. Así la figura no se deforma.
              */}
            <div
                className="flow-node__label"
                onDoubleClick={isConnector ? undefined : startEditing}
            >
                <span
                    className={[
                        "flow-node__text",
                        editing && "is-editing",
                        isEmpty && "is-empty",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                >
                    {isEmpty ? placeholder : mirrorText}
                </span>

                {editing && (multiline ? (
                    <textarea
                        autoFocus
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        onBlur={() => saveText()}
                        onKeyDown={handleKeyDown}
                        className="node-edit-input node-edit-input--multiline nodrag nowheel"
                        aria-label={
                            isContext
                                ? "Declaración de variables"
                                : "Sentencias de la asignación"
                        }
                        spellCheck={false}
                    />
                ) : (
                    <input
                        autoFocus
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        onBlur={() => saveText()}
                        onKeyDown={handleKeyDown}
                        className="node-edit-input nodrag"
                        aria-label="Texto del nodo"
                    />
                ))}
            </div>

            {isEnd ? null : isConnector ? (
                <ConnectorHandle side={connectorSide} />
            ) : isDecision ? (
                <>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="yes"
                        className="decision-handle"
                    />

                    <Handle
                        type="source"
                        position={Position.Left}
                        id="no"
                        className="decision-handle"
                    />

                    <span className="decision-label decision-label-yes">
                        SI
                    </span>

                    <span className="decision-label decision-label-no">
                        NO
                    </span>
                </>
            ) : (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    // El Resultado lo sube hasta su onda (ver CustomNode.css)
                    className={data.type === "document" ? "result-handle" : undefined}
                />
            )}

            {notice && (
                <span className="flow-node__notice" role="alert">
                    {notice}
                </span>
            )}
        </div>
    );
}
