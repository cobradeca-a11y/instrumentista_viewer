# Como rodar o projeto no Windows

## O problema
O erro `'vite' não é reconhecido como um comando interno` acontece porque o Windows CMD
não adiciona automaticamente a pasta `node_modules/.bin` ao PATH — diferente do Linux/Mac.

## Solução 1 — Script automático (recomendado)
Dê dois cliques no arquivo **`iniciar.bat`** na raiz do projeto.  
Ele instala as dependências (se necessário) e inicia o servidor.

## Solução 2 — Linha de comando manual
```cmd
cd C:\HomeCloud\shared\Projetos\instrumentista_viewer
npm install
npx vite
```
Use `npx vite` em vez de `npm run dev`.

## Solução 3 — Usar PowerShell em vez do CMD
No PowerShell, `npm run dev` funciona normalmente:
```powershell
cd C:\HomeCloud\shared\Projetos\instrumentista_viewer
npm install
npm run dev
```

## Acessar o app
Após iniciar, abra o navegador em: **http://localhost:5173**
