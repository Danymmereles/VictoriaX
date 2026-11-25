import React from "react";
import { Check, Circle } from "lucide-react";
import { getPasswordValidationState } from "@/lib/passwordValidation";

export default function PasswordRequirements({ password = "", className = "" }) {
  const { requirements } = getPasswordValidationState(password);

  return (
    <div className={`space-y-1.5 rounded-lg border border-border/50 bg-muted/30 p-3 text-xs ${className}`}>
      <p className="font-medium text-muted-foreground">La contraseña debe incluir:</p>
      <ul className="grid grid-cols-1 gap-1 text-muted-foreground">
        {requirements.map((req) => (
          <li
            key={req.id}
            className={`flex items-center gap-2 transition-colors ${
              req.met ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"
            }`}
          >
            {req.met ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
            ) : (
              <Circle className="h-3 w-3 shrink-0 opacity-40" aria-hidden="true" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
