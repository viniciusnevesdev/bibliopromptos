# BiblioPromptosAPP — Protótipo V0.2.2

## Abrir
- Publicação: https://bibliopromptos.pages.dev/
- Código-fonte: https://github.com/viniciusnevesdev/bibliopromptos
- `index.html`, `style.css`, `app.js`: versão em arquivos separados.
- `BiblioPromptosAPP_Interativo_v0.2.3.html`: arquivo único HTML + CSS + JavaScript para Sitecase.

## Ajustes desta versão (04/11/2026)
- Cabeçalho com altura visual padrão de 50px (antes aproximadamente 67px; redução ~25%), através do token existente `--header-min-height` em **Ajustes → Design Tokens**. Área segura do iPhone mantida separadamente.
- Todos os controles do cabeçalho alinhados verticalmente ao centro, com áreas de toque confortáveis.
- Retirada a segunda miniatura ao lado do título nas páginas de prompt pronto e uso do construtor. Miniatura aparece no cartão dedicado.
- Título do cartão alterado para **Miniatura de exemplo de resultado**, centralizado. Removido o aviso “Imagem opcional · salva localmente” e o prefixo “Dica:”. Mantida a orientação discreta restante, adequada a prompts e construtores.
- Miniaturas em listas: 42px → 55px; miniaturas no cartão: 70px → 91px (aproximadamente +30%). Tamanhos regulados pelos tokens `--thumb-list-size` e `--thumb-detail-size`.
- Imagens com transparência detectadas pelos pixels alfa da miniatura otimizada; borda e fundo do contêiner são ocultados apenas quando há transparência. Alpha preservado na renderização, WebP/PNG e no backup ZIP.
- “Configurações de respostas” virou **Construa seu prompt**, título com peso maior e centralização; o botão “Salvas” continua acessível, com adaptação a telas estreitas.
- Lógica de `Pointer Events` de arrastar/reordenar e armazenamento/duplicação/exportação de miniaturas preservados.

## Testes e limites
- Verificar sintaxe JS e fluxo de personalização visual em Chromium e no Safari real.
- Testar transparência a partir de um PNG transparente e um JPEG opaco; confirmar exportação/restauração ZIP após atualização.
- **Atenção:** o site ainda é um protótipo. Safari/iPhone desta versão e PWA instalado precisam de validação manual. Não é garantia de funcionamento offline.
- Fotos pessoais não são enviadas ao servidor. IndexedDB guarda as miniaturas; faça backup ZIP antes de trocar de aparelho ou limpar dados do navegador.
