# BiblioPromptosAPP — Protótipo interativo V0.2.1

## Abrir
- Site publicado: https://bibliopromptos.pages.dev/
- Código: https://github.com/viniciusnevesdev/bibliopromptos
- A versão com arquivos separados utiliza `index.html`, `style.css` e `app.js`, sem dependências externas.
- O arquivo `BiblioPromptosAPP_Interativo_v0.2.1.html` possui HTML, CSS e JS embutidos para testes locais/Sitecase. A disponibilidade de armazenamento persistente pode variar em visualizadores locais.

## Novidades
- Miniaturas opcionais de fotografia em **prompts** e **construtores**, com ícone de foto quando não há imagem.
- Escolha de imagem local, ajuste de enquadramento quadrado em X e Y, confirmação, substituição e remoção.
- Otimização exclusivamente no navegador: redimensionamento progressivo de alta qualidade para **até 512 × 512 pixels**, codificação **WebP qualidade 0,86** se suportada, com fallback para PNG. O arquivo original não é retido.
- `IndexedDB` guarda os arquivos de imagem, `localStorage` continua guardando prompts/construtores e referências. Os registros anteriores (chave `bp-demo-v4`) são preservados.
- Duplicar um prompt ou salvar uma cópia do construtor cria uma **referência e registro de imagem independentes**; apagar a imagem da cópia não afeta o original.
- Backup ZIP: `dados.json` + pasta `miniaturas/` com imagens realmente referenciadas. Exportação e importação com verificação CRC32 e validação. ZIP emitido em modo **Store** (sem compressão adicional, imagens já comprimidas), compatível com gerenciadores ZIP comuns. Importa backups ZIP gerados por esta versão; mantém importação de JSON anterior, sem imagens.
- Ajustes → Dados e segurança: exportação/importação. O backup ZIP contém os textos e fotografias privadas: guarde-o em local seguro.
- A edição estrutural e o mecanismo de arraste por Pointer Events foram preservados.

## Testes e limites
- Sintaxe JS validada (`node --check`).
- Fluxos de miniatura, redimensionamento, duplicação independente, remoção, ZIP e restauração: testados em Chromium headless com simulação de storage para executar o código do app isoladamente. Não substituir pelo teste real no Safari/IndexedDB do iPhone.
- Criação e leitura de ZIP testadas também pelo `zipfile` do Python, com CRC32 válido.
- Teste manual no Safari/iPhone da **V0.2.1** permanece pendente. A V0.2.0 já tinha reordenação por toque validada pelo usuário no Safari; o código da rotina de arraste não foi modificado.
- PWA instalado/offline: ainda não é implementação confirmada. Sem backend ou uploads de imagens pessoais.
- Acessibilidade de zoom: 512 pixels dão margem para densidade Retina e ampliação moderada; ampliações grandes não podem recuperar detalhe além da imagem armazenada.

## Estrutura
- `index.html`: estrutura e seletores de arquivos.
- `style.css`: interface e miniaturas.
- `app.js`: biblioteca, editor, arraste, IndexedDB, redimensionamento, ZIP e Design Tokens.
- `BiblioPromptosAPP_Interativo_v0.2.1.html`: versão independente em um único arquivo.

## Segurança e continuidade
- Faça **backup ZIP antes de limpar dados do navegador** ou trocar de telefone.
- A importação substitui os dados locais, com confirmação. Não é sincronização automática.
- Não envie o backup com imagens privadas a repositórios públicos.
