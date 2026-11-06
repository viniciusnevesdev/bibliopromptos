#!/usr/bin/env python3
"""Gera exemplos/fixtures temporárias para validação do formato individual."""
from pathlib import Path
import json,re,zipfile,struct,zlib
root=Path(__file__).resolve().parents[1]
spec=(root/'BIBLIOPROMPTOS_ESPECIFICACAO_CONSTRUTORES.md').read_text()
part=spec.split('## 9. Exemplo completo e importável',1)[1]
example=json.loads(re.search(r'~~~json\s*([\s\S]*?)\s*~~~',part).group(1))
(root/'exemplos').mkdir(exist_ok=True)
(root/'exemplos'/'Exemplo_Construtor_Fidelidade_Visual.json').write_text(json.dumps(example,indent=2,ensure_ascii=False)+'\n')
tmp=root/'tests'/'.fixtures'
tmp.mkdir(exist_ok=True)
(tmp/'simple.json').write_text(json.dumps(example,ensure_ascii=False))
# PNG RGBA válido gerado apenas com a biblioteca-padrão do Python.
w=h=64
rows=[]
for y in range(h):
 row=bytearray([0])
 for x in range(w):row.extend((95,66,210,255) if 20<=x<44 and 20<=y<44 else (0,0,0,0))
 rows.append(bytes(row))
def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
png=b"\x89PNG\r\n\x1a\n"+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b'')
with_image=json.loads(json.dumps(example))
with_image['thumbnail']={'path':'miniaturas/exemplo.png','mime':'image/png'}
with_image['constructor']['id']='fidelidade-com-miniatura'
for name,compression in [('stored.zip',zipfile.ZIP_STORED),('deflated.zip',zipfile.ZIP_DEFLATED)]:
 with zipfile.ZipFile(tmp/name,'w',compression=compression) as z:
  z.writestr('constructor.json',json.dumps(with_image,ensure_ascii=False))
  z.writestr('miniaturas/exemplo.png',png)
with zipfile.ZipFile(tmp/'extra.zip','w',compression=zipfile.ZIP_STORED) as z:
 z.writestr('constructor.json',json.dumps(example))
 z.writestr('../../intruso.txt','não deve ser permitido')
(tmp/'transparent.png').write_bytes(png)
print('Exemplo oficial + ZIPs Store/DEFLATE com PNG alfa + casos inválidos preparados.')
