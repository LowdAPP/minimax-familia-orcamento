// Página de Gerenciamento de Categorias
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase } from '../lib/supabase';
import { useAlert } from '../hooks/useAlert';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Tag,
  AlertCircle,
  CheckCircle,
  Home,
  Utensils,
  Car,
  Heart,
  Book,
  Smile,
  ShoppingBag,
  Coffee,
  Plane,
  PiggyBank,
  TrendingUp,
  CreditCard,
  DollarSign,
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
  Sparkles
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  category_type: 'essencial' | 'superfluo' | 'poupanca' | 'divida';
  icon?: string;
  color?: string;
  envelope_limit?: number;
  is_system_category: boolean;
  user_id?: string;
  created_at: string;
}

const CATEGORY_TYPES = [
  { value: 'essencial', label: 'Essencial', color: '#0066FF' },
  { value: 'superfluo', label: 'Superfluo', color: '#F59E0B' },
  { value: 'poupanca', label: 'Poupança', color: '#10B981' },
  { value: 'divida', label: 'Dívida', color: '#EF4444' }
];

const ICONS = [
  { name: 'home', label: 'Casa', icon: Home },
  { name: 'utensils', label: 'Comida', icon: Utensils },
  { name: 'car', label: 'Carro', icon: Car },
  { name: 'heart', label: 'Coração', icon: Heart },
  { name: 'book', label: 'Livro', icon: Book },
  { name: 'smile', label: 'Sorriso', icon: Smile },
  { name: 'shopping-bag', label: 'Compras', icon: ShoppingBag },
  { name: 'coffee', label: 'Café', icon: Coffee },
  { name: 'plane', label: 'Avião', icon: Plane },
  { name: 'piggy-bank', label: 'Cofrinho', icon: PiggyBank },
  { name: 'trending-up', label: 'Crescimento', icon: TrendingUp },
  { name: 'credit-card', label: 'Cartão', icon: CreditCard },
  { name: 'tag', label: 'Tag', icon: Tag },
  { name: 'dollar-sign', label: 'Dinheiro', icon: DollarSign },
  { name: 'wallet', label: 'Carteira', icon: Wallet },
  { name: 'receipt', label: 'Recibo', icon: Receipt },
  { name: 'shopping-cart', label: 'Carrinho', icon: ShoppingCart },
  { name: 'gift', label: 'Presente', icon: Gift },
  { name: 'music', label: 'Música', icon: Music },
  { name: 'film', label: 'Filme', icon: Film },
  { name: 'gamepad-2', label: 'Jogos', icon: Gamepad2 },
  { name: 'dumbbell', label: 'Academia', icon: Dumbbell },
  { name: 'briefcase', label: 'Trabalho', icon: Briefcase },
  { name: 'graduation-cap', label: 'Educação', icon: GraduationCap },
  { name: 'building', label: 'Prédio', icon: Building },
  { name: 'zap', label: 'Energia', icon: Zap },
  { name: 'star', label: 'Estrela', icon: Star },
  { name: 'bell', label: 'Sino', icon: Bell },
  { name: 'camera', label: 'Câmera', icon: Camera },
  { name: 'phone', label: 'Telefone', icon: Phone },
  { name: 'wifi', label: 'Internet', icon: Wifi },
  { name: 'droplet', label: 'Água', icon: Droplet },
  { name: 'flame', label: 'Fogo', icon: Flame },
  { name: 'bike', label: 'Bicicleta', icon: Bike },
  { name: 'bus', label: 'Ônibus', icon: Bus },
  { name: 'train', label: 'Trem', icon: Train },
  { name: 'map-pin', label: 'Localização', icon: MapPin },
  { name: 'mail', label: 'Email', icon: Mail },
  { name: 'users', label: 'Pessoas', icon: Users },
  { name: 'stethoscope', label: 'Saúde', icon: Stethoscope },
  { name: 'pill', label: 'Remédio', icon: Pill },
  { name: 'apple', label: 'Maçã', icon: Apple },
  { name: 'pizza', label: 'Pizza', icon: Pizza },
  { name: 'shirt', label: 'Roupa', icon: Shirt },
  { name: 'laptop', label: 'Notebook', icon: Laptop },
  { name: 'smartphone', label: 'Celular', icon: Smartphone },
  { name: 'tv', label: 'TV', icon: Tv },
  { name: 'headphones', label: 'Fones', icon: Headphones },
  { name: 'book-open', label: 'Livro Aberto', icon: BookOpen },
  { name: 'school', label: 'Escola', icon: School },
  { name: 'calculator', label: 'Calculadora', icon: Calculator },
  { name: 'paintbrush', label: 'Pincel', icon: Paintbrush },
  { name: 'scissors', label: 'Tesoura', icon: Scissors },
  { name: 'wrench', label: 'Ferramenta', icon: Wrench },
  { name: 'sparkles', label: 'Brilho', icon: Sparkles }
];

