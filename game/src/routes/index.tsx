import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

const BOOT_WATCH = `(function(){
  var ticks=0;
  var id=setInterval(function(){
    if(document.querySelector("#game-root canvas")){clearInterval(id);return;}
    ticks++;
    if(ticks<20)return;
    clearInterval(id);
    var box=document.getElementById("boot-fallback");
    var label=document.getElementById("boot-label");
    var detail=document.getElementById("boot-detail");
    if(detail&&!detail.textContent)detail.textContent="A abertura passou do tempo.";
    if(label)label.hidden=true;
    if(box)box.hidden=false;
  },1000);
})();`;

function showBootFailure(message: string): void {
  const label = document.getElementById("boot-label");
  const box = document.getElementById("boot-fallback");
  const detail = document.getElementById("boot-detail");
  if (detail) detail.textContent = message;
  if (label) label.hidden = true;
  if (box) box.hidden = false;
}

function Home() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    let dead = false;
    let started = false;
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;
    const blockKeys = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp" || event.code === "ArrowDown") event.preventDefault();
    };
    window.addEventListener("keydown", blockKeys);
    const fail = (reason: unknown) => {
      if (dead || started) return;
      const message = reason instanceof Error ? reason.message : "Falha ao abrir a aventura.";
      console.error("[pixel-quest] falha ao iniciar", reason);
      game?.destroy(true);
      game = null;
      showBootFailure(message);
    };
    if (!import.meta.env.SSR) {
      void import("@/game/createGame")
        .then(({ createGame }) => {
          if (dead || !host.current) return;
          try {
            game = createGame(host.current);
            started = true;
            document.getElementById("boot-fallback")?.setAttribute("hidden", "");
          } catch (err) {
            fail(err);
          }
        })
        .catch(fail);
    }
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      const base = import.meta.env.BASE_URL || "/";
      void navigator.serviceWorker.register(`${base}sw.js`).catch((err: unknown) => {
        console.error("[pixel-quest] service worker não registrou", err);
      });
    }
    return () => {
      dead = true;
      window.removeEventListener("keydown", blockKeys);
      game?.destroy(true);
    };
  }, []);

  return (
    <main className="game-shell">
      <p id="boot-label" className="boot-label">
        Carregando a aventura…
      </p>
      <div
        id="boot-fallback"
        className="boot-fallback"
        hidden
        dangerouslySetInnerHTML={{
          __html:
            '<p>Não foi possível abrir a aventura.</p><p id="boot-detail" class="boot-detail"></p><button type="button" onclick="location.reload()">TENTAR NOVAMENTE</button>',
        }}
      />
      <div ref={host} id="game-root" className="game-host" />
      <div className="rotate-hint">
        <span>Gire o celular para o lado</span>
      </div>
      <script dangerouslySetInnerHTML={{ __html: BOOT_WATCH }} />
    </main>
  );
}
