# BiblioPromptos — Protótipo interativo v0.2.0

**Status:** protótipo para testar a interface, não MVP concluído.

Arquivos: `index.html` + `style.css` + `app.js` formam a versão web. O arquivo `BiblioPromptos_Interativo_v0.2.0.html` é a mesma interface em HTML único para o Sitecase.

## Decisões implementadas

- Home compacta sem cartão de introdução nem título redundante.
- Botão `+ Novo` em cápsula no cabeçalho; Ajuda mantida; Ajustes na barra inferior.
- Abas: Biblioteca, Construtores, Ajustes.
- Filtros horizontais de uma linha com margens laterais.
- Janela inferior sem X, sem setas e sem texto redundante; fecha tocando fora; encosta na base da tela.
- Ajustes → Design Tokens: editar valores e aplicar ao vivo, criar tokens, excluir tokens personalizados, desfazer/refazer, exportar/importar tema e restaurar valores.
- Editor Universal permanece com arrastar e soltar por pegador, desfazer/refazer e salvamento como cópia.

## Atenção

- Tokens essenciais não podem ser excluídos: excluí-los quebraria componentes existentes. Podem ser restaurados; tokens criados pelo usuário podem ser excluídos.
- Tokens adicionais só alteram componentes depois que o CSS os utiliza.
- Salva dados de demonstração no armazenamento local do navegador (localStorage), não em banco remoto. Exportar backups regularmente.
- A função de arraste foi confirmada no Sitecase na versão anterior; Safari e instalação como PWA ainda exigem validação direta pelo usuário.
- O arquivo HTML único não inclui Service Worker, portanto o funcionamento offline após publicação depende de cache; para testar offline com garantia, baixe o HTML único no Sitecase.

## Execução local

Abrir `index.html` em servidor estático, ou abrir o HTML único diretamente no Sitecase. Sem dependências externas.
