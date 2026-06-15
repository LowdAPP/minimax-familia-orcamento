// Página de Contas Fixas — definição + estado pago/por pagar do mês corrente
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase, FixedBill, FixedBillPayment } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Edit, Trash2, Save, X, CheckCircle, Circle, Sparkles } from 'lucide-react';

const RECOMMENDED = [
  { name: 'Renda', amount: 700, due_day: 5 },
  { name: 'Água + Luz + Gás', amount: 125, due_day: 12 },
  { name: 'Internet + Telemóveis', amount: 50, due_day: 15 },
];

function currentMonthYear(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function FixedBillsPage() {
  const { user } = useAuth();
  const { formatCurrency } = useI18n();
  const monthYear = currentMonthYear();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bills, setBills] = useState<FixedBill[]>([]);
  const [payments, setPayments] = useState<FixedBillPayment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FixedBill | null>(null);
  const [form, setForm] = useState({ name: '', amount: 0, due_day: 1 });

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: billsData } = await supabase
        .from('fixed_bills')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('due_day');
      const { data: payData } = await supabase
        .from('fixed_bill_payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', monthYear);
      setBills(billsData || []);
      setPayments(payData || []);
    } finally {
      setLoading(false);
    }
  };

  const paymentFor = (billId: string) =>
    payments.find((p) => p.fixed_bill_id === billId);

  const openAdd = () => {
    setForm({ name: '', amount: 0, due_day: 1 });
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (bill: FixedBill) => {
    setForm({ name: bill.name, amount: bill.amount, due_day: bill.due_day });
    setEditing(bill);
    setShowModal(true);
  };

  const save = async () => {
    if (!user || !form.name.trim()) {
      alert('Preencha o nome da conta');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        amount: form.amount || 0,
        due_day: form.due_day || 1,
        user_id: user.id,
        is_active: true,
      };
      if (editing) {
        const { error } = await supabase.from('fixed_bills').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fixed_bills').insert(payload);
        if (error) throw error;
      }
      await load();
      setShowModal(false);
      setEditing(null);
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (bill: FixedBill) => {
    if (!confirm(`Apagar a conta fixa "${bill.name}"?`)) return;
    const { error } = await supabase
      .from('fixed_bills')
      .update({ is_active: false })
      .eq('id', bill.id);
    if (error) {
      alert(error.message || 'Erro ao apagar');
      return;
    }
    await load();
  };

  const togglePaid = async (bill: FixedBill) => {
    if (!user) return;
    const existing = paymentFor(bill.id);
    const nextPaid = !(existing?.is_paid);
    const payload = {
      fixed_bill_id: bill.id,
      user_id: user.id,
      month_year: monthYear,
      is_paid: nextPaid,
      paid_date: nextPaid ? new Date().toISOString().slice(0, 10) : null,
      amount_paid: nextPaid ? bill.amount : null,
    };
    const { error } = await supabase
      .from('fixed_bill_payments')
      .upsert(payload, { onConflict: 'fixed_bill_id,month_year' });
    if (error) {
      alert(error.message || 'Erro ao atualizar pagamento');
      return;
    }
    await load();
  };

  const seedRecommended = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const rows = RECOMMENDED.map((r) => ({ ...r, user_id: user.id, is_active: true }));
      const { error } = await supabase.from('fixed_bills').insert(rows);
      if (error) {
        alert(error.message || 'Erro ao criar contas recomendadas');
        return;
      }
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Contas Fixas</h1>
          <p className="text-body text-neutral-600 mt-xs">
            Marque cada conta conforme paga. O que falta pagar é o seu "comprometido".
          </p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Nova Conta Fixa
        </Button>
      </div>

      {bills.length === 0 ? (
        <Card>
          <div className="text-center py-lg space-y-md">
            <p className="text-body text-neutral-600">
              Ainda não tem contas fixas. Quer começar pelas recomendadas?
            </p>
            <Button variant="primary" onClick={seedRecommended} loading={saving}>
              <Sparkles className="w-4 h-4" />
              Adicionar contas recomendadas
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-md items-center text-small font-semibold text-neutral-500 pb-sm border-b border-neutral-200">
            <span>Conta</span>
            <span>Venc.</span>
            <span>Planeado</span>
            <span>Pago?</span>
            <span></span>
          </div>
          {bills.map((bill) => {
            const pay = paymentFor(bill.id);
            const paid = !!pay?.is_paid;
            return (
              <div
                key={bill.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-md items-center py-sm border-b border-neutral-100"
              >
                <span className="text-body font-medium text-neutral-900">{bill.name}</span>
                <span className="text-small text-neutral-600">dia {bill.due_day}</span>
                <span className="text-body text-neutral-900">{formatCurrency(bill.amount)}</span>
                <button
                  onClick={() => togglePaid(bill)}
                  className="flex items-center gap-xs"
                  title={paid ? 'Pago' : 'Por pagar'}
                >
                  {paid ? (
                    <CheckCircle className="w-6 h-6 text-success-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-neutral-300" />
                  )}
                </button>
                <div className="flex gap-xs">
                  <button onClick={() => openEdit(bill)} className="p-xs text-neutral-600 hover:text-primary-500">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(bill)} className="p-xs text-neutral-600 hover:text-error-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50">
          <Card className="max-w-md w-full">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="text-h4 font-bold text-neutral-900">
                {editing ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-xs text-neutral-600 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-md">
              <Input
                label="Nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Renda"
                required
              />
              <Input
                type="number"
                label="Valor planeado"
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
              <Input
                type="number"
                label="Dia de vencimento (1-31)"
                value={form.due_day || ''}
                onChange={(e) => setForm({ ...form, due_day: parseInt(e.target.value) || 1 })}
                min="1"
                max="31"
              />
            </div>
            <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
              <Button variant="ghost" onClick={() => setShowModal(false)} fullWidth>
                Cancelar
              </Button>
              <Button variant="primary" onClick={save} loading={saving} fullWidth>
                <Save className="w-4 h-4" />
                {editing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
