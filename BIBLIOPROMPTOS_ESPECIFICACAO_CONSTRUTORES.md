# BiblioPromptos — Especificação oficial de construtores individuais

**Identificador:** `BIBLIOPROMPTOS_ESPECIFICACAO_CONSTRUTORES`
**Versão do intercâmbio:** `bibliopromptos-constructor-v1` / `formatVersion: 1`
**Aplicativo de referência:** BiblioPromptosAPP v0.2.7
**Data:** 2026-11-06
**Objetivo:** permitir que pessoas e IAs criem arquivos de **um único construtor** sem substituir toda a Biblioteca.

> **Fonte da verdade:** este documento descreve o comportamento observado nas funções `promptFrom`, `isVisible`, `stepDone`, `question` e no Editor Universal de `app.js`. O invólucro de intercâmbio, os limites e a validação de segurança são definidos em `constructor_io.js`. Não pressupor recursos futuros.

## 1. Conceitos

- **Construtor:** ferramenta que exibe etapas e perguntas e produz texto com base nas respostas.
- **Prompt pronto:** texto único, salvo em outra coleção. **Não é** construtor.
- **Modelo:** estrutura reutilizável para iniciar novos construtores. Importar um construtor não o converte em modelo.
- **Bloco:** elemento de etapa: `choice`, `text`, `number` ou `fixed`.
- **Resposta:** valor armazenado na sessão, indexado pelo **ID do bloco**.
- **Miniatura:** imagem opcional associada ao construtor, salva localmente no IndexedDB e exportável em ZIP.

A importação individual **apenas adiciona** um construtor validado, sem alterar prompts, favoritos, modelos, configurações, respostas salvas, tema ou outros construtores. A importação de backup completo é um comando diferente e pode substituir dados.

## 2. Formatos de arquivo

### A. JSON individual — sem miniatura

Arquivo de extensão `.json`, codificado em **UTF-8**, contendo **um** objeto:

~~~json
{
  "format": "bibliopromptos-constructor-v1",
  "formatVersion": 1,
  "constructor": {
    "id": "c-exemplo",
    "title": "Meu construtor",
    "description": "Cria um prompt a partir de perguntas",
    "category": "Imagem",
    "steps": []
  },
  "thumbnail": null
}
~~~

O exemplo acima mostra o invólucro; ele **não é importável** porque o construtor precisa ter etapas e blocos. Use o exemplo completo da seção 9.

### B. ZIP individual — com ou sem miniatura

Estrutura:

~~~text
Meu_Construtor.zip
├── constructor.json
└── miniaturas/
    └── exemplo.webp     (opcional)
~~~

O conteúdo de `constructor.json` é o mesmo do JSON individual. Se houver uma imagem, o campo `thumbnail` deverá apontar para o arquivo, por exemplo:

~~~json
"thumbnail": {
  "path": "miniaturas/exemplo.webp",
  "mime": "image/webp"
}
~~~

Extensões aceitas: `.webp`, `.png`, `.jpg` e `.jpeg`. O MIME deve corresponder à extensão **e à assinatura binária real** da imagem. São aceitos ZIPs convencionais com método **Store (0)** e **DEFLATE (8)** nos navegadores que oferecem `DecompressionStream('deflate-raw')` (Safari moderno). Não usar ZIP criptografado, ZIP64, diretórios extras ou arquivos alheios. Se não houver imagem, `thumbnail` é `null` ou omitido e o ZIP contém apenas `constructor.json`.

Não usar os nomes `dados.json` nem a estrutura do backup completo; eles pertencem a outro formato.

## 3. Estrutura de um construtor

**Campos obrigatórios:**

| Campo | Tipo | Regra |
|---|---|---|
| `id` | string | Identificador estável, único no documento |
| `title` | string | Nome visível, não vazio |
| `steps` | array | Entre 1 e 100 etapas, em ordem de exibição |

**Campos opcionais:**

