# Solicitação reutilizável — Criar construtor para o BiblioPromptos

Quero que você crie um **arquivo individual de construtor**, compatível com meu aplicativo **BiblioPromptos**, sem alterar ou substituir a Biblioteca.

Leia primeiro o arquivo `BIBLIOPROMPTOS_ESPECIFICACAO_CONSTRUTORES.md` anexo. Ele é a especificação oficial: siga rigorosamente os tipos, limites, IDs, condições, ordem de montagem e formato de arquivo descritos ali.

**Objetivo do construtor:** [DESCREVA AQUI O QUE QUER CRIAR]

**Preferências:** [ETAPAS, PERGUNTAS, ESTILOS, PARÂMETROS, EXEMPLOS, REGRAS DE FIDELIDADE, ETC.]

Requisitos para a entrega:
1. Desenvolva um construtor completo usando a versão `bibliopromptos-constructor-v1`, com etapas, perguntas, alternativas e trechos de prompt.
2. Separe blocos universais `fixed` de módulos condicionais `visibleIf`, respeitando a limitação de uma condição por bloco.
3. Garanta IDs únicos e referências `visibleIf` válidas para alternativas de perguntas anteriores.
4. Use `{{value}}` somente nos blocos de texto livre ou numéricos, conforme o documento.
5. Inclua exemplos de respostas e mostre como ficaria o prompt resultante em pelo menos dois cenários diferentes.
6. Faça validação estrutural e semântica. Explique limitações reais em vez de inventar suporte do aplicativo.
7. Entregue **um arquivo `.json`** para importação individual. Se eu enviar uma miniatura, entregue **um ZIP** com `constructor.json` e a imagem associada.
8. Não crie backups completos, não modifique outros construtores e não adicione scripts executáveis.

**Formato da sua resposta:** breve resumo do construtor, limitações relevantes, arquivos entregues e exemplos de saídas. O arquivo deve poder ser importado em **Construtores → Importar construtor**.
