import { useEffect, useState } from "react";

export default function useTheme() {
    const getTheme = () => {
        return document.documentElement.classList.contains("dark")
            ? "dark"
            : "light";
    };

    const [theme, setTheme] = useState(getTheme);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setTheme(getTheme());
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    return theme;
}