| Campo | Tipo | Regra |
|---|---|---|
| `description` | string | Até 1.000 caracteres |
| `category` | string | Categoria textual, por exemplo `Imagem`, `Texto`, `Pesquisa`, `Código`, `Geral` |

Não colocar `factory`, `thumbnailId`, `created`, `updated` ou configurações da Biblioteca dentro de `constructor`. O aplicativo gera metadados locais e IDs de miniatura depois de validar.

### Identificadores

- Use letras ASCII, números, hífen, sublinhado e ponto: `[A-Za-z0-9][A-Za-z0-9_.-]{0,79}`.
- Cada `id` de construtor, etapa, bloco e opção deve ser **único dentro do arquivo individual**.
- Uma alternativa de seleção tem seu próprio `id`. Na condição, `value` aponta para **esse ID**, não para o rótulo.
- Não usar o mesmo ID para dois blocos, inclusive em etapas diferentes.
- A importação verifica colisões do ID do construtor com a Biblioteca atual. Em conflito, oferece **Importar como cópia**, que gera novos IDs para o construtor, etapas, blocos e opções e corrige todas as referências condicionais.
- IDs em outros construtores podem se repetir porque as respostas são isoladas por utilização.

## 4. Etapas

Cada item de `steps` contém:

~~~json
{
  "id": "etapa-identidade",
  "title": "Identidade",
  "blocks": []
}
~~~

`id`, `title` e `blocks` são obrigatórios. Cada etapa requer de **1 a 100 blocos**. O importador aceita no máximo **800 blocos** por construtor e até **4.000 alternativas** no total.

A ordem de `steps` determina a ordem do formulário e da montagem do prompt. Na interface de uso, as etapas seguintes só são reveladas quando as perguntas visíveis (exceto blocos fixos) da etapa anterior estiverem respondidas. O prompt gerado pode aparecer progressivamente, antes do preenchimento completo.

## 5. Tipos de bloco

Todos os blocos exigem `id`, `type`, `title`. Podem ter `visibleIf` opcional.

### `choice` — múltipla escolha

~~~json
{
  "id": "tipo_imagem",
  "type": "choice",
  "title": "Qual estilo de imagem?",
  "options": [
    {"id": "fotografia", "label": "Fotografia", "text": "Preserve textura fotográfica realista."},
    {"id": "resina", "label": "Resina 3D", "text": "Renderize como resina brilhante."}
  ]
}
~~~

A resposta salva é o ID da opção. O campo `text` da opção é o trecho inserido no prompt ao escolhê-la. **O rótulo não entra automaticamente no prompt**. Se `text` for vazio, a seleção pode controlar condições sem adicionar texto.

### `text` — resposta livre

~~~json
{
  "id": "detalhe",
  "type": "text",
  "title": "Descreva sua ideia",
  "text": "Detalhes solicitados: {{value}}."
}
~~~

O conteúdo digitado substitui **todas** as ocorrências literais de `{{value}}` no texto do bloco. O campo `text` é opcional; se for vazio, a resposta não acrescentará trecho ao prompt. Não existe interpolação de outras variáveis ou referências cruzadas entre respostas.

### `number` — parâmetro numérico

~~~json
{
  "id": "angulo",
  "type": "number",
  "title": "Yaw (graus)",
  "text": "Yaw: {{value}} graus.",
  "hint": "Negativo = esquerda; positivo = direita",
  "default": "0"
}
~~~

O formulário usa um campo numérico. `hint` e `default` são opcionais. A string padrão aparece como **placeholder**, não é salva automaticamente como resposta. O formato legado interno `0.circle` aparece em alguns construtores de fábrica; o importador aceita o tipo e o converte para `number`. **Para novos arquivos, use exclusivamente `number`.**

### `fixed` — trecho sempre ativo quando visível

~~~json
{
  "id": "regra_fidelidade",
  "type": "fixed",
  "title": "Regra universal",
  "text": "Preserve a identidade e não invente características."
}
~~~

