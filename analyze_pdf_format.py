#!/usr/bin/env python3
"""
Script para analisar o formato do PDF e extrair amostras de texto
para ajudar a criar padrões regex corretos
"""

import sys
import re

try:
    import PyPDF2
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False
    print("⚠️  PyPDF2 não instalado. Tentando instalar...")
    import subprocess
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2", "-q"])
        import PyPDF2
        HAS_PYPDF2 = True
        print("✅ PyPDF2 instalado com sucesso")
    except:
        print("❌ Não foi possível instalar PyPDF2")
        sys.exit(1)

def extract_text_from_pdf(pdf_path):
    """Extrai texto do PDF"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            
            print(f"📄 PDF tem {num_pages} página(s)\n")
            
            full_text = ""
            for page_num, page in enumerate(pdf_reader.pages, 1):
                text = page.extract_text()
                full_text += text + "\n"
                print(f"--- Página {page_num} ({len(text)} caracteres) ---")
                print(text[:500])  # Primeiros 500 caracteres
                print("\n" + "="*80 + "\n")
            
            return full_text
    except Exception as e:
        print(f"❌ Erro ao ler PDF: {e}")
        return None

def analyze_transaction_patterns(text):
    """Analisa padrões de transações no texto"""
    print("\n" + "="*80)
    print("🔍 ANÁLISE DE PADRÕES DE TRANSAÇÕES")
    print("="*80 + "\n")
    
    # Procurar por linhas que parecem transações
    lines = text.split('\n')
    
    # Padrões comuns de datas
    date_patterns = [
        r'\d{2}[/-]\d{2}[/-]\d{4}',  # DD/MM/YYYY ou DD-MM-YYYY
        r'\d{2}[/-]\d{2}[/-]\d{2}',   # DD/MM/YY
        r'\d{4}[/-]\d{2}[/-]\d{2}',   # YYYY/MM/DD
    ]
    
    # Padrões comuns de valores monetários
    amount_patterns = [
        r'[\d.,]+\s*[€$£]',  # Valores com símbolo
        r'[\d.,]+\s*EUR',     # Valores com EUR
        r'[\d.,]+\s*R\$',     # Valores com R$
    ]
    
    print("📅 DATAS ENCONTRADAS:")
    for pattern in date_patterns:
        matches = re.findall(pattern, text)
        if matches:
            print(f"  Padrão {pattern}: {len(matches)} ocorrências")
            print(f"  Exemplos: {matches[:5]}")
    
    print("\n💰 VALORES ENCONTRADOS:")
    for pattern in amount_patterns:
        matches = re.findall(pattern, text)
        if matches:
            print(f"  Padrão {pattern}: {len(matches)} ocorrências")
            print(f"  Exemplos: {matches[:5]}")
    
    # Procurar linhas que parecem transações (contêm data e valor)
    print("\n📋 LINHAS QUE PARECEM TRANSAÇÕES:")
    transaction_like_lines = []
    for i, line in enumerate(lines):
        has_date = any(re.search(dp, line) for dp in date_patterns)
        has_amount = any(re.search(ap, line) for ap in amount_patterns)
        
        if has_date and has_amount and len(line.strip()) > 10:
            transaction_like_lines.append((i+1, line.strip()))
    
    if transaction_like_lines:
        print(f"  Encontradas {len(transaction_like_lines)} linhas potenciais")
        print("\n  Primeiras 10 linhas:")
        for line_num, line in transaction_like_lines[:10]:
            print(f"    Linha {line_num}: {line[:100]}")
    else:
        print("  Nenhuma linha com padrão de transação encontrada")
    
    return transaction_like_lines

if __name__ == "__main__":
    pdf_path = "docs/Extrato empresa outubro.pdf"
    
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    
    print("="*80)
    print("📊 ANÁLISE DE PDF - EXTRATO BANCÁRIO")
    print("="*80 + "\n")
    print(f"Arquivo: {pdf_path}\n")
    
    text = extract_text_from_pdf(pdf_path)
    
    if text:
        print(f"\n✅ Texto extraído: {len(text)} caracteres totais")
        print(f"   Linhas: {len(text.split(chr(10)))}")
        
        # Salvar texto completo em arquivo para análise
        output_file = "pdf_extracted_text.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"\n💾 Texto completo salvo em: {output_file}")
        
        # Analisar padrões
        analyze_transaction_patterns(text)
        
        print("\n" + "="*80)
        print("✅ Análise concluída!")
        print("="*80)
    else:
        print("❌ Não foi possível extrair texto do PDF")
        sys.exit(1)

