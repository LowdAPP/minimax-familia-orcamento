from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

# Criar PDF
pdf_path = "/tmp/extrato_teste.pdf"
c = canvas.Canvas(pdf_path, pagesize=letter)
width, height = letter

# Título
c.setFont("Helvetica-Bold", 16)
c.drawString(1*inch, height - 1*inch, "BANCO EXEMPLO S.A.")
c.setFont("Helvetica-Bold", 14)
c.drawString(1*inch, height - 1.3*inch, "EXTRATO BANCÁRIO")

# Informações da conta
c.setFont("Helvetica", 10)
y_pos = height - 1.8*inch
c.drawString(1*inch, y_pos, "Agência: 1234  Conta: 56789-0")
y_pos -= 0.2*inch
c.drawString(1*inch, y_pos, "Período: 01/01/2025 a 31/01/2025")
y_pos -= 0.2*inch
c.drawString(1*inch, y_pos, "Cliente: João Silva - CPF: 123.456.789-00")

# Cabeçalho da tabela
y_pos -= 0.5*inch
c.setFont("Helvetica-Bold", 10)
c.drawString(1*inch, y_pos, "DATA")
c.drawString(2*inch, y_pos, "DESCRIÇÃO")
c.drawString(5*inch, y_pos, "VALOR")

# Linha separadora
y_pos -= 0.1*inch
c.line(1*inch, y_pos, 6.5*inch, y_pos)

# Transações
c.setFont("Helvetica", 9)
transactions = [
    ("05/01/2025", "Salário Empresa XYZ", "R$ 5.500,00"),
    ("06/01/2025", "Supermercado Zona Sul", "R$ -245,80"),
    ("07/01/2025", "Netflix Assinatura", "R$ -55,90"),
    ("08/01/2025", "Uber", "R$ -35,50"),
    ("10/01/2025", "Farmácia São Paulo", "R$ -89,90"),
    ("12/01/2025", "Restaurante Bella Italia", "R$ -125,00"),
    ("15/01/2025", "Posto de Gasolina BR", "R$ -280,00"),
    ("18/01/2025", "Aluguel Janeiro", "R$ -1.200,00"),
    ("20/01/2025", "Pagamento Cartão Crédito", "R$ -850,00"),
    ("25/01/2025", "Transferência PIX Recebida", "R$ 300,00"),
    ("28/01/2025", "Conta de Luz", "R$ -185,50"),
]

y_pos -= 0.2*inch
for date, desc, value in transactions:
    c.drawString(1*inch, y_pos, date)
    c.drawString(2*inch, y_pos, desc)
    c.drawString(5*inch, y_pos, value)
    y_pos -= 0.2*inch

# Resumo
y_pos -= 0.3*inch
c.line(1*inch, y_pos, 6.5*inch, y_pos)
y_pos -= 0.3*inch
c.setFont("Helvetica-Bold", 10)
c.drawString(1*inch, y_pos, "Saldo Anterior: R$ 2.500,00")
y_pos -= 0.2*inch
c.drawString(1*inch, y_pos, "Total Créditos: R$ 5.800,00")
y_pos -= 0.2*inch
c.drawString(1*inch, y_pos, "Total Débitos:  R$ 3.067,60")
y_pos -= 0.2*inch
c.drawString(1*inch, y_pos, "Saldo Atual:    R$ 5.232,40")

c.save()
print(f"PDF criado em: {pdf_path}")
