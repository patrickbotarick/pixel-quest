export const HOW_TO_PAGES = [
  { icon: "icon_sword", title: "COMO ATACAR", text: "Toque no monstro.\nResolva o desafio\npara o Samuca atacar!" },
  { icon: "icon_star", title: "MATEMÁTICA", text: "Olhe a conta.\nToque na resposta certa\nou use as teclas 1, 2 e 3." },
  { icon: "icon_shield", title: "MEMÓRIA", text: "Olhe as cartas por 3 segundos.\nDepois, encontre os pares\ncom o mesmo desenho." },
  { icon: "icon_star", title: "REFLEXO", text: "Espere o alvo na faixa verde.\nToque no painel\nou aperte Espaço!" },
  { icon: "icon_heart", title: "ACERTO E ERRO", text: "Acertou? O golpe é forte!\nQuase? O golpe é mais fraco.\nSe o tempo acabar, tente de novo." },
  { icon: "crystal", title: "VAMOS VENCER!", text: "Vença os monstros com o Samuca.\nRecupere os cristais\nda imaginação!" },
] as const;

const CELEBRATIONS = [
  "Muito bem! Você ajudou o Samuca!",
  "Samuca venceu mais um desafio!",
  "Que aventura incrível!",
  "Samuca está cada vez mais perto dos cristais!",
];

export function victoryMessage(stageId: number): string {
  if (stageId === 5) return "Samuca recuperou o primeiro cristal!";
  if (stageId === 10) return "Samuca salvou os cristais da imaginação!";
  return CELEBRATIONS[(stageId - 1) % CELEBRATIONS.length] ?? CELEBRATIONS[0]!;
}
