export const PASSWORD_REQUIREMENTS_MESSAGE =
  "La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y al menos un número o carácter especial.";

/**
 * Evalúa los criterios de seguridad de una contraseña:
 * - Longitud mínima (8 caracteres)
 * - Al menos una letra mayúscula
 * - Al menos una letra minúscula
 * - Al menos un número o carácter especial
 */
export function getPasswordValidationState(password = "") {
  const pwd = typeof password === "string" ? password : "";
  const minLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumberOrSpecial = /[0-9]|[^A-Za-z0-9]/.test(pwd);

  const isValid = minLength && hasUppercase && hasLowercase && hasNumberOrSpecial;

  return {
    isValid,
    requirements: [
      { id: "length", label: "Al menos 8 caracteres", met: minLength },
      { id: "uppercase", label: "Al menos una mayúscula", met: hasUppercase },
      { id: "lowercase", label: "Al menos una minúscula", met: hasLowercase },
      { id: "special", label: "Al menos un número o carácter especial", met: hasNumberOrSpecial },
    ],
  };
}

export function validatePassword(password) {
  return getPasswordValidationState(password).isValid;
}
