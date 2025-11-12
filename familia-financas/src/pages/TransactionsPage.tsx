// Página de Transações - Gestão e Upload de PDFs
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Upload,
  Download,
  Filter,
  Search,
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  merchant?: string;
  amount: number;
  transaction_type: 'receita' | 'despesa' | 'transferencia';
  transaction_date: string;
  category_name?: string;
  category_color?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  source: 'manual' | 'pdf_import' | 'api';
}

interface Account {
  id: string;
  nickname: string;
  institution: string;
  current_balance: number;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const { t, formatCurrency, language } = useI18n();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // Modal de nova transação
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: 0,
    transaction_type: 'despesa' as 'receita' | 'despesa',
    transaction_date: new Date().toISOString().split('T')[0],
    account_id: ''
  });

  // Modal de confirmação de exclusão
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterMonth, filterType]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadTransactions(), loadAccounts()]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    // Calcular primeiro e último dia do mês corretamente
    const [year, month] = filterMonth.split('-');
    const firstDay = `${filterMonth}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${filterMonth}-${String(lastDay).padStart(2, '0')}`;

    let query = supabase
      .from('transactions')
      .select(`
        id,
        description,
        merchant,
        amount,
        transaction_type,
        transaction_date,
        status,
        source,
        category_id
      `)
      .eq('user_id', user.id)
      .gte('transaction_date', firstDay)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });

    if (filterType !== 'all') {
      query = query.eq('transaction_type', filterType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao carregar transações:', error);
      return;
    }

    setTransactions(
      data?.map((t: any) => ({
        id: t.id,
        description: t.description,
        merchant: t.merchant,
        amount: t.amount,
        transaction_type: t.transaction_type,
        transaction_date: t.transaction_date,
        category_name: undefined,
        category_color: undefined,
        status: t.status,
        source: t.source
      })) || []
    );
  };

  const loadAccounts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('accounts')
      .select('id, nickname, institution, current_balance')
      .eq('user_id', user.id)
      .eq('is_active', true);

    setAccounts(data || []);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF válido');
      return;
    }

    setUploading(true);
    setUploadProgress('Fazendo upload do arquivo...');

    try {
      // 0. Garantir que existe pelo menos uma conta ativa
      let accountId = accounts[0]?.id;
      
      if (!accountId) {
        setUploadProgress('Criando conta padrão...');
        
        // Criar conta padrão se não existir
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            nickname: 'Conta Principal',
            institution: 'Conta Padrão',
            account_type: 'conta_corrente',
            current_balance: 0,
            is_active: true
          })
          .select()
          .single();

        if (accountError) throw new Error(`Erro ao criar conta: ${accountError.message}`);
        
        accountId = newAccount.id;
        setAccounts([newAccount]);
      }

      setUploadProgress('Processando PDF e extraindo transações...');

      // 1. Enviar PDF diretamente para o edge function via FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.id);
      formData.append('account_id', accountId);

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada');

      // Fazer request direto para o edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL environment variable');
      
      const response = await fetch(`${supabaseUrl}/functions/v1/pdf-parser`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      });

      // Tentar parsear resposta mesmo se não for 200 OK
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        throw new Error('Erro ao processar resposta do servidor. Tente novamente.');
      }

      console.log('Resultado do parse:', result);

      // 2. Verificar resultado e mostrar mensagens específicas
      if (!result.success) {
        const errorCode = result.errorCode || 'UNKNOWN';
        const errorMessage = result.error || 'Erro ao processar PDF';
        const suggestion = result.suggestion || '';
        
        // Mensagens de erro contextualizadas
        let userMessage = errorMessage;
        if (suggestion) {
          userMessage += `\n\n💡 ${suggestion}`;
        }
        
        // Adicionar informação sobre formato detectado se disponível
        if (result.bankFormat && result.bankFormat !== 'Desconhecido') {
          userMessage += `\n\n📋 Formato detectado: ${result.bankFormat}`;
        }
        
        alert(userMessage);
        setUploadProgress('');
        setUploading(false);
        return;
      }

      const transactionCount = result.transactionsInserted || 0;
      const bankFormat = result.bankFormat || '';
      
      if (transactionCount === 0) {
        let message = 'Nenhuma transação foi encontrada no PDF.';
        if (bankFormat && bankFormat !== 'Desconhecido') {
          message += `\n\nFormato detectado: ${bankFormat}`;
        }
        message += '\n\n💡 Verifique se o arquivo contém transações visíveis (não imagens escaneadas).';
        
        alert(message);
        setUploadProgress('');
        setUploading(false);
        return;
      }

      // Mostrar mensagem de sucesso com detalhes
      let successMessage = `✅ ${transactionCount} transações importadas com sucesso!`;
      if (bankFormat && bankFormat !== 'Desconhecido') {
        successMessage += ` (${bankFormat})`;
      }
      setUploadProgress(successMessage);
      
      // 3. Recarregar transações
      setTimeout(() => {
        loadTransactions();
        setUploadProgress('');
        setUploading(false);
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao processar PDF:', error);
      alert(`Erro ao processar PDF: ${error.message}`);
      setUploadProgress('');
      setUploading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!user || !newTransaction.description || newTransaction.amount === 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Garantir que existe account_id válido
      let accountId = newTransaction.account_id || accounts[0]?.id;
      
      if (!accountId) {
        // Criar conta padrão se não existir
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            nickname: 'Conta Principal',
            institution: 'Conta Padrão',
            account_type: 'conta_corrente',
            current_balance: 0,
            is_active: true
          })
          .select()
          .single();

        if (accountError) throw new Error(`Erro ao criar conta: ${accountError.message}`);
        
        accountId = newAccount.id;
        setAccounts([newAccount]);
      }

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: accountId, // Agora garantido que não é null
        description: newTransaction.description,
        amount: newTransaction.transaction_type === 'despesa' 
          ? -Math.abs(newTransaction.amount) 
          : Math.abs(newTransaction.amount),
        transaction_type: newTransaction.transaction_type,
        transaction_date: newTransaction.transaction_date,
        status: 'confirmed',
        source: 'manual'
      });

      if (error) throw error;

      setShowAddModal(false);
      setNewTransaction({
        description: '',
        amount: 0,
        transaction_type: 'despesa',
        transaction_date: new Date().toISOString().split('T')[0],
        account_id: ''
      });
      loadTransactions();
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      alert('Erro ao adicionar transação');
    }
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete || !user) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setTransactionToDelete(null);
      loadTransactions();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      alert('Erro ao excluir transação. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setTransactionToDelete(null);
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];
    const rows = filteredTransactions.map(t => [
      new Date(t.transaction_date).toLocaleDateString('pt-BR'),
      t.description,
      t.category_name || '-',
      t.transaction_type,
      t.amount.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes_${filterMonth}.csv`;
    link.click();
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredTransactions = transactions.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.merchant?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIncome = filteredTransactions
    .filter(t => t.transaction_type === 'receita')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.transaction_type === 'despesa')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Transações</h1>
          <p className="text-body text-neutral-600 mt-xs">
            Gerencie suas movimentações financeiras
          </p>
        </div>
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={exportToCSV}>
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Upload PDF */}
      <Card>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-md">
          <div className="flex-1">
            <h3 className="text-h4 font-bold text-neutral-900 mb-xs">
              Importar Extrato Bancário
            </h3>
            <p className="text-small text-neutral-600">
              Faça upload do PDF do seu banco para importação automática de transações
            </p>
          </div>
          <div className="flex-shrink-0">
            <label htmlFor="pdf-upload">
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <Button
                variant="primary"
                as="span"
                loading={uploading}
                disabled={uploading}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Processando...' : 'Selecionar PDF'}
              </Button>
            </label>
          </div>
        </div>
        {uploadProgress && (
          <div className="mt-md p-sm bg-info-50 border border-info-200 rounded-base">
            <p className="text-small text-info-700">{uploadProgress}</p>
          </div>
        )}
      </Card>

      {/* Filtros e Resumo */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-lg">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div className="p-md bg-neutral-50 rounded-base">
            <p className="text-small text-neutral-600 mb-xs">Total de Transações</p>
            <p className="text-h4 font-bold text-neutral-900">{filteredTransactions.length}</p>
          </div>
          <div className="p-md bg-success-50 rounded-base">
            <p className="text-small text-success-700 mb-xs">Receitas</p>
            <p className="text-h4 font-bold text-success-700">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="p-md bg-error-50 rounded-base">
            <p className="text-small text-error-700 mb-xs">Despesas</p>
            <p className="text-h4 font-bold text-error-700">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </Card>

      {/* Lista de Transações */}
      <Card>
        <h3 className="text-h4 font-bold text-neutral-900 mb-md">
          Todas as Transações ({filteredTransactions.length})
        </h3>

        {filteredTransactions.length > 0 ? (
          <div className="space-y-xs">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-md p-md rounded-base bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    transaction.transaction_type === 'receita'
                      ? 'bg-success-100 text-success-600'
                      : 'bg-error-100 text-error-600'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold text-neutral-900 truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-xs mt-xs flex-wrap">
                    <span className="text-small text-neutral-500">
                      {formatDate(transaction.transaction_date)}
                    </span>
                    {transaction.category_name && (
                      <>
                        <span className="text-neutral-300">•</span>
                        <span
                          className="text-small px-xs py-0.5 rounded"
                          style={{
                            backgroundColor: transaction.category_color + '20',
                            color: transaction.category_color || '#666'
                          }}
                        >
                          {transaction.category_name}
                        </span>
                      </>
                    )}
                    <span className="text-neutral-300">•</span>
                    <span className="text-small text-neutral-500 capitalize">
                      {transaction.source === 'manual' ? 'Manual' : transaction.source === 'pdf_import' ? 'PDF' : 'API'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-md flex-shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-body-large font-bold ${
                        transaction.transaction_type === 'receita'
                          ? 'text-success-600'
                          : 'text-error-600'
                      }`}
                    >
                      {transaction.transaction_type === 'receita' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <div className="flex items-center justify-end gap-xs mt-xs">
                      {transaction.status === 'confirmed' ? (
                        <CheckCircle className="w-4 h-4 text-success-500" />
                      ) : transaction.status === 'pending' ? (
                        <FileText className="w-4 h-4 text-warning-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-error-500" />
                      )}
                      <span className="text-small text-neutral-500 capitalize">
                        {transaction.status === 'confirmed' ? 'Confirmada' : transaction.status === 'pending' ? 'Pendente' : 'Cancelada'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteClick(transaction)}
                    className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-base transition-colors"
                    title="Excluir transação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-xl">
            <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-md" />
            <p className="text-body text-neutral-600 mb-xs">Nenhuma transação encontrada</p>
            <p className="text-small text-neutral-500">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece importando um extrato ou adicionando manualmente'}
            </p>
          </div>
        )}
      </Card>

      {/* Modal: Nova Transação */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50">
          <Card className="max-w-lg w-full">
            <h3 className="text-h4 font-bold text-neutral-900 mb-lg">Nova Transação</h3>
            
            <div className="space-y-md">
              <Input
                label="Descrição"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                placeholder="Ex: Compra no mercado"
                required
              />

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-xs">
                    Tipo <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={newTransaction.transaction_type}
                    onChange={(e) => setNewTransaction({ ...newTransaction, transaction_type: e.target.value as any })}
                    className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="despesa">Despesa</option>
                    <option value="receita">Receita</option>
                  </select>
                </div>

                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Valor (€)' : 'Valor (R$)'}
                  value={newTransaction.amount || ''}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  step="0.01"
                  required
                />
              </div>

              <Input
                type="date"
                label="Data"
                value={newTransaction.transaction_date}
                onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                required
              />

              {accounts.length > 0 && (
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-xs">
                    Conta
                  </label>
                  <select
                    value={newTransaction.account_id}
                    onChange={(e) => setNewTransaction({ ...newTransaction, account_id: e.target.value })}
                    className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecione uma conta</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.nickname} - {account.institution}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
              <Button
                variant="ghost"
                onClick={() => setShowAddModal(false)}
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleAddTransaction}
                fullWidth
              >
                Adicionar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão */}
      {transactionToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50"
          onClick={handleDeleteCancel}
        >
          <Card 
            className="max-w-md w-full"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex items-center gap-md mb-lg">
              <div className="w-12 h-12 rounded-full bg-error-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-error-600" />
              </div>
              <div>
                <h3 className="text-h4 font-bold text-neutral-900">Excluir Transação</h3>
                <p className="text-small text-neutral-600">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-base p-md mb-lg">
              <p className="text-body font-semibold text-neutral-900 mb-xs">
                {transactionToDelete.description}
              </p>
              <div className="flex items-center gap-xs text-small text-neutral-600">
                <span>{formatDate(transactionToDelete.transaction_date)}</span>
                <span className="text-neutral-300">•</span>
                <span className="capitalize">{transactionToDelete.transaction_type}</span>
                <span className="text-neutral-300">•</span>
                <span
                  className={`font-semibold ${
                    transactionToDelete.transaction_type === 'receita'
                      ? 'text-success-600'
                      : 'text-error-600'
                  }`}
                >
                  {transactionToDelete.transaction_type === 'receita' ? '+' : '-'}
                  {formatCurrency(Math.abs(transactionToDelete.amount))}
                </span>
              </div>
            </div>

            <div className="flex gap-sm">
              <Button
                variant="ghost"
                onClick={handleDeleteCancel}
                fullWidth
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteConfirm}
                fullWidth
                loading={deleting}
                disabled={deleting}
                className="bg-error-500 hover:bg-error-600"
              >
                Excluir
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
