// Botón "Volver al diagrama" de la vista de Ejecución
export default function BotonVolver({ onBack }) {
    return (
        <button
            type="button"
            className="execution-back"
            onClick={onBack}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6 L9 12 L15 18" />
            </svg>
            Volver al diagrama
        </button>
    );
}
