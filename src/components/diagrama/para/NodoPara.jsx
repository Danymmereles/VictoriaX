import { useMemo, useRef, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";

import { FlowShape } from "../shapes";
import { useHistory } from "../HistoryContext";
import { usePageContext } from "../PageContext";
import { HANDLES_DEL_PARA, partesDelPara } from "./para.js";
import { diametroDelPara } from "./tamano.js";
import "./NodoPara.css";

/*
 * =====================================================
 * NODO PARA (for)
 * -----------------------------------------------------
 * Círculo en tres partes (ver para.js):
 *   arriba: la variable · abajo: valor inicial | final
 * Doble clic en una parte la edita; las tres quedan
 * editables (Tab pasa a la siguiente). Enter guarda,
 * Escape descarta y salir del nodo guarda.
 * El círculo crece si el texto no entra (tamano.js).
 * =====================================================
 */

const PARTES = ["variable", "desde", "hasta"];

// Texto de ayuda de cada parte vacía
const AYUDA = { variable: "V", desde: "desde", hasta: "hasta" };

const ETIQUETA = {
    variable: "Variable del Para",
    desde: "Valor inicial",
    hasta: "Valor final",
};

const TOOLTIP =
    "Para (for): la variable va del valor inicial al final (incluido), de a 1. " +
    "Entra por arriba; el ciclo sale por abajo y vuelve por la izquierda; al terminar, sigue por la derecha. " +
    "Doble clic en cada parte para editarla (Tab pasa a la siguiente, Enter guarda).";

export default function NodoPara({ id, data, selected }) {
    const { setNodes } = useReactFlow();
    const { takeSnapshot } = useHistory();
    const { nodeIssues } = usePageContext();

    const nodoRef = useRef(null);
    const entradas = useRef({});

    // null o la parte con la que se empezó a editar
    const [editando, setEditando] = useState(null);
    const [borrador, setBorrador] = useState(() => partesDelPara(data));

    const partes = editando ? borrador : partesDelPara(data);
    const issue = nodeIssues?.[id];

    // Lo que se ve en cada parte (la ayuda si está vacía)
    const visible = (parte) => partes[parte].trim() || AYUDA[parte];
    const diametro = useMemo(
        () => diametroDelPara({
            variable: visible("variable"),
            desde: visible("desde"),
            hasta: visible("hasta"),
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [partes.variable, partes.desde, partes.hasta]
    );

    const empezar = (parte) => {
        if (!editando) {
            setBorrador(partesDelPara(data));
            setEditando(parte);
        }
        // El campo ya existe si se estaba editando; si no, se enfoca al montarse
        requestAnimationFrame(() => entradas.current[parte]?.focus());
    };

    const terminar = (guardar) => {
        if (!editando) return;
        setEditando(null);

        if (!guardar) return;

        const nuevo = {
            label: borrador.variable.trim(),
            desde: borrador.desde.trim(),
            hasta: borrador.hasta.trim(),
        };
        const actual = partesDelPara(data);

        if (
            nuevo.label === actual.variable &&
            nuevo.desde === actual.desde &&
            nuevo.hasta === actual.hasta
        ) {
            return;
        }

        takeSnapshot();
        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, ...nuevo } } : node
            )
        );
    };

    const alSalir = (event) => {
        // Pasar de una parte a otra (Tab o clic) no termina la edición
        if (nodoRef.current?.contains(event.relatedTarget)) return;
        terminar(true);
    };

    const alTeclear = (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            terminar(false);
        } else if (event.key === "Enter") {
            event.preventDefault();
            terminar(true);
        }
    };

    return (
        <div
            ref={nodoRef}
            className={[
                "flow-node",
                "flow-node--for",
                selected && "is-selected",
                issue && "has-issue",
                editando && "is-editing",
            ]
                .filter(Boolean)
                .join(" ")}
            style={{ width: diametro, height: diametro }}
            title={issue || TOOLTIP}
        >
            <FlowShape type="for" width={diametro} height={diametro} className="flow-node__shape" />

            {PARTES.map((parte) => (
                <div
                    key={parte}
                    className={`para-parte para-parte--${parte}`}
                    onDoubleClick={() => empezar(parte)}
                >
                    {editando ? (
                        <input
                            ref={(el) => { entradas.current[parte] = el; }}
                            autoFocus={parte === editando}
                            value={borrador[parte]}
                            placeholder={AYUDA[parte]}
                            onChange={(event) =>
                                setBorrador((b) => ({ ...b, [parte]: event.target.value }))
                            }
                            onBlur={alSalir}
                            onKeyDown={alTeclear}
                            className="para-parte__input nodrag"
                            aria-label={ETIQUETA[parte]}
                            spellCheck={false}
                        />
                    ) : (
                        <span
                            className={`para-parte__texto${partes[parte].trim() ? "" : " is-empty"}`}
                            // Si es muy largo se corta con "…": el texto entero, al pasar el mouse
                            title={partes[parte].trim() ? `${ETIQUETA[parte]}: ${partes[parte].trim()}` : undefined}
                        >
                            {visible(parte)}
                        </span>
                    )}
                </div>
            ))}

            {/* Entra por arriba; el cuerpo vuelve por la izquierda */}
            <Handle type="target" position={Position.Top} id={HANDLES_DEL_PARA.entrada} />
            <Handle
                type="target"
                position={Position.Left}
                id={HANDLES_DEL_PARA.vuelta}
                className="para-handle"
                title="Vuelta del ciclo"
            />

            {/* El ciclo sale por abajo; al terminar, sigue por la derecha */}
            <Handle
                type="source"
                position={Position.Bottom}
                id={HANDLES_DEL_PARA.ciclo}
                className="para-handle"
                title="Ciclo"
            />
            <Handle
                type="source"
                position={Position.Right}
                id={HANDLES_DEL_PARA.salida}
                className="para-handle"
                title="Salida, al terminar"
            />

            <span className="para-label para-label--vuelta" aria-hidden="true">vuelta</span>
            <span className="para-label para-label--salida" aria-hidden="true">salida</span>
            <span className="para-label para-label--ciclo" aria-hidden="true">ciclo</span>
        </div>
    );
}
