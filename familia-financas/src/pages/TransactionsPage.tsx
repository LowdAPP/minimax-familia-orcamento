// Página de Transações - Gestão e Upload de PDFs
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase } from '../lib/supabase';
// PDF parsing agora é feito no backend
// import { extractTextFromPDF, parseTransactionsFromText } from '../lib/pdfParser';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ResultModal } from '../components/ui/Modal';
import { MonthPicker } from '../components/ui/Calendar';
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
  DollarSign,
  Pencil,
  CheckSquare,
  Square,
  X,
  AlertTriangle,
  Tag,
  Home,
  Utensils,
  Car,
  Heart,
  Book,
  Smile,
  Coffee,
  Plane,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Wallet,
  Receipt,
  ShoppingCart,
  Gift,
  Music,
  Film,
  Gamepad2,
  Dumbbell,
  Briefcase,
  GraduationCap,
  Building,
  Zap,
  Star,
  Bell,
  Camera,
  Phone,
  Wifi,
  Droplet,
  Flame,
  Bike,
  Bus,
  Train,
  MapPin,
  Mail,
  Users,
  Stethoscope,
  Pill,
  Apple,
  Pizza,
  Shirt,
  Headphones,
  Tv,
  Laptop,
  Smartphone,
  BookOpen,
  School,
  Calculator,
  Scissors,
  Wrench,
  Paintbrush,
  Sparkles,
  Wand2
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
  category_icon?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  source: 'manual' | 'pdf_import' | 'api';
  account_id?: string;
  account_name?: string;
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
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [autoCategorizing, setAutoCategorizing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedAccountForUpload, setSelectedAccountForUpload] = useState<string>('');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterAccount, setFilterAccount] = useState<string>('all');
  
  // Modal de nova transação
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: 0,
    transaction_type: 'despesa' as 'receita' | 'despesa',
    transaction_date: new Date().toISOString().split('T')[0],
    account_id: '',
    category_id: ''
  });

  // Modal de confirmação de exclusão
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal de edição
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTransaction, setEditTransaction] = useState({
    description: '',
    amount: 0,
    transaction_type: 'despesa' as 'receita' | 'despesa' | 'transferencia',
    transaction_date: '',
    account_id: '',
    category_id: ''
  });

  // Seleção múltipla
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [showBulkAccountModal, setShowBulkAccountModal] = useState(false);
  const [bulkAccountId, setBulkAccountId] = useState('');
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');

  // Duplicatas
  const [duplicates, setDuplicates] = useState<Map<string, Transaction[]>>(new Map());
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());
  const [deletingDuplicates, setDeletingDuplicates] = useState(false);

  // Modal de resultado do upload
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    details?: string;
    transactionCount?: number;
    transactionsFound?: number;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterMonth, filterType, filterAccount]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadTransactions(), loadAccounts(), loadCategories()]);
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
        category_id,
        account_id
      `)
      .eq('user_id', user.id)
      .gte('transaction_date', firstDay)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });

    if (filterType !== 'all') {
      query = query.eq('transaction_type', filterType);
    }

    if (filterAccount !== 'all') {
      query = query.eq('account_id', filterAccount);
    }

    console.log(`📅 Carregando transações de ${firstDay} até ${endDate} (mês: ${filterMonth})`);

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao carregar transações:', error);
      return;
    }

    console.log(`✅ ${data?.length || 0} transações carregadas para o mês ${filterMonth}`);
    if (data && data.length > 0) {
      console.log('📋 Primeiras 3 transações:', data.slice(0, 3).map((t: any) => ({
        date: t.transaction_date,
        description: t.description?.substring(0, 30),
        amount: t.amount,
        source: t.source
      })));
    } else {
      console.log('⚠️ Nenhuma transação encontrada para este mês');
    }

    // Criar mapa de contas para busca rápida
    const accountsMap = new Map(accounts.map(acc => [acc.id, acc]));
    
    // Criar mapa de categorias para busca rápida (garantir que categorias estejam carregadas)
    const categoriesMap = new Map((categories || []).map(cat => [cat.id, cat]));

    const transactionsData = data?.map((t: any) => {
      const account = t.account_id ? accountsMap.get(t.account_id) : null;
      const category = t.category_id ? categoriesMap.get(t.category_id) : null;
      return {
        id: t.id,
        description: t.description,
        merchant: t.merchant,
        amount: t.amount,
        transaction_type: t.transaction_type,
        transaction_date: t.transaction_date,
        category_name: category?.name,
        category_color: category?.color,
        category_icon: category?.icon,
        status: t.status,
        source: t.source,
        account_id: t.account_id,
        account_name: account ? `${account.nickname}${account.institution ? ` - ${account.institution}` : ''}` : undefined
      };
    }) || [];

    setTransactions(transactionsData);
    
    // Detectar duplicatas após carregar transações
    if (transactionsData.length > 0) {
      detectDuplicates(transactionsData);
    } else {
      setDuplicates(new Map());
    }
  };

  const loadAccounts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('accounts')
      .select('id, nickname, institution, current_balance')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const accountsData = data || [];
    setAccounts(accountsData);
    
    // Se não houver conta selecionada e houver contas disponíveis, selecionar a primeira
    if (!selectedAccountForUpload && accountsData.length > 0) {
      setSelectedAccountForUpload(accountsData[0].id);
    }
  };

  const loadCategories = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('categories')
      .select('id, name, color, category_type, icon')
      .or(`user_id.eq.${user.id},is_system_category.eq.true`)
      .order('name');

    setCategories(data || []);
  };

  const handleAutoCategorize = async () => {
    if (!user) return;
    
    setAutoCategorizing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auto-categorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (data.success) {
        setResultModal({
          isOpen: true,
          type: 'success',
          title: 'Auto-categorização Concluída',
          message: data.message,
          details: data.count > 0 
            ? `Foram categorizadas ${data.count} transações automaticamente com base no seu histórico.`
            : 'Não foram encontradas novas transações para categorizar ou o histórico é insuficiente.'
        });
        
        // Recarregar transações se houve alterações
        if (data.count > 0) {
          loadTransactions();
        }
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro na auto-categorização:', error);
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Erro na Auto-categorização',
        message: 'Não foi possível categorizar as transações.',
        details: error.message || 'Tente novamente mais tarde.'
      });
    } finally {
      setAutoCategorizing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Arquivo Inválido',
        message: 'Por favor, selecione um arquivo PDF válido'
      });
      return;
    }

    // Validar se uma conta foi selecionada
    if (!selectedAccountForUpload && accounts.length > 0) {
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Conta Não Selecionada',
        message: 'Por favor, selecione uma conta para associar as transações do PDF.'
      });
      return;
    }

    setUploading(true);
    setUploadProgress('Fazendo upload do arquivo...');

    try {
      // Usar conta selecionada ou criar uma padrão se não houver contas
      let accountId = selectedAccountForUpload || accounts[0]?.id;
      
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
        setSelectedAccountForUpload(newAccount.id);
      }

      setUploadProgress('Enviando PDF para processamento...');

      // URL do backend (Railway ou local)
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

      // 1. Enviar PDF para o backend
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.id);
      formData.append('account_id', accountId);

      console.log('📤 Enviando PDF para backend:', backendUrl);

      const response = await fetch(`${backendUrl}/api/process-pdf`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Resultado:', result);

      if (!result.success) {
        setResultModal({
          isOpen: true,
          type: 'error',
          title: 'Erro ao Processar PDF',
          message: result.error || 'Erro ao processar PDF',
          details: 'Tente novamente ou verifique se o arquivo está correto.'
        });
        setUploadProgress('');
        setUploading(false);
        return;
      }

      const transactionCount = result.transactionsInserted || 0;
      const transactionsFound = result.transactionsFound || 0;

      // Se encontrou transações mas não salvou, mostra aviso
      if (transactionsFound > 0 && transactionCount === 0) {
        const errorMsg = result.error || result.databaseSave?.reason || 'Erro desconhecido ao salvar no banco de dados';
        setResultModal({
          isOpen: true,
          type: 'warning',
          title: 'Transações Não Salvas',
          message: `${transactionsFound} transações encontradas, mas nenhuma foi salva.`,
          details: `Erro: ${errorMsg}\n\n💡 Verifique os logs do backend ou as configurações do Supabase.`,
          transactionsFound,
          transactionCount: 0
        });
        setUploadProgress('');
        setUploading(false);
        return;
      }

      if (transactionCount === 0 && transactionsFound === 0) {
        setResultModal({
          isOpen: true,
          type: 'warning',
          title: 'Nenhuma Transação Encontrada',
          message: 'Nenhuma transação foi encontrada no PDF.',
          details: '💡 Verifique se o arquivo contém transações visíveis (não imagens escaneadas).',
          transactionsFound: 0,
          transactionCount: 0
        });
        setUploadProgress('');
        setUploading(false);
        return;
      }

      // Sucesso!
      setResultModal({
        isOpen: true,
        type: 'success',
        title: 'PDF Processado com Sucesso!',
        message: `${transactionCount} transação${transactionCount !== 1 ? 'ões' : ''} importada${transactionCount !== 1 ? 's' : ''} com sucesso!`,
        details: 'As transações foram adicionadas à sua conta.',
        transactionCount,
        transactionsFound
      });

      setUploadProgress('');
      setUploading(false);

      // Se houver transações no resultado, ajustar filtro para o mês das transações
      if (result.transactions && result.transactions.length > 0) {
        const firstTransaction = result.transactions[0];
        console.log('📋 Primeira transação do resultado:', firstTransaction);
        
        if (firstTransaction.transaction_date) {
          const transactionMonth = firstTransaction.transaction_date.substring(0, 7); // YYYY-MM
          console.log(`📅 Mês da transação: ${transactionMonth}, Filtro atual: ${filterMonth}`);
          
          if (transactionMonth !== filterMonth) {
            console.log(`📅 Ajustando filtro de ${filterMonth} para ${transactionMonth} (mês das transações importadas)`);
            setFilterMonth(transactionMonth);
            // loadTransactions será chamado automaticamente pelo useEffect quando filterMonth mudar
            return;
          }
        }
      } else {
        // Se não tiver transações no resultado, tentar buscar todas as transações recentes
        console.log('⚠️ Nenhuma transação no resultado, recarregando do banco...');
      }

      // Recarregar transações
      console.log('🔄 Recarregando transações...');
      await loadTransactions();

    } catch (error: any) {
      console.error('❌ Erro completo ao processar PDF:', error);
      
      let errorMessage = 'Erro ao processar PDF';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.toString) {
        errorMessage = error.toString();
      }
      
      // Mensagens mais amigáveis para erros comuns
      let friendlyMessage = errorMessage;
      let details = '';
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        friendlyMessage = 'Erro de conexão';
        details = 'Verifique sua internet e tente novamente.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        friendlyMessage = 'Sessão expirada';
        details = 'Por favor, faça login novamente.';
      } else if (errorMessage.includes('404')) {
        friendlyMessage = 'Serviço não encontrado';
        details = 'Verifique se o backend está deployado e funcionando.';
      } else if (errorMessage.includes('500')) {
        friendlyMessage = 'Erro no servidor';
        details = 'Por favor, tente novamente mais tarde.';
      }
      
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Erro ao Processar PDF',
        message: friendlyMessage,
        details: details || 'Tente novamente ou entre em contato com o suporte.'
      });
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
        category_id: newTransaction.category_id || null,
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
        account_id: '',
        category_id: ''
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

  const handleEditClick = async (transaction: Transaction) => {
    // Buscar account_id e category_id da transação
    let accountId = '';
    let categoryId = '';
    if (transaction.id) {
      const { data } = await supabase
        .from('transactions')
        .select('account_id, category_id')
        .eq('id', transaction.id)
        .single();
      
      if (data) {
        accountId = data.account_id || '';
        categoryId = data.category_id || '';
      }
    }

    setTransactionToEdit(transaction);
    setEditTransaction({
      description: transaction.description,
      amount: Math.abs(transaction.amount),
      transaction_type: transaction.transaction_type,
      transaction_date: transaction.transaction_date,
      account_id: accountId,
      category_id: categoryId
    });
  };

  const handleEditConfirm = async () => {
    if (!transactionToEdit || !user || !editTransaction.description || editTransaction.amount === 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setEditing(true);
    try {
      // Garantir que existe account_id válido
      let accountId = editTransaction.account_id || accounts[0]?.id;
      
      if (!accountId) {
        accountId = accounts[0]?.id;
      }

      const { error } = await supabase
        .from('transactions')
        .update({
          description: editTransaction.description,
          amount: editTransaction.transaction_type === 'despesa' 
            ? -Math.abs(editTransaction.amount) 
            : Math.abs(editTransaction.amount),
          transaction_type: editTransaction.transaction_type,
          transaction_date: editTransaction.transaction_date,
          account_id: accountId,
          category_id: editTransaction.category_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionToEdit.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTransactionToEdit(null);
      loadTransactions();
    } catch (error) {
      console.error('Erro ao editar transação:', error);
      alert('Erro ao editar transação. Tente novamente.');
    } finally {
      setEditing(false);
    }
  };

  const handleEditCancel = () => {
    setTransactionToEdit(null);
    setEditTransaction({
      description: '',
      amount: 0,
      transaction_type: 'despesa',
      transaction_date: '',
      account_id: '',
      category_id: ''
    });
  };

  // Funções de seleção múltipla
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedTransactions(new Set());
    }
  };

  const toggleTransactionSelection = (transactionId: string) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId);
    } else {
      newSelection.add(transactionId);
    }
    setSelectedTransactions(newSelection);
  };

  const selectAllTransactions = () => {
    const allIds = new Set(transactions.map(t => t.id));
    setSelectedTransactions(allIds);
  };

  const clearSelection = () => {
    setSelectedTransactions(new Set());
  };

  const handleBulkAccountUpdate = async () => {
    if (!user || selectedTransactions.size === 0 || !bulkAccountId) {
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Seleção Inválida',
        message: 'Selecione pelo menos uma transação e uma conta.'
      });
      return;
    }

    setBulkUpdating(true);
    try {
      const transactionIds = Array.from(selectedTransactions);
      
      const { error } = await supabase
        .from('transactions')
        .update({
          account_id: bulkAccountId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .in('id', transactionIds);

      if (error) throw error;

      // Limpar seleção e recarregar
      setSelectedTransactions(new Set());
      setIsSelectionMode(false);
      setShowBulkAccountModal(false);
      setBulkAccountId('');
      loadTransactions();

      setResultModal({
        isOpen: true,
        type: 'success',
        title: 'Contas Atualizadas!',
        message: `${transactionIds.length} transação${transactionIds.length !== 1 ? 'ões' : ''} atualizada${transactionIds.length !== 1 ? 's' : ''} com sucesso!`,
        details: 'As contas foram alteradas para a conta selecionada.'
      });
    } catch (error) {
      console.error('Erro ao atualizar contas em massa:', error);
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Erro ao Atualizar',
        message: 'Erro ao atualizar contas das transações.',
        details: 'Tente novamente ou entre em contato com o suporte.'
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkCategoryUpdate = async () => {
    if (!user || selectedTransactions.size === 0) {
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Seleção Inválida',
        message: 'Selecione pelo menos uma transação.'
      });
      return;
    }

    setBulkUpdating(true);
    try {
      const transactionIds = Array.from(selectedTransactions);
      
      const { error } = await supabase
        .from('transactions')
        .update({
          category_id: bulkCategoryId || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .in('id', transactionIds);

      if (error) throw error;

      // Limpar seleção e recarregar
      setSelectedTransactions(new Set());
      setIsSelectionMode(false);
      setShowBulkCategoryModal(false);
      setBulkCategoryId('');
      loadTransactions();

      setResultModal({
        isOpen: true,
        type: 'success',
        title: 'Categorias Atualizadas!',
        message: `${transactionIds.length} transação${transactionIds.length !== 1 ? 'ões' : ''} atualizada${transactionIds.length !== 1 ? 's' : ''} com sucesso!`,
        details: bulkCategoryId 
          ? 'As categorias foram alteradas para a categoria selecionada.'
          : 'As categorias foram removidas das transações selecionadas.'
      });
    } catch (error) {
      console.error('Erro ao atualizar categorias em massa:', error);
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Erro ao Atualizar',
        message: 'Erro ao atualizar categorias das transações.',
        details: 'Tente novamente ou entre em contato com o suporte.'
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  // Função para detectar transações duplicadas
  const detectDuplicates = (transactionsList: Transaction[]) => {
    const duplicatesMap = new Map<string, Transaction[]>();
    
    // Agrupar por data, descrição normalizada e valor
    const grouped = new Map<string, Transaction[]>();
    
    transactionsList.forEach(transaction => {
      // Normalizar descrição (lowercase, trim)
      const normalizedDesc = transaction.description.toLowerCase().trim();
      // Criar chave única: data + descrição + valor absoluto
      const key = `${transaction.transaction_date}|${normalizedDesc}|${Math.abs(transaction.amount).toFixed(2)}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(transaction);
    });
    
    // Filtrar apenas grupos com mais de 1 transação (duplicatas)
    grouped.forEach((group, key) => {
      if (group.length > 1) {
        duplicatesMap.set(key, group);
      }
    });
    
    setDuplicates(duplicatesMap);
  };

  // Função para deletar duplicatas selecionadas
  const handleDeleteDuplicates = async () => {
    if (!user || selectedDuplicates.size === 0) return;
    
    setDeletingDuplicates(true);
    try {
      const transactionIds = Array.from(selectedDuplicates);
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)
        .in('id', transactionIds);

      if (error) throw error;

      // Limpar seleção e recarregar
      setSelectedDuplicates(new Set());
      setShowDuplicatesModal(false);
      await loadTransactions();

      setResultModal({
        isOpen: true,
        type: 'success',
        title: 'Duplicatas Removidas!',
        message: `${transactionIds.length} transação${transactionIds.length !== 1 ? 'ões' : ''} removida${transactionIds.length !== 1 ? 's' : ''} com sucesso!`,
        details: 'As transações duplicadas foram excluídas.'
      });
    } catch (error) {
      console.error('Erro ao deletar duplicatas:', error);
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Erro ao Remover',
        message: 'Erro ao remover transações duplicadas.',
        details: 'Tente novamente ou entre em contato com o suporte.'
      });
    } finally {
      setDeletingDuplicates(false);
    }
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

  // Helper para renderizar ícone dinamicamente
  const renderCategoryIcon = (iconName: string | undefined, className: string = 'w-5 h-5', style?: React.CSSProperties) => {
    const ICONS: Record<string, any> = {
      'home': Home,
      'utensils': Utensils,
      'car': Car,
      'heart': Heart,
      'book': Book,
      'smile': Smile,
      'shopping-bag': ShoppingCart,
      'coffee': Coffee,
      'plane': Plane,
      'piggy-bank': PiggyBank,
      'trending-up': TrendingUp,
      'credit-card': CreditCard,
      'tag': Tag,
      'dollar-sign': DollarSign,
      'wallet': Wallet,
      'receipt': Receipt,
      'shopping-cart': ShoppingCart,
      'gift': Gift,
      'music': Music,
      'film': Film,
      'gamepad-2': Gamepad2,
      'dumbbell': Dumbbell,
      'briefcase': Briefcase,
      'graduation-cap': GraduationCap,
      'building': Building,
      'zap': Zap,
      'star': Star,
      'bell': Bell,
      'camera': Camera,
      'phone': Phone,
      'wifi': Wifi,
      'droplet': Droplet,
      'flame': Flame,
      'bike': Bike,
      'bus': Bus,
      'train': Train,
      'map-pin': MapPin,
      'mail': Mail,
      'users': Users,
      'stethoscope': Stethoscope,
      'pill': Pill,
      'apple': Apple,
      'pizza': Pizza,
      'shirt': Shirt,
      'laptop': Laptop,
      'smartphone': Smartphone,
      'tv': Tv,
      'headphones': Headphones,
      'book-open': BookOpen,
      'school': School,
      'calculator': Calculator,
      'scissors': Scissors,
      'wrench': Wrench,
      'paintbrush': Paintbrush,
      'sparkles': Sparkles
    };

    const IconComponent = iconName ? ICONS[iconName] : null;
    if (IconComponent) {
      return <IconComponent className={className} style={style} />;
    }
    return <Tag className={className} style={style} />;
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
      <div className="flex flex-col gap-md">
        <div>
          <h1 className="text-h2 md:text-h1 font-bold text-neutral-900">Transações</h1>
          <p className="text-small md:text-body text-neutral-600 mt-xs">
            Gerencie suas movimentações financeiras
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-sm">
          <Button variant="secondary" onClick={exportToCSV} fullWidth className="sm:w-auto">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">Exportar</span>
          </Button>
          <Button variant="primary" onClick={() => setShowAddModal(true)} fullWidth className="sm:w-auto">
            <Plus className="w-4 h-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Upload PDF */}
      <Card>
        <div className="flex flex-col gap-md">
          <div className="flex-1">
            <h3 className="text-body md:text-h4 font-bold text-neutral-900 mb-xs">
              Importar Extrato Bancário
            </h3>
            <p className="text-small text-neutral-600">
              Faça upload do PDF do seu banco para importação automática de transações
            </p>
          </div>
          
          {/* Seleção de conta */}
          {accounts.length > 0 ? (
            <div>
              <label className="block text-small font-medium text-neutral-700 mb-xs">
                Conta <span className="text-error-500">*</span>
              </label>
              <select
                value={selectedAccountForUpload}
                onChange={(e) => setSelectedAccountForUpload(e.target.value)}
                disabled={uploading}
                className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.nickname}{account.institution ? ` - ${account.institution}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-xs">
                As transações do PDF serão associadas a esta conta
              </p>
            </div>
          ) : (
            <div className="p-sm bg-warning-50 border border-warning-200 rounded-base">
              <p className="text-small text-warning-700">
                ⚠️ Nenhuma conta disponível. Uma conta padrão será criada automaticamente.
              </p>
            </div>
          )}

          <div className="w-full sm:w-auto">
            <label htmlFor="pdf-upload" className="block w-full sm:w-auto">
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={uploading || (accounts.length > 0 && !selectedAccountForUpload)}
                className="hidden"
              />
              <Button
                variant="primary"
                as="span"
                loading={uploading}
                disabled={uploading || (accounts.length > 0 && !selectedAccountForUpload)}
                fullWidth
                className="sm:w-auto"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Processando...' : 'Selecionar PDF'}
              </Button>
            </label>
          </div>
        </div>
        {uploadProgress && (
          <div className="mt-md p-sm bg-info-50 border border-info-200 rounded-base">
            <p className="text-small text-info-700 break-words">{uploadProgress}</p>
          </div>
        )}
      </Card>

      {/* Alerta de Duplicatas */}
      {duplicates.size > 0 && (
        <Card className="bg-warning-50 border-warning-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
            <div className="flex items-center gap-sm">
              <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0" />
              <div>
                <p className="text-body font-semibold text-warning-900">
                  {duplicates.size} grupo{duplicates.size !== 1 ? 's' : ''} de transações duplicadas encontrado{duplicates.size !== 1 ? 's' : ''}
                </p>
                <p className="text-small text-warning-700">
                  {Array.from(duplicates.values()).reduce((sum, group) => sum + group.length, 0)} transações duplicadas no total
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedDuplicates(new Set());
                setShowDuplicatesModal(true);
              }}
            >
              <AlertTriangle className="w-4 h-4" />
              Ver Duplicatas
            </Button>
          </div>
        </Card>
      )}

      {/* Filtros e Resumo */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-md mb-lg">
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
          
          <MonthPicker
            value={filterMonth}
            onChange={(value) => {
              console.log(`📅 Filtro de mês alterado para: ${value}`);
              setFilterMonth(value);
            }}
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

          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todas as contas</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.nickname}{account.institution ? ` - ${account.institution}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm sm:gap-md">
          <div className="p-sm sm:p-md bg-neutral-50 rounded-base">
            <p className="text-xs sm:text-small text-neutral-600 mb-xs">Total de Transações</p>
            <p className="text-body md:text-h4 font-bold text-neutral-900">{filteredTransactions.length}</p>
          </div>
          <div className="p-sm sm:p-md bg-success-50 rounded-base">
            <p className="text-xs sm:text-small text-success-700 mb-xs">Receitas</p>
            <p className="text-body md:text-h4 font-bold text-success-700">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="p-sm sm:p-md bg-error-50 rounded-base">
            <p className="text-xs sm:text-small text-error-700 mb-xs">Despesas</p>
            <p className="text-body md:text-h4 font-bold text-error-700">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        {/* Botão de seleção múltipla */}
        <div className="mt-md pt-md border-t border-neutral-200">
          <Button
            variant={isSelectionMode ? 'primary' : 'outline'}
            size="sm"
            onClick={toggleSelectionMode}
            fullWidth
            className="sm:w-auto"
          >
            {isSelectionMode ? (
              <>
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Cancelar Seleção</span>
                <span className="sm:hidden">Cancelar</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Selecionar Transações</span>
                <span className="sm:hidden">Selecionar</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Barra de ações em massa (quando há seleção) */}
      {isSelectionMode && selectedTransactions.size > 0 && (
        <Card className="mb-lg bg-primary-50 border-primary-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-xs sm:gap-md">
              <span className="text-small sm:text-body font-semibold text-primary-900">
                {selectedTransactions.size} transação{selectedTransactions.size !== 1 ? 'ões' : ''} selecionada{selectedTransactions.size !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-sm">
                <button
                  onClick={selectAllTransactions}
                  className="text-small text-primary-600 hover:text-primary-700 underline"
                >
                  Selecionar todas
                </button>
                <span className="text-neutral-300">•</span>
                <button
                  onClick={clearSelection}
                  className="text-small text-primary-600 hover:text-primary-700 underline"
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-sm w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowBulkAccountModal(true)}
                disabled={selectedTransactions.size === 0}
                fullWidth
                className="sm:w-auto"
              >
                Alterar Conta
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowBulkCategoryModal(true)}
                disabled={selectedTransactions.size === 0}
                fullWidth
                className="sm:w-auto"
              >
                Alterar Categoria
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de Transações */}
      <Card>
        <h3 className="text-body md:text-h4 font-bold text-neutral-900 mb-md">
          Todas as Transações ({filteredTransactions.length})
        </h3>

        {filteredTransactions.length > 0 ? (
          <div className="space-y-xs">
            {filteredTransactions.map((transaction) => {
              const isSelected = selectedTransactions.has(transaction.id);
              
              return (
              <div
                key={transaction.id}
                className={`
                  flex flex-col sm:flex-row sm:items-center gap-sm sm:gap-md p-sm sm:p-md rounded-base transition-colors border
                  ${isSelected ? 'border-primary-500 bg-primary-50' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'}
                  ${isSelectionMode ? 'cursor-pointer' : ''}
                `}
                onClick={() => isSelectionMode && toggleTransactionSelection(transaction.id)}
              >
                {/* Primeira linha: Checkbox, ícone, descrição e valor */}
                <div className="flex items-center gap-sm sm:gap-md flex-1 min-w-0">
                  {/* Checkbox de seleção */}
                  {isSelectionMode && (
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                  )}
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      transaction.category_color
                        ? ''
                        : transaction.transaction_type === 'receita'
                        ? 'bg-success-100 text-success-600'
                        : 'bg-error-100 text-error-600'
                    }`}
                    style={
                      transaction.category_color
                        ? {
                            backgroundColor: transaction.category_color + '20',
                            color: transaction.category_color
                          }
                        : undefined
                    }
                  >
                    {transaction.category_icon ? (
                      renderCategoryIcon(transaction.category_icon, 'w-4 h-4 sm:w-5 sm:h-5')
                    ) : transaction.category_name ? (
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <span 
                        className="text-[8px] sm:text-[10px] font-semibold leading-tight text-center"
                        style={{ transform: 'rotate(-30deg)' }}
                      >
                        Sem Categoria
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-small sm:text-body font-semibold text-neutral-900 truncate">
                      {transaction.description}
                    </p>
                    {transaction.category_name && (
                      <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
                        {transaction.category_name}
                      </p>
                    )}
                    <div className="flex items-center gap-xs mt-xs flex-wrap">
                      <span className="text-xs sm:text-small text-neutral-500">
                        {formatDate(transaction.transaction_date)}
                      </span>
                      {transaction.account_name && (
                        <>
                          <span className="text-neutral-300">•</span>
                          <span className="text-xs sm:text-small text-neutral-600 font-medium truncate max-w-[120px] sm:max-w-none">
                            {transaction.account_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-sm sm:gap-md flex-shrink-0">
                    <div className="text-right">
                      <p
                        className={`text-body sm:text-body-large font-bold ${
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
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-success-500" />
                        ) : transaction.status === 'pending' ? (
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-warning-500" />
                        ) : (
                          <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-error-500" />
                        )}
                        <span className="text-xs sm:text-small text-neutral-500 capitalize hidden sm:inline">
                          {transaction.status === 'confirmed' ? 'Confirmada' : transaction.status === 'pending' ? 'Pendente' : 'Cancelada'}
                        </span>
                      </div>
                    </div>

                    {!isSelectionMode && (
                      <div className="flex items-center gap-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(transaction);
                          }}
                          className="p-1.5 sm:p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-base transition-colors"
                          title="Editar transação"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(transaction);
                          }}
                          className="p-1.5 sm:p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-base transition-colors"
                          title="Excluir transação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Segunda linha: Categoria e fonte (mobile) */}
                <div className="flex items-center gap-xs flex-wrap sm:hidden pl-11 sm:pl-0">
                  {transaction.category_name && (
                    <>
                      <span
                        className="text-xs px-xs py-0.5 rounded"
                        style={{
                          backgroundColor: transaction.category_color + '20',
                          color: transaction.category_color || '#666'
                        }}
                      >
                        {transaction.category_name}
                      </span>
                      <span className="text-neutral-300">•</span>
                    </>
                  )}
                  <span className="text-xs text-neutral-500 capitalize">
                    {transaction.source === 'manual' ? 'Manual' : transaction.source === 'pdf_import' ? 'PDF' : 'API'}
                  </span>
                </div>
              </div>
              );
            })}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50 overflow-y-auto">
          <Card className="max-w-lg w-full m-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-body md:text-h4 font-bold text-neutral-900 mb-lg">Nova Transação</h3>
            
            <div className="space-y-md">
              <Input
                label="Descrição"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                placeholder="Ex: Compra no mercado"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
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
                    <option value="transferencia">Transferência</option>
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

              {categories.length > 0 && (
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-xs">
                    Categoria
                  </label>
                  <select
                    value={newTransaction.category_id}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                    className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecione uma categoria (opcional)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
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

      {/* Modal: Editar Transação */}
      {transactionToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50 overflow-y-auto">
          <Card className="max-w-lg w-full m-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-body md:text-h4 font-bold text-neutral-900 mb-lg">Editar Transação</h3>
            
            <div className="space-y-md">
              <Input
                label="Descrição"
                value={editTransaction.description}
                onChange={(e) => setEditTransaction({ ...editTransaction, description: e.target.value })}
                placeholder="Ex: Compra no mercado"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-xs">
                    Tipo <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={editTransaction.transaction_type}
                    onChange={(e) => setEditTransaction({ ...editTransaction, transaction_type: e.target.value as any })}
                    className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="despesa">Despesa</option>
                    <option value="receita">Receita</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>

                <Input
                  type="number"
                  label={language === 'pt-PT' ? 'Valor (€)' : 'Valor (R$)'}
                  value={editTransaction.amount || ''}
                  onChange={(e) => setEditTransaction({ ...editTransaction, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  step="0.01"
                  required
                />
              </div>

              <Input
                type="date"
                label="Data"
                value={editTransaction.transaction_date}
                onChange={(e) => setEditTransaction({ ...editTransaction, transaction_date: e.target.value })}
                required
              />

              {accounts.length > 0 && (
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-xs">
                    Conta
                  </label>
                  <select
                    value={editTransaction.account_id}
                    onChange={(e) => setEditTransaction({ ...editTransaction, account_id: e.target.value })}
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

              {categories.length > 0 && (
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-xs">
                    Categoria
                  </label>
                  <select
                    value={editTransaction.category_id}
                    onChange={(e) => setEditTransaction({ ...editTransaction, category_id: e.target.value })}
                    className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Selecione uma categoria (opcional)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
              <Button
                variant="ghost"
                onClick={handleEditCancel}
                fullWidth
                disabled={editing}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleEditConfirm}
                fullWidth
                loading={editing}
                disabled={editing}
              >
                Salvar Alterações
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Duplicatas */}
      {showDuplicatesModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50 overflow-y-auto"
          onClick={() => setShowDuplicatesModal(false)}
        >
          <Card 
            className="max-w-4xl w-full m-sm max-h-[90vh] overflow-y-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-lg">
              <div>
                <h3 className="text-body md:text-h4 font-bold text-neutral-900">
                  Transações Duplicadas
                </h3>
                <p className="text-small text-neutral-600 mt-xs">
                  Selecione as transações duplicadas que deseja remover
                </p>
              </div>
              <button
                onClick={() => setShowDuplicatesModal(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-base transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-lg">
              {duplicates.size === 0 ? (
                <div className="text-center py-xl">
                  <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-md" />
                  <p className="text-body font-semibold text-neutral-900 mb-xs">
                    Nenhuma duplicata encontrada
                  </p>
                  <p className="text-small text-neutral-600">
                    Todas as transações são únicas (mesma data, descrição e valor)
                  </p>
                </div>
              ) : (
                Array.from(duplicates.entries()).map(([key, group]) => {
                const [date, normalizedDesc, amountStr] = key.split('|');
                const amount = parseFloat(amountStr);
                const firstTransaction = group[0];
                
                return (
                  <div key={key} className="border border-neutral-200 rounded-base p-md">
                    <div className="flex items-center justify-between mb-md">
                      <div className="flex-1">
                        <p className="text-body font-semibold text-neutral-900 mb-xs">
                          {firstTransaction.description}
                        </p>
                        <div className="flex items-center gap-xs flex-wrap">
                          <span className="text-small text-neutral-500">
                            Data: {formatDate(date)}
                          </span>
                          <span className="text-neutral-300">•</span>
                          <span className="text-small text-neutral-500">
                            Valor: {formatCurrency(amount)}
                          </span>
                          <span className="text-neutral-300">•</span>
                          <span className="text-small text-neutral-500">
                            {group.length} duplicata{group.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const allIds = new Set(group.map(t => t.id));
                          if (Array.from(selectedDuplicates).some(id => allIds.has(id))) {
                            // Desmarcar todas deste grupo
                            setSelectedDuplicates(prev => {
                              const newSet = new Set(prev);
                              allIds.forEach(id => newSet.delete(id));
                              return newSet;
                            });
                          } else {
                            // Marcar todas deste grupo (exceto a primeira)
                            setSelectedDuplicates(prev => {
                              const newSet = new Set(prev);
                              group.slice(1).forEach(t => newSet.add(t.id));
                              return newSet;
                            });
                          }
                        }}
                        className="text-small text-primary-600 hover:text-primary-700 underline"
                      >
                        {Array.from(selectedDuplicates).some(id => group.slice(1).some(t => t.id === id))
                          ? 'Desmarcar grupo'
                          : 'Selecionar duplicatas (manter primeira)'}
                      </button>
                    </div>
                    
                    <div className="space-y-xs">
                      {group.map((transaction, index) => {
                        const isSelected = selectedDuplicates.has(transaction.id);
                        const isFirst = index === 0;
                        
                        return (
                          <div
                            key={transaction.id}
                            className={`
                              flex items-center gap-sm p-sm rounded-base border transition-colors
                              ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 bg-neutral-50'}
                              ${isFirst ? 'border-success-300 bg-success-50' : ''}
                            `}
                          >
                            <button
                              onClick={() => {
                                if (isFirst) return; // Não permitir selecionar a primeira
                                setSelectedDuplicates(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(transaction.id)) {
                                    newSet.delete(transaction.id);
                                  } else {
                                    newSet.add(transaction.id);
                                  }
                                  return newSet;
                                });
                              }}
                              disabled={isFirst}
                              className="flex-shrink-0"
                            >
                              {isFirst ? (
                                <span title="Esta transação será mantida">
                                  <CheckCircle className="w-5 h-5 text-success-600" />
                                </span>
                              ) : isSelected ? (
                                <CheckSquare className="w-5 h-5 text-primary-600" />
                              ) : (
                                <Square className="w-5 h-5 text-neutral-400" />
                              )}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-xs">
                                {isFirst && (
                                  <span className="text-xs px-xs py-0.5 bg-success-100 text-success-700 rounded font-medium">
                                    MANTER
                                  </span>
                                )}
                                <span className="text-small text-neutral-500">
                                  {formatDate(transaction.transaction_date)}
                                </span>
                                {transaction.account_name && (
                                  <>
                                    <span className="text-neutral-300">•</span>
                                    <span className="text-small text-neutral-600">
                                      {transaction.account_name}
                                    </span>
                                  </>
                                )}
                                <span className="text-neutral-300">•</span>
                                <span className="text-small text-neutral-500 capitalize">
                                  {transaction.source === 'manual' ? 'Manual' : transaction.source === 'pdf_import' ? 'PDF' : 'API'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right flex-shrink-0">
                              <p className={`text-small font-semibold ${
                                transaction.transaction_type === 'receita' ? 'text-success-600' : 'text-error-600'
                              }`}>
                                {transaction.transaction_type === 'receita' ? '+' : '-'}
                                {formatCurrency(Math.abs(transaction.amount))}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-sm mt-lg pt-lg border-t border-neutral-200">
              <p className="text-small text-neutral-600">
                {selectedDuplicates.size > 0 
                  ? `${selectedDuplicates.size} transação${selectedDuplicates.size !== 1 ? 'ões' : ''} selecionada${selectedDuplicates.size !== 1 ? 's' : ''} para remoção`
                  : 'Selecione as transações duplicadas que deseja remover'}
              </p>
              <div className="flex gap-sm w-full sm:w-auto">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDuplicatesModal(false);
                    setSelectedDuplicates(new Set());
                  }}
                  fullWidth
                  className="sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteDuplicates}
                  disabled={selectedDuplicates.size === 0 || deletingDuplicates}
                  loading={deletingDuplicates}
                  fullWidth
                  className="sm:w-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover Selecionadas ({selectedDuplicates.size})
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão */}
      {transactionToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50 overflow-y-auto"
          onClick={handleDeleteCancel}
        >
          <Card 
            className="max-w-md w-full m-sm"
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

      {/* Modal: Alterar Conta em Massa */}
      {showBulkAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50 overflow-y-auto">
          <Card className="max-w-md w-full m-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-body md:text-h4 font-bold text-neutral-900 mb-lg">
              Alterar Conta de {selectedTransactions.size} Transação{selectedTransactions.size !== 1 ? 'ões' : ''}
            </h3>
            
            <div className="space-y-md">
              <p className="text-body text-neutral-700">
                Selecione a conta para aplicar às transações selecionadas:
              </p>

              {accounts.length > 0 ? (
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-xs">
                    Conta <span className="text-error-500">*</span>
                  </label>
                  <select
                    value={bulkAccountId}
                    onChange={(e) => setBulkAccountId(e.target.value)}
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
              ) : (
                <p className="text-small text-neutral-600">
                  Nenhuma conta disponível. Crie uma conta primeiro.
                </p>
              )}
            </div>

            <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowBulkAccountModal(false);
                  setBulkAccountId('');
                }}
                fullWidth
                disabled={bulkUpdating}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkAccountUpdate}
                fullWidth
                loading={bulkUpdating}
                disabled={bulkUpdating || !bulkAccountId}
              >
                Atualizar {selectedTransactions.size} Transação{selectedTransactions.size !== 1 ? 'ões' : ''}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Alterar Categoria em Massa */}
      {showBulkCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50 overflow-y-auto">
          <Card className="max-w-md w-full m-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-body md:text-h4 font-bold text-neutral-900 mb-lg">
              Alterar Categoria de {selectedTransactions.size} Transação{selectedTransactions.size !== 1 ? 'ões' : ''}
            </h3>
            
            <div className="space-y-md">
              <p className="text-body text-neutral-700">
                Selecione a categoria para aplicar às transações selecionadas (ou deixe vazio para remover):
              </p>
              
              {categories.length > 0 ? (
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-xs">
                    Categoria
                  </label>
                  <select
                    value={bulkCategoryId}
                    onChange={(e) => setBulkCategoryId(e.target.value)}
                    className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Remover categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500 mt-xs">
                    Selecione uma categoria ou deixe vazio para remover a categoria das transações
                  </p>
                </div>
              ) : (
                <p className="text-small text-neutral-600">
                  Nenhuma categoria disponível
                </p>
              )}
            </div>

            <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowBulkCategoryModal(false);
                  setBulkCategoryId('');
                }}
                fullWidth
                disabled={bulkUpdating}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkCategoryUpdate}
                fullWidth
                loading={bulkUpdating}
                disabled={bulkUpdating}
              >
                Atualizar {selectedTransactions.size} Transação{selectedTransactions.size !== 1 ? 'ões' : ''}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Alterar Categoria em Massa */}
      {showBulkCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50 overflow-y-auto">
          <Card className="max-w-md w-full m-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-body md:text-h4 font-bold text-neutral-900 mb-lg">
              Alterar Categoria de {selectedTransactions.size} Transação{selectedTransactions.size !== 1 ? 'ões' : ''}
            </h3>
            
            <div className="space-y-md">
              <p className="text-body text-neutral-700">
                Selecione a categoria para aplicar às transações selecionadas (ou deixe vazio para remover):
              </p>
              
              {categories.length > 0 ? (
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-xs">
                    Categoria
                  </label>
                  <select
                    value={bulkCategoryId}
                    onChange={(e) => setBulkCategoryId(e.target.value)}
                    className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Remover categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500 mt-xs">
                    Selecione uma categoria ou deixe vazio para remover a categoria das transações
                  </p>
                </div>
              ) : (
                <p className="text-small text-neutral-600">
                  Nenhuma categoria disponível. Crie uma categoria primeiro.
                </p>
              )}
            </div>

            <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowBulkCategoryModal(false);
                  setBulkCategoryId('');
                }}
                fullWidth
                disabled={bulkUpdating}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkCategoryUpdate}
                fullWidth
                loading={bulkUpdating}
                disabled={bulkUpdating}
              >
                Atualizar {selectedTransactions.size} Transação{selectedTransactions.size !== 1 ? 'ões' : ''}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Resultado do Upload */}
      <ResultModal
        isOpen={resultModal.isOpen}
        onClose={() => setResultModal({ ...resultModal, isOpen: false })}
        type={resultModal.type}
        title={resultModal.title}
        message={resultModal.message}
        details={resultModal.details}
        transactionCount={resultModal.transactionCount}
        transactionsFound={resultModal.transactionsFound}
      />
    </div>
  );
}
