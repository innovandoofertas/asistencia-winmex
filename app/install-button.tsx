"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallButton() {
  const [eventoInstalacion, setEventoInstalacion] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [instalada, setInstalada] = useState(false);

  useEffect(() => {
    const detectarInstalacion = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      setInstalada(standalone);
    };

    detectarInstalacion();

    const manejarBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setEventoInstalacion(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", manejarBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        manejarBeforeInstallPrompt
      );
    };
  }, []);

  async function instalarApp() {
    if (!eventoInstalacion) {
      alert(
        "Si no aparece la instalación automática, abre el menú de Chrome y elige 'Instalar aplicación' o 'Agregar a pantalla principal'."
      );
      return;
    }

    await eventoInstalacion.prompt();
    await eventoInstalacion.userChoice;

    setEventoInstalacion(null);
  }

  if (instalada) return null;

  return (
    <button
      onClick={instalarApp}
      style={{
        width: "100%",
        padding: 14,
        marginTop: 12,
        marginBottom: 12,
        borderRadius: 14,
        border: "none",
        background: "#facc15",
        color: "#0f172a",
        fontSize: 16,
        fontWeight: "bold",
        cursor: "pointer",
        boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
      }}
    >
      📲 Instalar aplicación
    </button>
  );
}