Insere `text` sem solicitar resposta, enquanto a condição (se existir) for verdadeira. O texto deve ser não vazio.

## 6. Condições e módulos opcionais

Um bloco pode ter:

~~~json
"visibleIf": {"id": "tipo_imagem", "value": "resina"}
~~~

Isso significa: exibir e montar o bloco **apenas se** a resposta à pergunta `tipo_imagem` for a opção de ID `resina`.

Restrições atuais:

1. O bloco de origem deve ser uma pergunta **`choice` anterior** (na ordem real das etapas e blocos).
2. `value` precisa apontar para um ID de alternativa existente nessa pergunta.
3. Só é possível **uma** condição `visibleIf` por bloco.
4. Não há operadores `AND`, `OR`, `NOT`, expressões JavaScript, comparações numéricas, templates condicionais dentro de strings ou condições de etapas inteiras.
5. Para construir módulos opcionais, use uma pergunta de escolha e coloque `visibleIf` nos blocos que pertencem a cada alternativa. Pode haver várias perguntas na mesma etapa.
6. Para instruções universais sempre ativas, omita `visibleIf` do bloco `fixed`.

O validador rejeita dependências inexistentes, voltadas para frente, autorreferentes, e valores sem alternativa correspondente, evitando módulos que nunca poderiam ser ativados.

## 7. Ordem de montagem do texto

O mecanismo real percorre `steps` e, em cada etapa, `blocks` **na ordem do array**:

1. Blocos com condição falsa são ignorados.
2. Blocos `fixed` com texto não vazio acrescentam o texto.
3. Se uma pergunta ainda não foi respondida, não acrescenta trecho.
4. Em `choice`, acrescenta somente o `text` da alternativa selecionada.
5. Em `text` e `number`, acrescenta o `text` do bloco com `{{value}}` substituído pela resposta.
6. Os trechos resultantes são unidos com **duas quebras de linha** (`\n\n`).

Os textos são exibidos como texto, não executados. **Não inclua HTML, scripts nem chaves de API** esperando que o aplicativo os interprete.

## 8. Limites e validação

| Item | Limite |
|---|---|
| JSON individual | 2 MiB |
| ZIP individual | 6 MiB |
| Imagem associada | 2 MiB |
| Etapas | 1–100 |
| Blocos por etapa | 1–100 |
| Blocos por construtor | 800 |
| Alternativas por bloco | 1–60 |
| Alternativas por construtor | 4.000 |
| Identificador | 1–80 caracteres, padrão descrito |
| Nome / título | 160 caracteres |
| Trecho de prompt | 20.000 caracteres por campo |
| Categoria | 100 caracteres |
| Descrição | 1.000 caracteres |

O importador rejeita campos desconhecidos, tipos incorretos, relações quebradas, IDs duplicados, formatos/versões desconhecidos, ZIP com caminhos inesperados e imagens cuja assinatura não corresponde ao MIME declarado. A validação ocorre **antes** de qualquer mudança nos dados locais. Há uma prévia com nome, descrição, número de etapas, perguntas, blocos e alternativas; só depois de confirmar é feita a inserção.

O arquivo importado nunca contém código executável, e a aplicação não usa `eval`.

## 9. Exemplo completo e importável

