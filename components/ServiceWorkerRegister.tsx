"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && typeof window !== "undefined") {
      // Registrar o Service Worker após o carregamento da página
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log(
              "Nepsis SW registrado com sucesso:",
              registration.scope
            );

            // Verificar atualizações periodicamente
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // Novo SW disponível, notificar usuário se desejar
                    console.log("Nepsis: Nova versão disponível!");
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.log("Nepsis SW falhou ao registrar:", error);
          });
      });
    }
  }, []);

  return null;
}
