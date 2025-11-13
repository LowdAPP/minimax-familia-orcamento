import re

# Ler PDF
with open('/workspace/user_input_files/Movimentos.pdf', 'rb') as f:
    pdf_bytes = f.read()

# Converter para texto
text = pdf_bytes.decode('latin-1', errors='ignore')

print("=== ANÁLISE DO PDF ===")
print(f"Tamanho: {len(pdf_bytes)} bytes")
print(f"\n=== AMOSTRA DO TEXTO (primeiros 3000 chars) ===")
# Limpar caracteres de controle para melhor visualização
clean_text = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F]', ' ', text[:3000])
print(clean_text)

# Procurar por datas
dates = re.findall(r'\d{2}/\d{2}/\d{4}', text)
print(f"\n=== DATAS ENCONTRADAS: {len(dates)} ===")
if dates:
    print(dates[:15])

# Procurar por valores
values = re.findall(r'[\-\+]?\d{1,10}[,\.]\d{2}', text)
print(f"\n=== VALORES ENCONTRADOS: {len(values)} ===")
if values:
    print(values[:15])

# Procurar por linhas que parecem transações
print(f"\n=== PROCURANDO LINHAS COM DATA + TEXTO + VALOR ===")
lines = text.split('\n')
for i, line in enumerate(lines[:200]):
    if re.search(r'\d{2}/\d{2}/\d{4}', line) and re.search(r'[\-\+]?\d+[,\.]\d{2}', line):
        clean_line = re.sub(r'[\x00-\x1F]', ' ', line)
        print(f"Linha {i}: {clean_line[:200]}")