~~~json
{
  "format": "bibliopromptos-constructor-v1",
  "formatVersion": 1,
  "constructor": {
    "id": "fidelidade-visual-exemplo-001",
    "title": "Controle de Fidelidade Visual — Exemplo",
    "description": "Demonstra núcleo universal, modalidades e condição de refinamento.",
    "category": "Imagem",
    "steps": [
      {
        "id": "etapa-base",
        "title": "Base",
        "blocks": [
          {
            "id": "nucleo-universal",
            "type": "fixed",
            "title": "Preservação universal",
            "text": "Preserve a identidade, a composição e os elementos essenciais da referência."
          },
          {
            "id": "modalidade",
            "type": "choice",
            "title": "Tipo de resultado",
            "options": [
              {"id": "foto", "label": "Fotografia", "text": "Estilo fotográfico natural, sem aparência artificial."},
              {"id": "render", "label": "Resina 3D", "text": "Render de resina brilhante com geometria escultórica."}
            ]
          },
          {
            "id": "brilho-resina",
            "type": "choice",
            "title": "Intensidade de brilho",
            "visibleIf": {"id": "modalidade", "value": "render"},
            "options": [
              {"id": "brilho-suave", "label": "Suave", "text": "Reflexos moderados."},
              {"id": "brilho-intenso", "label": "Intenso", "text": "Reflexos especulares fortes e nítidos."}
            ]
          }
        ]
      },
      {
        "id": "etapa-enquadramento",
        "title": "Enquadramento",
        "blocks": [
          {
            "id": "angulo-yaw",
            "type": "number",
            "title": "Yaw",
            "text": "Rotação horizontal: {{value}} graus.",
            "hint": "Informe um valor positivo ou negativo",
            "default": "0"
          },
          {
            "id": "notas-livres",
            "type": "text",
            "title": "Observações adicionais",
            "text": "Observações: {{value}}."
          }
        ]
      }
    ]
  },
  "thumbnail": null
}
~~~

**Este é um exemplo ilustrativo**, não uma reprodução do construtor real “Controle de Fidelidade Visual (Modular)”, cujo arquivo não foi fornecido nesta etapa.

## 10. Para uma IA criar um construtor

1. Ler toda esta especificação e verificar a versão do formato.
2. Planejar etapas, perguntas, alternativas e trechos antes de gerar JSON.
3. Criar IDs estáveis e únicos. Para condições, usar IDs de perguntas/alternativas **anteriores**, não nomes visíveis.
4. Evitar perguntas sem texto associado quando não forem usadas para controlar condições.
5. Acrescentar instruções universais com `fixed` sem condição.
6. Não inventar recursos como lógica booleana composta, variáveis além de `{{value}}`, envio automático de imagens à IA, scripts executáveis, blocos aninhados ou integrações de API.
7. Produzir **um** `.json` com o invólucro oficial, ou `.zip` com `constructor.json` e miniatura opcional.
8. Validar sintaxe, unicidade, limites, relações condicionais, textos e nomes de arquivos.
9. Não gerar backups completos para importar apenas um construtor.
10. Nunca solicitar a exclusão de dados locais. No conflito de ID, usar a operação **Importar como cópia** oferecida pelo aplicativo.

## 11. Importação, edição, exportação e segurança

No aplicativo: **Construtores → Importar construtor**, ou **Ajustes → Importar construtor**. Selecione o JSON/ZIP, confira a prévia e confirme. O novo item aparece na Biblioteca como construtor normal e pode ser utilizado ou editado como cópia no Editor Universal.

- **Conflito:** o ID já existe; o aplicativo exige importação como cópia e renumera referências internas.
- **Reimportação:** o mesmo ID gera conflito; nunca substitui silenciosamente.
- **Miniatura:** imagem válida processada localmente para quadrado de até **512 × 512 px** (recorte central), com compressão WebP quando suportada e preservação do canal alfa; recebe novo identificador. Os backups completos continuam incluindo suas imagens.
- **Exportação individual:** use **••• → Exportar construtor**. Sai JSON sem imagem ou ZIP com imagem, sem dados de outros itens.
- **Backup completo:** continua separado em Ajustes. Sempre faça backup dos seus dados importantes.

## 12. Compatibilidade e mudanças futuras

O `format` e `formatVersion` identificam o contrato do intercâmbio. Um aplicativo que não compreenda uma nova versão deve rejeitá-la com erro claro; não deve reinterpretar silenciosamente os campos. Novos tipos de blocos e condições compostas exigirão uma nova especificação/versão e sua implementação no Editor e no gerador.

**Não há execução local de IA neste recurso:** a IA cria o arquivo fora do PWA. O PWA valida e importa o resultado.
