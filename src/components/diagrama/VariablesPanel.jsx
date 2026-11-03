import { useMemo, useState } from "react";

import {
    VALOR_INICIAL_DEFAULT,
    detalleVariable,
    esImportada,
    nuevaVariable,
    nuevoIdVariable,
    textoDimension,
    validarVariables,
} from "./variables";

import "./VariablesPanel.css";

/*
 * =====================================================
 * PANEL DE VARIABLES (barra lateral derecha)
 * -----------------------------------------------------
 * Tabla editable: Variable | Valor inicial.
 * La última fila siempre está vacía: al escribir en
 * ella se crea una variable nueva (como una planilla).
 *
 * Las variables del Análisis Previo llegan con nombre
 * fijo (no se renombran ni se borran acá): solo se
 * completa su valor inicial.
 *
 * Es un componente controlado: recibe `variables` y
 * avisa cada cambio con `onChange(nuevasVariables)`.
 * =====================================================
 */

export default function VariablesPanel({ variables, onChange }) {
    // Id reservado para la fila vacía. Al convertirse en
    // variable conserva el id, así React mantiene el foco.
    const [draftId, setDraftId] = useState(nuevoIdVariable);

    const errores = useMemo(
        () => validarVariables(variables),
        [variables]
    );

    const updateVariable = (id, campo, valor) => {
        if (id === draftId) {
            onChange([...variables, nuevaVariable(id, { [campo]: valor })]);
            setDraftId(nuevoIdVariable());
            return;
        }

        onChange(
            variables.map((v) => (v.id === id ? { ...v, [campo]: valor } : v))
        );
    };

    // El valor inicial nunca queda vacío
    const completarValor = (variable) => {
        if (!String(variable.valorInicial).trim()) {
            updateVariable(variable.id, "valorInicial", VALOR_INICIAL_DEFAULT);
        }
    };

    const removeVariable = (id) => {
        onChange(variables.filter((v) => v.id !== id));
    };

    const filas = [
        ...variables,
        { id: draftId, nombre: "", valorInicial: "", isDraft: true },
    ];

    return (
        <aside className="variables-panel" aria-label="Variables">
            <div className="variables-table-wrapper">
                <table className="variables-table">
                    <thead>
                        <tr>
                            <th scope="col">Variable</th>
                            <th scope="col">Valor inicial</th>
                            <th scope="col" aria-label="Acciones" />
                        </tr>
                    </thead>

                    <tbody>
                        {filas.map((variable) => {
                            const error = variable.isDraft
                                ? undefined
                                : errores[variable.id];

                            const importada = esImportada(variable);

                            return (
                                <tr
                                    key={variable.id}
                                    className={variable.isDraft ? "is-draft" : ""}
                                >
                                    <td>
                                        {importada ? (
                                            <div
                                                className={`variables-name ${error?.nombre ? "is-invalid" : ""}`}
                                                title={[
                                                    detalleVariable(variable),
                                                    error?.nombre &&
                                                        `${error.nombre} Corregilo en el Análisis Previo.`,
                                                ]
                                                    .filter(Boolean)
                                                    .join("\n")}
                                            >
                                                <span className="variables-name-text">
                                                    {variable.nombre}
                                                </span>

                                                {variable.esVector && (
                                                    <span className="variables-vector">
                                                        [{textoDimension(variable.dimension) || "?"}]
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <input
                                                className={`variables-input ${error?.nombre ? "is-invalid" : ""}`}
                                                value={variable.nombre}
                                                placeholder={variable.isDraft ? "Nueva" : ""}
                                                onChange={(e) =>
                                                    updateVariable(variable.id, "nombre", e.target.value)
                                                }
                                                aria-label="Nombre de la variable"
                                                aria-invalid={Boolean(error?.nombre)}
                                                title={error?.nombre}
                                                spellCheck={false}
                                                autoComplete="off"
                                            />
                                        )}
                                    </td>

                                    <td>
                                        <input
                                            className={`variables-input variables-input--value ${error?.valorInicial ? "is-invalid" : ""}`}
                                            value={variable.valorInicial}
                                            placeholder={variable.isDraft ? VALOR_INICIAL_DEFAULT : ""}
                                            inputMode="decimal"
                                            onChange={(e) =>
                                                updateVariable(variable.id, "valorInicial", e.target.value)
                                            }
                                            onBlur={() =>
                                                !variable.isDraft && completarValor(variable)
                                            }
                                            aria-label={`Valor inicial de ${variable.nombre || "la variable"}`}
                                            aria-invalid={Boolean(error?.valorInicial)}
                                            title={error?.valorInicial}
                                            autoComplete="off"
                                        />
                                    </td>

                                    <td className="variables-actions">
                                        {!variable.isDraft && !importada && (
                                            <button
                                                type="button"
                                                className="variables-remove"
                                                onClick={() => removeVariable(variable.id)}
                                                aria-label={`Eliminar ${variable.nombre || "variable"}`}
                                                title="Eliminar"
                                            >
                                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                                    <path d="M7 7 L17 17" />
                                                    <path d="M17 7 L7 17" />
                                                </svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </aside>
    );
}