// Helper para renderizar ícone dinamicamente
const renderIcon = (iconName: string, className: string = 'w-5 h-5', style?: React.CSSProperties) => {
  const iconConfig = ICONS.find(i => i.name === iconName);
  if (iconConfig) {
    const IconComponent = iconConfig.icon;
    return <IconComponent className={className} style={style} />;
  }
  return <Tag className={className} style={style} />;
};

const COLORS = [
  '#0066FF', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#06B6D4', '#F43F5E',
  '#8B5A2B', '#059669', '#7C3AED', '#DC2626', '#EA580C', '#CA8A04',
  '#0284C7', '#BE185D', '#9333EA', '#C026D3', '#DB2777', '#E11D48',
  '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#EF4444', '#DC2626'
];

export default function CategoriesPage() {
  const { user } = useAuth();
  const { t, formatCurrency } = useI18n();
  const { showAlert, AlertComponent } = useAlert();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category_type: 'essencial' as Category['category_type'],
    icon: 'tag',
    color: '#0066FF',
    envelope_limit: undefined as number | undefined
  });

  useEffect(() => {
    if (user) {
      validateConnection();
      loadCategories();
    }
  }, [user]);

  // Validação de conexão com o banco de dados
  const validateConnection = async () => {
    try {
      // Testa conexão verificando se consegue acessar a tabela categories
      const { error } = await supabase.from('categories').select('id').limit(1);

      if (error) {
        setDbConnected(false);
        setDbError(error.message || 'Erro ao conectar com o banco de dados');
        console.error('Erro de conexão:', error);
        return;
      }

      // Se chegou aqui, a conexão está OK
      setDbConnected(true);
      setDbError(null);
    } catch (error: any) {
      setDbConnected(false);
      setDbError(error.message || 'Erro ao validar conexão');
      console.error('Erro ao validar conexão:', error);
    }
  };

  const loadCategories = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_system_category.eq.true`)
        .order('is_system_category', { ascending: false })
        .order('name');

      if (error) {
        setDbConnected(false);
        setDbError(`Erro ao carregar categorias: ${error.message}`);
        throw error;
      }
      
      setCategories(data || []);
      setDbConnected(true);
      setDbError(null);
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
      setDbConnected(false);
      setDbError(error.message || 'Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      category_type: 'essencial',
      icon: 'tag',
      color: '#0066FF',
      envelope_limit: undefined
    });
    setEditingCategory(null);
    setShowAddModal(true);
  };

  const handleEdit = (category: Category) => {
    if (category.is_system_category) {
      showAlert({
        type: 'warning',
        title: 'Ação não permitida',
        message: 'Categorias do sistema não podem ser editadas'
      });
      return;
    }
    setFormData({
      name: category.name,
      category_type: category.category_type,
      icon: category.icon || 'tag',
      color: category.color || '#0066FF',
      envelope_limit: category.envelope_limit
    });
    setEditingCategory(category);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!user || !formData.name.trim()) {
      showAlert({
        type: 'warning',
        title: 'Campo obrigatório',
        message: 'Preencha o nome da categoria'
      });
      return;
    }

    setSaving(true);
    try {
      const categoryData = {
        name: formData.name.trim(),
        category_type: formData.category_type,
        icon: formData.icon,
        color: formData.color,
        envelope_limit: formData.envelope_limit || null,
        user_id: user.id,
        is_system_category: false
      };

      if (editingCategory) {
        // Atualizar
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) {
          setDbConnected(false);
          setDbError(`Erro ao atualizar categoria: ${error.message}`);
          throw error;
        }
      } else {
        // Criar
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);

        if (error) {
          setDbConnected(false);
          setDbError(`Erro ao criar categoria: ${error.message}`);
          throw error;
        }
      }

      await loadCategories();
      setShowAddModal(false);
      setEditingCategory(null);
      setDbConnected(true);
      setDbError(null);
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error);
      showAlert({
        type: 'error',
        title: 'Erro ao salvar',
        message: error.message || 'Erro ao salvar categoria. Verifique a conexão com o banco de dados.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (category.is_system_category) {
      showAlert({
        type: 'warning',
        title: 'Ação não permitida',
        message: 'Categorias do sistema não podem ser deletadas'
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar a categoria "${category.name}"?`)) {
      return;
    }

    setDeleting(category.id);
    try {
      // Verificar se há transações usando esta categoria
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('category_id', category.id)
        .limit(1);

      if (transactions && transactions.length > 0) {
        showAlert({
          type: 'warning',
          title: 'Não é possível deletar',
          message: 'Não é possível deletar esta categoria pois existem transações associadas a ela.'
        });
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;
      await loadCategories();
    } catch (error: any) {
      console.error('Erro ao deletar categoria:', error);
      showAlert({
        type: 'error',
        title: 'Erro ao deletar',
        message: `Erro ao deletar categoria: ${error.message}`
      });
    } finally {
      setDeleting(null);
    }
  };

  const userCategories = categories.filter(c => !c.is_system_category);
  const systemCategories = categories.filter(c => c.is_system_category);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Validação de Conexão */}
      {dbConnected === false && (
        <Card className="bg-error-50 border-error-200">
          <div className="flex items-center gap-sm">
            <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-body font-semibold text-error-900">
                Erro de conexão com o banco de dados
              </p>
              <p className="text-small text-error-700 mt-xs">
                {dbError || 'Não foi possível conectar. Verifique sua conexão e tente novamente.'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                validateConnection();
                loadCategories();
              }}
            >
              Tentar Novamente
            </Button>
          </div>
        </Card>
      )}

      {dbConnected === true && (
        <Card className="bg-success-50 border-success-200">
          <div className="flex items-center gap-sm">
            <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
            <p className="text-body text-success-700">
              Conectado ao banco de dados
            </p>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md">
        <div>
          <h1 className="text-h2 font-bold text-neutral-900">Categorias</h1>
          <p className="text-body text-neutral-600 mt-xs">
            Gerencie suas categorias de transações
          </p>
        </div>
        <Button variant="primary" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Categorias do Usuário */}
      {userCategories.length > 0 && (
        <Card>
          <h2 className="text-h4 font-bold text-neutral-900 mb-md">Suas Categorias</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {userCategories.map((category) => {
              const typeInfo = CATEGORY_TYPES.find(t => t.value === category.category_type);
              return (
                <div
                  key={category.id}
                  className="p-md bg-neutral-50 rounded-base border border-neutral-200 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-sm">
                    <div className="flex items-center gap-sm flex-1">
                      <div
                        className="w-10 h-10 rounded-base flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: (category.color || typeInfo?.color || '#0066FF') + '20' }}
                      >
                        {renderIcon(category.icon || 'tag', 'w-5 h-5', { 
                          color: category.color || typeInfo?.color || '#0066FF' 
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body font-semibold text-neutral-900 truncate">
                          {category.name}
                        </p>
                        <p className="text-small text-neutral-600 capitalize">
                          {typeInfo?.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-xs">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-xs text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-base transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        disabled={deleting === category.id}
                        className="p-xs text-neutral-600 hover:text-error-500 hover:bg-error-50 rounded-base transition-colors disabled:opacity-50"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {category.envelope_limit && (
                    <p className="text-small text-neutral-600">
                      Limite: {formatCurrency(category.envelope_limit)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Categorias do Sistema */}
      <Card>
        <div className="flex items-center gap-xs mb-md">
          <AlertCircle className="w-5 h-5 text-info-600" />
          <h2 className="text-h4 font-bold text-neutral-900">Categorias do Sistema</h2>
        </div>
        <p className="text-small text-neutral-600 mb-md">
          Estas categorias são padrão e não podem ser editadas ou deletadas.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {systemCategories.map((category) => {
            const typeInfo = CATEGORY_TYPES.find(t => t.value === category.category_type);
            return (
              <div
                key={category.id}
                className="p-md bg-neutral-50 rounded-base border border-neutral-200"
              >
                <div className="flex items-center gap-sm">
                  <div
                    className="w-10 h-10 rounded-base flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (category.color || typeInfo?.color || '#0066FF') + '20' }}
                  >
                    {renderIcon(category.icon || 'tag', 'w-5 h-5', { 
                      color: category.color || typeInfo?.color || '#0066FF' 
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-neutral-900 truncate">
                      {category.name}
                    </p>
                    <p className="text-small text-neutral-600 capitalize">
                      {typeInfo?.label}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-info-600 flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modal: Adicionar/Editar Categoria */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-sm z-50">
          <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="text-h4 font-bold text-neutral-900">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                }}
                className="p-xs text-neutral-600 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-md">
              <Input
                label="Nome da Categoria"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Supermercado"
                required
              />

              <div>
                <label className="block text-small font-medium text-neutral-700 mb-xs">
                  Tipo <span className="text-error-500">*</span>
                </label>
                <select
                  value={formData.category_type}
                  onChange={(e) => setFormData({ ...formData, category_type: e.target.value as any })}
                  className="w-full h-12 px-sm rounded-base border border-neutral-200 focus:ring-2 focus:ring-primary-500"
                >
                  {CATEGORY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-small font-medium text-neutral-700 mb-xs">
                  Ícone
                </label>
                <div className="grid grid-cols-8 gap-xs max-h-48 overflow-y-auto p-xs border border-neutral-200 rounded-base">
                  {ICONS.map((iconConfig) => {
                    const IconComponent = iconConfig.icon;
                    const isSelected = formData.icon === iconConfig.name;
                    return (
                      <button
                        key={iconConfig.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconConfig.name })}
                        className={`
                          w-10 h-10 rounded-base border-2 transition-all flex items-center justify-center
                          ${isSelected 
                            ? 'border-primary-500 bg-primary-50 scale-110' 
                            : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                          }
                        `}
                        title={iconConfig.label}
                      >
                        <IconComponent 
                          className="w-5 h-5" 
                          style={{ color: isSelected ? formData.color : '#666' }}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-neutral-500 mt-xs">
                  Ícone selecionado: {ICONS.find(i => i.name === formData.icon)?.label || 'Tag'}
                </p>
              </div>

              <div>
                <label className="block text-small font-medium text-neutral-700 mb-xs">
                  Cor
                </label>
                <div className="grid grid-cols-8 gap-xs max-h-48 overflow-y-auto p-xs border border-neutral-200 rounded-base">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`
                        w-10 h-10 rounded-base border-2 transition-all
                        ${formData.color === color ? 'border-neutral-900 scale-110 ring-2 ring-offset-2 ring-primary-500' : 'border-neutral-200 hover:border-neutral-400'}
                      `}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="mt-xs flex items-center gap-xs">
                  <div 
                    className="w-6 h-6 rounded-base border border-neutral-200"
                    style={{ backgroundColor: formData.color }}
                  />
                  <p className="text-xs text-neutral-500">
                    Cor selecionada: {formData.color}
                  </p>
                </div>
              </div>

              {/* Preview da Categoria */}
              <div className="p-md bg-neutral-50 rounded-base border border-neutral-200">
                <p className="text-small font-medium text-neutral-700 mb-xs">Preview:</p>
                <div className="flex items-center gap-sm">
                  <div
                    className="w-12 h-12 rounded-base flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: formData.color + '20' }}
                  >
                    {renderIcon(formData.icon, 'w-6 h-6', { color: formData.color })}
                  </div>
                  <div>
                    <p className="text-body font-semibold text-neutral-900">
                      {formData.name || 'Nome da Categoria'}
                    </p>
                    <p className="text-small text-neutral-600 capitalize">
                      {CATEGORY_TYPES.find(t => t.value === formData.category_type)?.label}
                    </p>
                  </div>
                </div>
              </div>

              <Input
                type="number"
                label="Limite do Envelope (opcional)"
                value={formData.envelope_limit || ''}
                onChange={(e) => setFormData({ ...formData, envelope_limit: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="0,00"
                step="0.01"
              />
            </div>

            <div className="flex gap-sm mt-lg pt-lg border-t border-neutral-200">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                }}
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
                fullWidth
              >
                <Save className="w-4 h-4" />
                {editingCategory ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Alert Modal */}
      <AlertComponent />
    </div>
  );
}

