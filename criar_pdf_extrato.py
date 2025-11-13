from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

# Criar PDF de extrato bancário
pdf_path = "/workspace/extrato_teste.pdf"
c = canvas.Canvas(pdf_path, pagesize=letter)

# Título
c.setFont("Helvetica-Bold", 14)
c.drawString(50, 750, "BANCO DO BRASIL - EXTRATO DE CONTA CORRENTE")

c.setFont("Helvetica", 10)
c.drawString(50, 730, "AGÊNCIA: 1234-5  CONTA: 98765-4")
c.drawString(50, 715, "PERÍODO: 01/10/2025 a 31/10/2025")
c.drawString(50, 700, "CLIENTE: TESTE DA SILVA")

# Cabeçalho da tabela
c.setFont("Helvetica-Bold", 10)
c.drawString(50, 670, "DATA")
c.drawString(130, 670, "DESCRIÇÃO")
c.drawString(450, 670, "VALOR")

# Linha
c.line(50, 665, 550, 665)

# Transações
c.setFont("Helvetica", 9)
transactions = [
    ("05/10/2025", "PIX RECEBIDO JOAO SILVA LTDA", "R$ 3.500,00"),
    ("08/10/2025", "PAGAMENTO CONTA LUZ CEMIG", "R$ -180,50"),
    ("12/10/2025", "COMPRA SUPERMERCADO EXTRA", "R$ -425,80"),
    ("15/10/2025", "PIX ENVIADO MARIA SANTOS", "R$ -150,00"),
    ("18/10/2025", "SALARIO EMPRESA XYZ LTDA", "R$ 5.200,00"),
    ("22/10/2025", "PAGAMENTO FATURA CARTAO CREDITO", "R$ -890,35"),
    ("25/10/2025", "COMPRA FARMACIA DROGASIL", "R$ -67,90"),
    ("28/10/2025", "PIX RECEBIDO FREELANCE PROJETO", "R$ 1.200,00"),
]

y = 650
for date, desc, value in transactions:
    c.drawString(50, y, date)
    c.drawString(130, y, desc)
    c.drawString(450, y, value)
    y -= 20

# Resumo
c.line(50, y-10, 550, y-10)
y -= 30
c.setFont("Helvetica-Bold", 10)
c.drawString(50, y, "SALDO ANTERIOR:")
c.drawString(450, y, "R$ 2.450,00")
y -= 20
c.drawString(50, y, "TOTAL CRÉDITOS:")
c.drawString(450, y, "R$ 9.900,00")
y -= 20
c.drawString(50, y, "TOTAL DÉBITOS:")
c.drawString(450, y, "R$ 1.714,55")
y -= 20
c.drawString(50, y, "SALDO ATUAL:")
c.drawString(450, y, "R$ 10.635,45")

c.save()
print(f"PDF criado com sucesso: {pdf_path}")
