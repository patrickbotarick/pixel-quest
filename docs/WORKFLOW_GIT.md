# Workflow Git — loja e casa

Um único remoto: `https://github.com/patrickbotarick/pixel-quest.git`. Não copiar `.git` entre projetos diferentes, criar outro remoto ou unir históricos sem relação.

## Clonar

A pasta da loja já foi unificada. Os comandos abaixo são para um computador ou pasta nova; o destino não deve conter a exportação ou outro checkout.

Loja:

```powershell
git clone https://github.com/patrickbotarick/pixel-quest.git "C:\Projetos_VS_code\pixel quest game"
cd "C:\Projetos_VS_code\pixel quest game"
```

Casa:

```powershell
git clone https://github.com/patrickbotarick/pixel-quest.git "E:\Projetos_VS_Code\Pixel Quest Game"
cd "E:\Projetos_VS_Code\Pixel Quest Game"
```

Execute `INICIAR_PIXEL_QUEST.bat`. Caminhos de unidade aparecem somente nos exemplos; código e scripts são relativos.

## Começar e terminar uma sessão

Antes de editar, confira pendências e atualize com segurança:

```powershell
git status --short --branch
git diff
git switch main
git pull --ff-only origin main
git switch -c feat/nome-da-tarefa
```

Não troque de branch nem faça pull com alterações importantes sem primeiro salvá-las em commit ou stash. Para continuar a mesma tarefa em outro computador:

```powershell
git fetch origin
git switch feat/nome-da-tarefa
git pull --ff-only origin feat/nome-da-tarefa
```

Na primeira vez, `git switch --track origin/feat/nome-da-tarefa`. Evite trabalhar simultaneamente na mesma branch nos dois computadores; faça push antes de trocar de máquina e pull antes de retomar.

Confira os arquivos, rode os testes de `game/`, revise o diff e publique:

```powershell
git status --short
git diff
git add game assets docs README.md INICIAR_PIXEL_QUEST.bat
git diff --cached --stat
git diff --cached
git commit -m "feat: descreva a alteração"
git push -u origin feat/nome-da-tarefa
```

Escolha os paths realmente alterados; arquivos de configuração novos também devem ser adicionados explicitamente. Não adicione backups, segredos ou builds. Regras estão no `.gitignore`. Use `git check-ignore -v caminho` se um arquivo esperado não aparecer.

## Integração segura

Depois das verificações:

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
git merge --ff-only feat/nome-da-tarefa
git push origin main
```

Se o fast-forward falhar, pare e examine `git log --oneline --graph --decorate --all`; a main mudou ou o histórico divergiu. Integre e resolva conflitos na branch de trabalho, revise e repita os testes antes de publicar. Não use force push ou reset --hard.

## Recuperar sem perder dados

Salvar alterações temporárias, incluindo arquivos novos:

```powershell
git stash push -u -m "trabalho antes de atualizar"
git stash list
git stash show -p "stash@{0}"
git stash apply "stash@{0}"
```

Use `apply` para manter a cópia no stash até conferir. Arquivos ignorados não entram em `-u`: copie arquivos locais importantes para um backup separado. Para retirar algo do stage sem apagar o arquivo: `git restore --staged caminho`.

Localizar commits antigos: `git reflog`, depois `git branch recuperacao SHA_ENCONTRADO`. Para desfazer um commit já publicado preservando o histórico, use `git revert SHA` na branch de trabalho. Se houver conflito, preserve uma cópia, resolva os marcadores e confira `git status`; não sobrescreva a versão do outro computador sem revisão.

O backup da exportação Grok fica somente na máquina da loja em `.migration-backup/`; não é parte do clone. Mantenha-o até considerar a migração encerrada. A biblioteca, fontes e ferramentas necessárias para reprodução estão no remoto.
