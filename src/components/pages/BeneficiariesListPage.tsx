import React, { useState } from 'react';
import { Users, Search, Filter, Plus, Eye, Edit, Phone, MessageSquare, CheckCircle, Clock, AlertTriangle, Shield, UserCheck, Download, BadgeCheck, UserPlus, X, MapPin, DollarSign, Heart, RefreshCw, UserX, Hash, Send, Package } from 'lucide-react';
import { type Beneficiary, type SystemUser } from '../../data/mockData';
import { useBeneficiaries } from '../../hooks/useBeneficiaries';
import { useAuth } from '../../context/AuthContext';
import BeneficiaryProfileModal from '../BeneficiaryProfileModal';
import BeneficiaryForm from '../BeneficiaryForm';
import { Button, Card, Input, Badge, StatCard, Modal, ConfirmationModal } from '../ui';
import ExportBeneficiariesModal from '../modals/ExportBeneficiariesModal';
import { mockBeneficiaries } from '../../data/mockData';

interface BeneficiariesListPageProps {
  onNavigateToIndividualSend?: (beneficiaryId: string) => void;
  onNavigateToTasks?: (beneficiaryIds: string[]) => void;
}

export default function BeneficiariesListPage({ onNavigateToIndividualSend, onNavigateToTasks }: BeneficiariesListPageProps) {
  const { loggedInUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'message'>('add');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend';
    beneficiaryId: string;
    beneficiaryName: string;
  } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    governorate: '',
    city: '',
    district: '',
    familyStatus: '',
    familySize: '',
    ageGroup: '',
    economicLevel: '',
    displacementStatus: '',
    profession: '',
    healthStatus: '',
    medicalCondition: ''
  });
  
  // استخدام Hook المخصص
  const { 
    beneficiaries, 
    loading, 
    error, 
    statistics, 
    updateBeneficiary,
    refetch 
  } = useBeneficiaries({
    organizationId: loggedInUser?.associatedType === 'organization' ? loggedInUser.associatedId : undefined,
    familyId: loggedInUser?.associatedType === 'family' ? loggedInUser.associatedId : undefined,
    searchTerm,
    advancedFilters,
    identityStatusFilter: showVerifiedOnly ? 'verified' : 'all'
  });

  // Get unique values for dynamic dropdowns
  const governorates = [...new Set(mockBeneficiaries.map(b => b.detailedAddress.governorate))];
  const cities = [...new Set(mockBeneficiaries
    .filter(b => !advancedFilters.governorate || b.detailedAddress.governorate === advancedFilters.governorate)
    .map(b => b.detailedAddress.city))];
  const districts = [...new Set(mockBeneficiaries
    .filter(b => 
      (!advancedFilters.governorate || b.detailedAddress.governorate === advancedFilters.governorate) &&
      (!advancedFilters.city || b.detailedAddress.city === advancedFilters.city)
    )
    .map(b => b.detailedAddress.district))];

  const handleAdvancedFilterChange = (field: string, value: string) => {
    setAdvancedFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      
      // Reset dependent filters when parent changes
      if (field === 'governorate') {
        newFilters.city = '';
        newFilters.district = '';
      } else if (field === 'city') {
        newFilters.district = '';
      }
      
      return newFilters;
    });
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({
      governorate: '',
      city: '',
      district: '',
      familyStatus: '',
      familySize: '',
      ageGroup: '',
      economicLevel: '',
      displacementStatus: '',
      profession: '',
      healthStatus: '',
      medicalCondition: ''
    });
  };

  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  const getActiveFiltersCount = () => {
    const filtersCount = Object.values(advancedFilters).filter(value => value !== '').length;
    return filtersCount + (showVerifiedOnly ? 1 : 0);
  };

  const getActiveFilters = () => {
    const activeFilters = [];
    const filterLabels: { [key: string]: string } = {
      governorate: 'المحافظة',
      city: 'المدينة',
      district: 'الحي',
      familyStatus: 'الحالة العائلية',
      familySize: 'حجم الأسرة',
      ageGroup: 'الفئة العمرية',
      economicLevel: 'المستوى الاقتصادي',
      displacementStatus: 'حالة النزوح',
      profession: 'المهنة',
      healthStatus: 'الحالة الصحية',
      medicalCondition: 'الحالة الطبية'
    };

    Object.entries(advancedFilters).forEach(([key, value]) => {
      if (value) {
        activeFilters.push({
          key,
          label: filterLabels[key],
          value: getFilterDisplayValue(key, value)
        });
      }
    });

    if (showVerifiedOnly) {
      activeFilters.push({
        key: 'verified_only',
        label: 'الحسابات الموثقة فقط',
        value: 'مفعل'
      });
    }
    return activeFilters;
  };

  const getFilterDisplayValue = (key: string, value: string): string => {
    const displayValues: { [key: string]: { [value: string]: string } } = {
      familyStatus: {
        'head_of_family': 'رب أسرة',
        'spouse': 'زوج/زوجة',
        'child': 'ابن/ابنة',
        'orphan_guardian': 'معيل أيتام',
        'family_with_orphans': 'أسرة لديها أيتام',
        'elderly': 'كبير سن',
        'disabled': 'من ذوي الاحتياجات الخاصة'
      },
      familySize: {
        'small': 'صغيرة (1-3 أفراد)',
        'medium': 'متوسطة (4-7 أفراد)',
        'large': 'كبيرة (8+ أفراد)'
      },
      ageGroup: {
        'child': 'طفل (أقل من 18)',
        'adult': 'بالغ (18-60)',
        'elderly': 'كبير سن (60+)'
      },
      economicLevel: {
        'very_poor': 'فقير جداً',
        'poor': 'فقير',
        'moderate': 'متوسط',
        'good': 'ميسور'
      },
      displacementStatus: {
        'displaced': 'نازح',
        'not_displaced': 'غير نازح',
        'returnee': 'عائد لمنزله'
      },
      healthStatus: {
        'has_medical': 'لديه حالة مرضية',
        'diabetes': 'مرض السكري',
        'hypertension': 'ضغط الدم',
        'disability': 'إعاقة',
        'chronic': 'مرض مزمن',
        'healthy': 'سليم'
      }
    };
    
    return displayValues[key]?.[value] || value;
  };

  const removeAdvancedFilter = (filterKey: string) => {
    if (filterKey === 'verified_only') {
      setShowVerifiedOnly(false);
    } else {
      setAdvancedFilters(prev => ({
        ...prev,
        [filterKey]: ''
      }));
    }
  };
  const handleViewBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowDetailsModal(true);
  };

  const handleEditBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setModalType('edit');
    setShowModal(true);
  };

  const handleSendMessage = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setModalType('message');
    setShowModal(true);
  };

  const handleCall = (phone: string) => {
    if (confirm(`هل تريد الاتصال بالرقم ${phone}؟`)) {
      window.open(`tel:${phone}`);
    }
  };

  const handleSuspendBeneficiary = (beneficiary: Beneficiary) => {
    setConfirmAction({
      type: 'suspend',
      beneficiaryId: beneficiary.id,
      beneficiaryName: beneficiary.name
    });
    setShowConfirmModal(true);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    
    try {
      if (confirmAction.type === 'suspend') {
        // تحديث حالة المستفيد إلى موقوف
        await updateBeneficiary(confirmAction.beneficiaryId, {
          status: 'suspended',
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin'
        });
        
        // تحديث البيانات الوهمية مباشرة للعرض الفوري
        const beneficiaryIndex = mockBeneficiaries.findIndex(b => b.id === confirmAction.beneficiaryId);
        if (beneficiaryIndex !== -1) {
          mockBeneficiaries[beneficiaryIndex].status = 'suspended';
          mockBeneficiaries[beneficiaryIndex].updatedAt = new Date().toISOString();
        }
        
        // إعادة تحميل البيانات
        refetch();
      }
    } catch (error) {
      console.error('خطأ في تنفيذ الإجراء:', error);
    }
  };

  const getConfirmationMessage = () => {
    if (!confirmAction) return { title: '', message: '', confirmText: '', variant: 'primary' as const };
    
    if (confirmAction.type === 'suspend') {
      return {
        title: 'تأكيد تعليق حساب المستفيد',
        message: `هل أنت متأكد من تعليق حساب المستفيد "${confirmAction.beneficiaryName}"؟\n\nعند تعليق الحساب:\n• سيتم إيقاف جميع الخدمات للمستفيد\n• لن يتمكن من استلام طرود جديدة\n• ستبقى بياناته محفوظة للمراجعة\n• يمكن إعادة تفعيل الحساب لاحقاً\n\nيمكن مراجعة الحساب وإعادة تفعيله في أي وقت.`,
        confirmText: 'تعليق الحساب',
        variant: 'warning' as const
      };
    }
    
    return { title: '', message: '', confirmText: '', variant: 'primary' as const };
  };

  // Pagination calculations
  const totalPages = Math.ceil(beneficiaries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBeneficiaries = beneficiaries.slice(startIndex, endIndex);

  // Update bulk actions visibility
  React.useEffect(() => {
    setShowBulkActions(selectedBeneficiaries.length > 0);
  }, [selectedBeneficiaries]);

  const handleSelectBeneficiary = (beneficiaryId: string) => {
    setSelectedBeneficiaries(prev => 
      prev.includes(beneficiaryId) 
        ? prev.filter(id => id !== beneficiaryId)
        : [...prev, beneficiaryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBeneficiaries.length === paginatedBeneficiaries.length) {
      setSelectedBeneficiaries([]);
    } else {
      setSelectedBeneficiaries(paginatedBeneficiaries.map(b => b.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedBeneficiaries([]);
  };

  const handleBulkExport = () => {
    const selectedBeneficiariesData = beneficiaries.filter(b => selectedBeneficiaries.includes(b.id));
    // Open export modal with selected beneficiaries
    setShowExportModal(true);
  };

  const handleSendToTasks = () => {
    if (selectedBeneficiaries.length === 0) {
      alert('يرجى تحديد مستفيدين أولاً');
      return;
    }
    
    if (onNavigateToTasks) {
      onNavigateToTasks(selectedBeneficiaries);
    } else {
      alert(`تم تحديد ${selectedBeneficiaries.length} مستفيد لإرسالهم إلى صفحة المهام`);
    }
  };

  const handleExportBeneficiaries = () => {
    if (selectedBeneficiaries.length > 0) {
      // Export only selected beneficiaries
      handleBulkExport();
    } else {
      // Export all filtered beneficiaries
      setShowExportModal(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIdentityColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      <Card className="bg-blue-50 border-blue-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">البيانات الوهمية محملة ({beneficiaries.length} مستفيد)</span>
        </div>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3 space-x-reverse">
          {selectedBeneficiaries.length > 0 && (
            <Badge variant="info" className="px-3 py-2">
              {selectedBeneficiaries.length} مستفيد محدد
            </Badge>
          )}
          <Button 
            variant="success" 
            icon={Download} 
            iconPosition="right"
            onClick={handleExportBeneficiaries}
          >
            {selectedBeneficiaries.length > 0 ? `تصدير المحدد (${selectedBeneficiaries.length})` : 'تصدير القائمة'}
          </Button>
          <Button 
            variant="primary"
            icon={Plus}
            iconPosition="right"
            onClick={() => {
              setModalType('add');
              setSelectedBeneficiary(null);
              setShowModal(true);
            }}
          >
            إضافة مستفيد جديد
          </Button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {showBulkActions && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                تم تحديد {selectedBeneficiaries.length} مستفيد
              </span>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                iconPosition="right"
                onClick={handleSendToTasks}
              >
                إرسال إلى المهام ({selectedBeneficiaries.length})
              </Button>
              <Button
                variant="success"
                size="sm"
                icon={Download}
                iconPosition="right"
                onClick={handleBulkExport}
              >
                تصدير المحدد ({selectedBeneficiaries.length})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={X}
                onClick={handleClearSelection}
              >
                إلغاء التحديد
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <div className="grid md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-8">
            <Input
              placeholder="البحث في المستفيدين (الاسم، رقم الهوية، الهاتف)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <div className="md:col-span-4">
            <Button
              variant="secondary" 
              icon={Filter} 
              iconPosition="right"
              onClick={toggleAdvancedFilters}
              className="w-full"
            >
              فلترة متقدمة {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
            </Button>
          </div>
        </div>
        
        {/* Advanced Filters Section */}
        {showAdvancedFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Filter className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">الفلاتر المتقدمة</h3>
                </div>
                <Button
                  variant="ghost"
                  icon={X}
                  onClick={toggleAdvancedFilters}
                  className="p-2"
                />
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Geographic Filters */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <MapPin className="w-4 h-4 ml-2 text-green-600" />
                    الفلاتر الجغرافية
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                      <select
                        value={advancedFilters.governorate}
                        onChange={(e) => handleAdvancedFilterChange('governorate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع المحافظات</option>
                        {governorates.map(gov => (
                          <option key={gov} value={gov}>{gov}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
                      <select
                        value={advancedFilters.city}
                        onChange={(e) => handleAdvancedFilterChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={!advancedFilters.governorate}
                      >
                        <option value="">
                          {advancedFilters.governorate ? 'جميع المدن' : 'اختر المحافظة أولاً'}
                        </option>
                        {cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الحي</label>
                      <select
                        value={advancedFilters.district}
                        onChange={(e) => handleAdvancedFilterChange('district', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={!advancedFilters.city}
                      >
                        <option value="">
                          {advancedFilters.city ? 'جميع الأحياء' : 'اختر المدينة أولاً'}
                        </option>
                        {districts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Family and Social Status Filters */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="w-4 h-4 ml-2 text-purple-600" />
                    الحالة العائلية والاجتماعية
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الحالة العائلية</label>
                      <select
                        value={advancedFilters.familyStatus}
                        onChange={(e) => handleAdvancedFilterChange('familyStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع الحالات</option>
                        <option value="head_of_family">رب أسرة</option>
                        <option value="spouse">زوج/زوجة</option>
                        <option value="child">ابن/ابنة</option>
                        <option value="orphan_guardian">معيل أيتام</option>
                        <option value="family_with_orphans">أسرة لديها أيتام</option>
                        <option value="elderly">كبير سن</option>
                        <option value="disabled">من ذوي الاحتياجات الخاصة</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">حجم الأسرة</label>
                      <select
                        value={advancedFilters.familySize}
                        onChange={(e) => handleAdvancedFilterChange('familySize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع الأحجام</option>
                        <option value="small">صغيرة (1-3 أفراد)</option>
                        <option value="medium">متوسطة (4-7 أفراد)</option>
                        <option value="large">كبيرة (8+ أفراد)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الفئة العمرية</label>
                      <select
                        value={advancedFilters.ageGroup}
                        onChange={(e) => handleAdvancedFilterChange('ageGroup', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع الأعمار</option>
                        <option value="child">طفل (أقل من 18)</option>
                        <option value="adult">بالغ (18-60)</option>
                        <option value="elderly">كبير سن (60+)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Economic and Social Status Filters */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 ml-2 text-orange-600" />
                    الحالة الاقتصادية والاجتماعية
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المستوى الاقتصادي</label>
                      <select
                        value={advancedFilters.economicLevel}
                        onChange={(e) => handleAdvancedFilterChange('economicLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع المستويات</option>
                        <option value="very_poor">فقير جداً</option>
                        <option value="poor">فقير</option>
                        <option value="moderate">متوسط</option>
                        <option value="good">ميسور</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">حالة النزوح</label>
                      <select
                        value={advancedFilters.displacementStatus}
                        onChange={(e) => handleAdvancedFilterChange('displacementStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع الحالات</option>
                        <option value="displaced">نازح</option>
                        <option value="not_displaced">غير نازح</option>
                        <option value="returnee">عائد لمنزله</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المهنة</label>
                      <input
                        type="text"
                        placeholder="مثال: عامل، طبيب، مدرس..."
                        value={advancedFilters.profession}
                        onChange={(e) => handleAdvancedFilterChange('profession', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Health Status Filters */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Heart className="w-4 h-4 ml-2 text-red-600" />
                    الحالة الصحية
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الحالة الصحية</label>
                      <select
                        value={advancedFilters.healthStatus}
                        onChange={(e) => handleAdvancedFilterChange('healthStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">جميع الحالات</option>
                        <option value="has_medical">لديه حالة مرضية</option>
                        <option value="diabetes">مرض السكري</option>
                        <option value="hypertension">ضغط الدم</option>
                        <option value="disability">إعاقة</option>
                        <option value="chronic">مرض مزمن</option>
                        <option value="healthy">سليم</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">حالة طبية محددة</label>
                      <input
                        type="text"
                        placeholder="مثال: سكري، ضغط، ربو..."
                        value={advancedFilters.medicalCondition}
                        onChange={(e) => handleAdvancedFilterChange('medicalCondition', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
        
              {/* Filter Actions */}
              <div className="flex space-x-3 space-x-reverse justify-center mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant={showVerifiedOnly ? "success" : "secondary"}
                  icon={BadgeCheck}
                  iconPosition="right"
                  onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                >
                  الحسابات الموثقة فقط
                </Button>
                <Button
                  variant="secondary"
                  icon={RefreshCw}
                  iconPosition="right"
                  onClick={handleClearAdvancedFilters}
                >
                  مسح الفلاتر
                </Button>
                <Button
                  variant="primary"
                  icon={CheckCircle}
                  iconPosition="right"
                  onClick={toggleAdvancedFilters}
                >
                  إخفاء الفلاتر
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">الفلاتر النشطة:</h4>
            <div className="flex flex-wrap gap-2">
              {getActiveFilters().map((filter) => (
                <Badge
                  key={filter.key}
                  variant="info"
                  size="sm"
                  className="flex items-center space-x-1 space-x-reverse"
                >
                  <span>{filter.label}: {filter.value}</span>
                  <button
                    onClick={() => removeAdvancedFilter(filter.key)}
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                iconPosition="right"
                onClick={handleClearAdvancedFilters}
                className="text-xs"
              >
                مسح الكل
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Beneficiaries Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">قائمة المستفيدين</h3>
            
            {/* Data Source Badge */}
            <div className="flex items-center justify-center space-x-2 space-x-reverse mb-3">
              <div className="bg-blue-100 p-1.5 rounded-lg">
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                البيانات الوهمية
              </span>
            </div>
            
            {/* Count Display */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm inline-block">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">المعروض حالياً</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {startIndex + 1}-{Math.min(endIndex, beneficiaries.length)}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">إجمالي المفلترين</p>
                  <p className="text-2xl font-bold text-green-600">{beneficiaries.length}</p>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">إجمالي النظام</p>
                  <p className="text-2xl font-bold text-purple-600">{mockBeneficiaries.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedBeneficiaries.length === paginatedBeneficiaries.length && paginatedBeneficiaries.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستفيد
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الهوية
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الهاتف
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المنطقة
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    آخر استلام
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedBeneficiaries.length > 0 ? (
                  paginatedBeneficiaries.map((beneficiary, index) => (
                    <tr key={beneficiary.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedBeneficiaries.includes(beneficiary.id)}
                          onChange={() => handleSelectBeneficiary(beneficiary.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="bg-gray-100 text-gray-600 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold">
                          {startIndex + index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg ml-4">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="text-sm font-medium text-gray-900">{beneficiary.name}</span>
                              {beneficiary.identityStatus === 'verified' && (
                                <BadgeCheck className="w-4 h-4 text-green-600" title="موثق" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {beneficiary.detailedAddress?.city || 'غير محدد'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.nationalId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.detailedAddress?.district || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <Badge 
                            variant={
                              beneficiary.identityStatus === 'verified' ? 'success' :
                              beneficiary.identityStatus === 'pending' ? 'warning' : 'error'
                            }
                            size="sm"
                          >
                            {beneficiary.identityStatus === 'verified' ? 'موثق' :
                             beneficiary.identityStatus === 'pending' ? 'بانتظار التوثيق' : 'مرفوض التوثيق'}
                          </Badge>
                          <Badge 
                            variant={
                              beneficiary.status === 'active' ? 'success' :
                              beneficiary.status === 'pending' ? 'warning' : 'error'
                            }
                            size="sm"
                          >
                            {beneficiary.status === 'active' ? 'نشط' :
                             beneficiary.status === 'pending' ? 'معلق' : 'متوقف'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.lastReceived ? new Date(beneficiary.lastReceived).toLocaleDateString('en-CA') : 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button 
                            onClick={() => handleViewBeneficiary(beneficiary)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditBeneficiary(beneficiary)}
                            className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors" 
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleSendMessage(beneficiary)}
                            className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors" 
                            title="إرسال رسالة"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleCall(beneficiary.phone)}
                            className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-50 transition-colors" 
                            title="اتصال"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleSuspendBeneficiary(beneficiary)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors" 
                            title="تعليق الحساب"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">لا توجد بيانات مستفيدين</p>
                        <p className="text-sm mt-2">
                          {searchTerm ? 'لا توجد نتائج للبحث' : 'لم يتم إضافة أي مستفيدين بعد'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                عرض {startIndex + 1}-{Math.min(endIndex, beneficiaries.length)} من {beneficiaries.length} مستفيد
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                
                <div className="flex space-x-1 space-x-reverse">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Beneficiary Details Modal */}
      {showDetailsModal && selectedBeneficiary && (
        <BeneficiaryProfileModal
          beneficiary={selectedBeneficiary}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBeneficiary(null);
          }}
          onNavigateToIndividualSend={onNavigateToIndividualSend}
          onEditBeneficiary={handleEditBeneficiary}
          onSuspendBeneficiary={(beneficiaryId, beneficiaryName) => {
            setShowDetailsModal(false);
            // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
            alert(`تم تعليق حساب المستفيد: ${beneficiaryName}`);
          }}
        />
      )}

      {/* Add/Edit/Message Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'add' ? 'إضافة مستفيد جديد' :
            modalType === 'edit' ? 'تعديل بيانات المستفيد' :
            'إرسال رسالة'
          }
          size="lg"
        >
            <div className="text-center py-12">
              {(modalType === 'add' || modalType === 'edit') ? (
                <BeneficiaryForm
                  beneficiary={modalType === 'edit' ? selectedBeneficiary : null}
                  onSave={() => {
                    refetch();
                    setShowModal(false);
                    setSelectedBeneficiary(null);
                  }}
                  onCancel={() => {
                    setShowModal(false);
                    setSelectedBeneficiary(null);
                  }}
                />
              ) : (
                <>
                  <div className="bg-gray-100 rounded-xl p-8 mb-4">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">نموذج إرسال رسالة</p>
                    <p className="text-sm text-gray-500 mt-2">سيتم تطوير نموذج الرسائل هنا</p>
                  </div>
                  
                  <div className="flex space-x-3 space-x-reverse justify-center">
                    <Button
                      variant="secondary"
                      onClick={() => setShowModal(false)}
                    >
                      إلغاء
                    </Button>
                    <Button variant="primary">
                      إرسال الرسالة
                    </Button>
                  </div>
                </>
              )}
            </div>
        </Modal>
      )}

      {/* Confirmation Modal for Suspend Action */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        onConfirm={executeConfirmedAction}
        title={getConfirmationMessage().title}
        message={getConfirmationMessage().message}
        confirmButtonText={getConfirmationMessage().confirmText}
        confirmButtonVariant={getConfirmationMessage().variant}
        type="warning"
      />

      {/* Export Modal */}
      {showExportModal && (
        <Modal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="تصدير قائمة المستفيدين"
          size="lg"
        >
          <ExportBeneficiariesModal
            beneficiaries={selectedBeneficiaries.length > 0 ? beneficiaries.filter(b => selectedBeneficiaries.includes(b.id)) : beneficiaries}
            activeFilters={getActiveFilters()}
            onClose={() => setShowExportModal(false)}
          />
        </Modal>
      )}

    </div>
  );
}