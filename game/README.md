# Pixel Quest: Aventura dos Desafios

Jogo infantil de aventura em turnos, em pixel art 16-bit. Dez fases, dois chefes e desafios de matemática, memória e reflexo.

## Como jogar

Abra o jogo, toque em **JOGAR** e responda o desafio para atacar. Teclas `1`, `2` e `3` escolhem a conta. `Espaço` acerta o alvo do reflexo. `Esc` pausa.

O progresso fica neste navegador (fase liberada, estrelas, tutoriais e som). Não há conta, anúncio nem compra.

## Desenvolvimento

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

## Publicação

O build usa o preset da plataforma (Vercel). Publique pelo botão **Publicar**. O service worker entra só na versão de produção e guarda os arquivos depois da primeira visita, para abrir de novo sem rede.

Arte, animações e música são originais e geradas no próprio jogo. As fontes Nunito e Press Start 2P usam a licença OFL. Phaser usa a licença MIT.
