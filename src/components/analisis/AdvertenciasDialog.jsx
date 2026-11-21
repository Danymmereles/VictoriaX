import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Aviso antes de pasar al diagrama: hay advertencias (no bloqueantes).
// El usuario puede continuar igual o volver a corregirlas.
export default function AdvertenciasDialog({ open, onOpenChange, advertencias = [], onContinuar }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#AF9BEF]" /> Tenés advertencias para corregir
          </AlertDialogTitle>
          <AlertDialogDescription>
            No bloquean el diagrama, pero conviene revisarlas antes de seguir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {advertencias.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel>Volver a corregir</AlertDialogCancel>
          <AlertDialogAction onClick={onContinuar}>Continuar igual</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}