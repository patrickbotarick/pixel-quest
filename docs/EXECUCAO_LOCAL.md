# Execução local e celular

## Windows

Node.js >=22.12, npm e Git para sincronização. Abra o iniciador na raiz. Ele usa `%~dp0`, entra em `game/`, verifica Node/npm e instala pelo `package-lock.json` se a instalação estiver ausente ou o lockfile mudar. Falhas mantêm o terminal aberto. O marcador de instalação fica em `node_modules/` e não é versionado.

Endereço do computador: http://localhost:8080/. O servidor usa `0.0.0.0:8080`; não altere esse endereço para um IP específico da loja. O mesmo clone funciona em outra unidade e em uma pasta com espaços.

Comandos manuais em `game/`: `npm ci --ignore-scripts`, `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run check:assets`, `npm run build`. Não houve atualização de bibliotecas: as versões resolvidas do lockfile foram mantidas. Os binários necessários são fornecidos pelos pacotes; a instalação sem scripts foi validada nesta máquina.

## Wi-Fi / rede local

1. Conecte celular e computador à mesma rede confiável.
2. O iniciador mostra os IPv4 disponíveis. Escolha o da interface Wi-Fi/Ethernet que atende essa rede; adaptadores VPN/virtuais podem não servir.
3. Para consultar novamente, rode `ipconfig` ou, dentro de `game/`, `node scripts/local-addresses.mjs`.
4. Abra `http://IP_DO_COMPUTADOR:8080/` no celular. O jogo existente recomenda a orientação horizontal.

Se não conectar, verifique a política da empresa, o isolamento de clientes Wi-Fi e o firewall. Não desative o firewall nem faça encaminhamento de portas, túneis públicos ou exposição do Vite à internet. Qualquer regra de entrada deve ser restrita à rede privada e autorizada pela administração local. Nesta migração nenhuma regra do firewall foi alterada. O acesso em um aparelho físico não foi realizado.

O servidor de desenvolvimento não tem autenticação: execute apenas durante o desenvolvimento, em rede confiável. Ctrl+C encerra.

## Produção local e PWA

Após `npm run build`, execute `npm run preview:restart`. Ele serve o build atual em http://127.0.0.1:8081/ e só encerra um preview gerenciado desta pasta. Se outro processo ocupar a porta, informa o conflito sem matá-lo. Encerre com `npm run preview:stop`. O supervisor Linux exportado permanece em `scripts/preview.mjs`, mas não é o comando padrão no Windows.

Para conferir desktop/celular: `npm run smoke`. Para o build: `npm run smoke -- http://127.0.0.1:8081/ screenshots/built.png --baseline screenshots/dev.json`. Instale Chrome no Windows; em Linux use `npx playwright install chromium`. Screenshots e JSON de QA são locais e ignorados pelo Git.

O service worker existente registra apenas em produção, em contexto seguro: localhost ou HTTPS. Um IP de LAN por HTTP geralmente não permite service worker; isso não impede o teste do jogo no dev. Offline cobre recursos já visitados e armazenados, não garante que todas as fases estejam disponíveis após visitar só o menu. Uma futura hospedagem requer HTTPS e revisão do cache na publicação.

## Saves existentes

Chaves preservadas: `pixel-quest-save-v1` e `pixel-quest-save-backup`. Não há conta nem backend de save. O localStorage depende do navegador e da origem (protocolo, host, porta). O progresso do endereço Grok não vem nos arquivos exportados e não migra automaticamente para localhost, celular ou outra máquina. Nenhum armazenamento do navegador original foi apagado. Não use limpeza de dados/reset como parte da migração.

## Asset Factory

Use `assets/README.md` e execute suas ferramentas a partir de `assets/`. Python >=3.10 e Pillow; não precisa de Python para jogar. O viewer em `assets/09_previews/index.html` usa caminhos relativos e mantém o funcionamento depois da mudança de pasta.
