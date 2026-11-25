// Autoguardado del análisis previo en MySQL (tablas ANALISIS_PREVIO + RESOLUCION).
//
// - iniciar({ resolucion, idEjercicio }) arranca el guardado. Sin resolución, la crea
//   recién cuando el análisis deja de estar vacío (al primer cambio).
// - Cada cambio se guarda solo después de `demora` ms sin tocar nada.
// - Los envíos van en fila, para que dos cambios rápidos no creen dos resoluciones.
// - detener() (o desmontar la página) manda lo que haya quedado pendiente.
// - Una resolución FINALIZADA ya no se guarda.
import { useCallback, useEffect, useRef, useState } from "react";
import { resolucionesClient, ESTADOS } from "@/api/resolucionesClient";
import { analisisVacio } from "@/lib/analisisPrevio";

const huella = (analisis) => JSON.stringify(analisis);

export function useGuardadoResolucion(analisis, { demora = 600 } = {}) {
  const [resolucion, setResolucion] = useState(null);
  const [error, setError] = useState("");
  const [activo, setActivo] = useState(false);
  // Contexto del análisis abierto: { resolucion, idEjercicio, guardado }.
  // Se reemplaza al cambiar de análisis; los envíos viejos siguen con el suyo.
  const ctx = useRef(null);
  const cola = useRef(Promise.resolve());
  const pendiente = useRef(null);

  const enviar = useCallback((c, a, estado) => {
    const tarea = cola.current.then(async () => {
      const h = huella(a);
      let r = c.resolucion;
      try {
        if (!r) {
          try {
            r = await resolucionesClient.create({ idEjercicio: c.idEjercicio, analisis: a });
          } catch (e) {
            // Ya existía (por ejemplo, abierta en otra pestaña): se sigue sobre esa.
            if (e.status !== 409 || !c.idEjercicio) throw e;
            const existente = await resolucionesClient.porEjercicio(c.idEjercicio);
            r = await resolucionesClient.update(existente.id, { analisis: a });
          }
          if (estado && r.estado !== estado) r = await resolucionesClient.update(r.id, { estado });
        } else if (h !== c.guardado || (estado && r.estado !== estado)) {
          r = await resolucionesClient.update(r.id, {
            analisis: h !== c.guardado ? a : undefined,
            estado: estado && r.estado !== estado ? estado : undefined,
          });
        }
      } catch (e) {
        if (ctx.current === c) setError(e.message || "No se pudo guardar el análisis.");
        throw e;
      }
      c.resolucion = r;
      c.guardado = h;
      if (ctx.current === c) {
        setResolucion(r);
        setError("");
      }
      return r;
    });
    cola.current = tarea.catch(() => {});
    return tarea;
  }, []);

  const vaciarPendiente = useCallback(() => {
    const p = pendiente.current;
    pendiente.current = null;
    if (p) enviar(p.c, p.analisis).catch(() => {});
  }, [enviar]);

  const iniciar = useCallback(
    ({ resolucion: inicial = null, idEjercicio = null } = {}) => {
      vaciarPendiente();
      ctx.current = {
        resolucion: inicial,
        idEjercicio,
        guardado: huella(inicial ? inicial.analisis : analisisVacio()),
      };
      setResolucion(inicial);
      setError("");
      setActivo(true);
    },
    [vaciarPendiente],
  );

  const detener = useCallback(() => {
    vaciarPendiente();
    ctx.current = null;
    setResolucion(null);
    setError("");
    setActivo(false);
  }, [vaciarPendiente]);

  // Guarda ya (sin esperar la demora) y, si se indica, cambia el estado.
  const guardar = useCallback(
    (a, estado) => {
      const c = ctx.current;
      if (!c) return Promise.reject(new Error("El guardado no está disponible."));
      pendiente.current = null;
      return enviar(c, a, estado);
    },
    [enviar],
  );

  useEffect(() => {
    const c = ctx.current;
    if (!c || c.resolucion?.estado === ESTADOS.FINALIZADO || huella(analisis) === c.guardado) {
      pendiente.current = null;
      return undefined;
    }
    pendiente.current = { c, analisis };
    const t = setTimeout(() => {
      pendiente.current = null;
      enviar(c, analisis).catch(() => {});
    }, demora);
    return () => clearTimeout(t);
  }, [analisis, activo, enviar, demora]);

  useEffect(() => detener, [detener]);

  return { resolucion, error, activo, iniciar, detener, guardar };
}
