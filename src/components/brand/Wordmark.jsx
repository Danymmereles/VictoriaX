import React from "react";
import { Link } from "react-router-dom";

export default function Wordmark({ withTagline = false }) {
  return (
    <Link to="/" className="inline-flex flex-col leading-none">
      <span className="font-heading text-2xl font-semibold tracking-tight">
        Victoria
        <span className="bg-gradient-to-r from-[#73C3EE] via-[#AF9BEF] to-[#EA84B4] bg-clip-text text-transparent">X</span>
      </span>
      {withTagline && (
        <span className="mt-1 text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
          Aprendizaje que se simula
        </span>
      )}
    </Link>
  );
}