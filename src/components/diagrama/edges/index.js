// ===========================================================================
// Flechas editables, como en Lucidchart (21/11).
//
// Reemplazan a las flechas de React Flow con los MISMOS nombres de tipo
// ("straight", "smoothstep", "default"), así el selector de tipo
// (EdgeTypeSelector), la generación y los diagramas existentes no cambian.
// Sin personalizar se ven igual que las de React Flow.
//
//   Derecha  (straight):   quiebres que se agregan desde la mitad de cada
//                          tramo, se mueven y se borran con doble clic.
//   Angular  (smoothstep): tramos que se desplazan con su píldora; doble
//                          clic vuelve a la ruta automática.
//   Curva    (default):    controles de las puntas y puntos por donde
//                          pasa la curva, con su tangente.
//
// Lo personalizado se guarda en edge.data.rutas[tipo] (ver useEdgeRoute):
// cada flecha recuerda su forma en cada tipo. Todo pasa por el historial.
//
// Archivos:
//   geometria.js, rutaRecta.js, rutaAngular.js, rutaCurva.js  lógica pura
//   useEdgeRoute.js     guardar la ruta y arrastrar manijas
//   EdgeHandles.jsx     manijas y líneas guía
//   *Edge.jsx           una flecha por tipo
// ===========================================================================

import AngularEdge from "./AngularEdge.jsx";
import CurveEdge from "./CurveEdge.jsx";
import StraightEdge from "./StraightEdge.jsx";

import "./edges.css";

// Objeto fijo (fuera de los componentes): React Flow pide que no cambie
export const edgeTypes = {
    straight: StraightEdge,
    smoothstep: AngularEdge,
    default: CurveEdge,
};
