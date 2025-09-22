import React, { useState } from 'react';
import { Download, CheckCircle, X, Users, FileText, Calendar, MapPin, Phone, Hash, BadgeCheck, Heart, DollarSign, Activity } from 'lucide-react';
import { type Beneficiary } from '../../data/mockData';
import { Button, Card, Badge } from '../ui';

interface ExportBeneficiariesModalProps {
  beneficiaries: Beneficiary[];
  activeFilters: Array<{ key: string; label: string; value: string }>;
  onClose: () => void;
}

interface ExportField {
  key: string;
  label: string;
  description: string;
  category: string;
  selected: boolean;
}

export default function ExportBeneficiariesModal({ 
  beneficiaries, 
  activeFilters, 
  onClose 
}: ExportBeneficiariesModalProps) {
  const [exportFields, setExportFields] = useState<ExportField[]>([
    // Basic Information
    { key: 'name', label: 'الاسم', description: 'الاسم الأول للمستفيد', category: 'basic', selected: true },
    { key: 'fullName', label: 'الاسم الكامل', description: 'الاسم الكامل للمستفيد', category: 'basic', selected: true },
    { key: 'nationalId', label: 'رقم الهوية', description: 'رقم الهوية الوطنية', category: 'basic', selected: true },
    { key: 'phone', label: 'رقم الهاتف', description: 'رقم الهاتف المحمول', category: 'basic', selected: true },
    { key: 'dateOfBirth', label: 'تاريخ الميلاد', description: 'تاريخ ميلاد المستفيد', category: 'basic', selected: false },
    { key: 'gender', label: 'الجنس', description: 'ذكر أو أنثى', category: 'basic', selected: false },
    
    // Address Information
    { key: 'governorate', label: 'المحافظة', description: 'المحافظة التي يقيم فيها', category: 'address', selected: true },
    { key: 'city', label: 'المدينة', description: 'المدينة أو المخيم', category: 'address', selected: true },
    { key: 'district', label: 'الحي', description: 'الحي أو المنطقة', category: 'address', selected: true },
    { key: 'street', label: 'الشارع', description: 'اسم الشارع', category: 'address', selected: false },
    { key: 'fullAddress', label: 'العنوان الكامل', description: 'العنوان المفصل كاملاً', category: 'address', selected: false },
    
    // Family Information
    { key: 'maritalStatus', label: 'الحالة الاجتماعية', description: 'أعزب، متزوج، مطلق، أرمل', category: 'family', selected: false },
    { key: 'membersCount', label: 'عدد أفراد الأسرة', description: 'عدد الأفراد المعالين', category: 'family', selected: true },
    { key: 'relationToFamily', label: 'صلة القرابة', description: 'العلاقة بالعائلة (إن وجدت)', category: 'family', selected: false },
    { key: 'isHeadOfFamily', label: 'رب الأسرة', description: 'هل هو رب الأسرة أم لا', category: 'family', selected: false },
    { key: 'childrenCount', label: 'عدد الأطفال', description: 'عدد الأطفال في الأسرة', category: 'family', selected: false },
    
    // Economic Information
    { key: 'profession', label: 'المهنة', description: 'مهنة المستفيد', category: 'economic', selected: false },
    { key: 'economicLevel', label: 'المستوى الاقتصادي', description: 'فقير جداً، فقير، متوسط، ميسور', category: 'economic', selected: false },
    
    // Health Information
    { key: 'medicalConditions', label: 'الحالات المرضية', description: 'قائمة الأمراض المزمنة', category: 'health', selected: false },
    { key: 'hasDisability', label: 'وجود إعاقة', description: 'هل يعاني من إعاقة', category: 'health', selected: false },
    
    // System Information
    { key: 'identityStatus', label: 'حالة التوثيق', description: 'موثق، بانتظار التوثيق، مرفوض', category: 'system', selected: true },
    { key: 'status', label: 'حالة الحساب', description: 'نشط، معلق، موقوف', category: 'system', selected: true },
    { key: 'eligibilityStatus', label: 'حالة الأهلية', description: 'مؤهل، تحت المراجعة، مرفوض', category: 'system', selected: false },
    { key: 'totalPackages', label: 'إجمالي الطرود', description: 'عدد الطرود المستلمة', category: 'system', selected: false },
    { key: 'lastReceived', label: 'آخر استلام', description: 'تاريخ آخر طرد مستلم', category: 'system', selected: true },
    { key: 'createdAt', label: 'تاريخ التسجيل', description: 'تاريخ إضافة المستفيد للنظام', category: 'system', selected: false },
    { key: 'notes', label: 'الملاحظات', description: 'ملاحظات خاصة بالمستفيد', category: 'system', selected: false }
  ]);

  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'excel'>('json');
  const [includeStatistics, setIncludeStatistics] = useState(true);

  const categories = [
    { id: 'basic', name: 'المعلومات الأساسية', icon: Users, color: 'blue' },
    { id: 'address', name: 'معلومات العنوان', icon: MapPin, color: 'green' },
    { id: 'family', name: 'المعلومات العائلية', icon: Heart, color: 'purple' },
    { id: 'economic', name: 'المعلومات الاقتصادية', icon: DollarSign, color: 'orange' },
    { id: 'health', name: 'المعلومات الصحية', icon: Activity, color: 'red' },
    { id: 'system', name: 'معلومات النظام', icon: FileText, color: 'gray' }
  ];

  const handleFieldToggle = (fieldKey: string) => {
    setExportFields(prev => 
      prev.map(field => 
        field.key === fieldKey 
          ? { ...field, selected: !field.selected }
          : field
      )
    );
  };

  const handleCategoryToggle = (categoryId: string) => {
    const categoryFields = exportFields.filter(field => field.category === categoryId);
    const allSelected = categoryFields.every(field => field.selected);
    
    setExportFields(prev => 
      prev.map(field => 
        field.category === categoryId 
          ? { ...field, selected: !allSelected }
          : field
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = exportFields.every(field => field.selected);
    setExportFields(prev => 
      prev.map(field => ({ ...field, selected: !allSelected }))
    );
  };

  const getSelectedFieldsCount = () => {
    return exportFields.filter(field => field.selected).length;
  };

  const getCategorySelectedCount = (categoryId: string) => {
    const categoryFields = exportFields.filter(field => field.category === categoryId);
    const selectedCount = categoryFields.filter(field => field.selected).length;
    return `${selectedCount}/${categoryFields.length}`;
  };

  const handleExport = () => {
    const selectedFields = exportFields.filter(field => field.selected);
    
    if (selectedFields.length === 0) {
      alert('يرجى اختيار حقل واحد على الأقل للتصدير');
      return;
    }

    // إنشاء البيانات للتصدير
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalBeneficiaries: beneficiaries.length,
        exportedFields: selectedFields.length,
        format: exportFormat,
        activeFilters: activeFilters.length > 0 ? activeFilters : null,
        includeStatistics
      },
      statistics: includeStatistics ? {
        total: beneficiaries.length,
        verified: beneficiaries.filter(b => b.identityStatus === 'verified').length,
        pending: beneficiaries.filter(b => b.identityStatus === 'pending').length,
        rejected: beneficiaries.filter(b => b.identityStatus === 'rejected').length,
        active: beneficiaries.filter(b => b.status === 'active').length,
        suspended: beneficiaries.filter(b => b.status === 'suspended').length,
        byGovernorate: getGovernorateStats(),
        byEconomicLevel: getEconomicLevelStats()
      } : null,
      beneficiaries: beneficiaries.map((beneficiary, index) => {
        const exportedBeneficiary: any = {
          rowNumber: index + 1
        };

        selectedFields.forEach(field => {
          switch (field.key) {
            case 'name':
              exportedBeneficiary.name = beneficiary.name;
              break;
            case 'fullName':
              exportedBeneficiary.fullName = beneficiary.fullName;
              break;
            case 'nationalId':
              exportedBeneficiary.nationalId = beneficiary.nationalId;
              break;
            case 'phone':
              exportedBeneficiary.phone = beneficiary.phone;
              break;
            case 'dateOfBirth':
              exportedBeneficiary.dateOfBirth = beneficiary.dateOfBirth;
              break;
            case 'gender':
              exportedBeneficiary.gender = beneficiary.gender === 'male' ? 'ذكر' : 'أنثى';
              break;
            case 'governorate':
              exportedBeneficiary.governorate = beneficiary.detailedAddress.governorate;
              break;
            case 'city':
              exportedBeneficiary.city = beneficiary.detailedAddress.city;
              break;
            case 'district':
              exportedBeneficiary.district = beneficiary.detailedAddress.district;
              break;
            case 'street':
              exportedBeneficiary.street = beneficiary.detailedAddress.street;
              break;
            case 'fullAddress':
              exportedBeneficiary.fullAddress = `${beneficiary.detailedAddress.governorate} - ${beneficiary.detailedAddress.city} - ${beneficiary.detailedAddress.district} - ${beneficiary.detailedAddress.street}`;
              break;
            case 'maritalStatus':
              const maritalStatusMap = {
                'single': 'أعزب',
                'married': 'متزوج',
                'divorced': 'مطلق',
                'widowed': 'أرمل'
              };
              exportedBeneficiary.maritalStatus = maritalStatusMap[beneficiary.maritalStatus] || beneficiary.maritalStatus;
              break;
            case 'membersCount':
              exportedBeneficiary.membersCount = beneficiary.membersCount;
              break;
            case 'relationToFamily':
              exportedBeneficiary.relationToFamily = beneficiary.relationToFamily || 'غير محدد';
              break;
            case 'isHeadOfFamily':
              exportedBeneficiary.isHeadOfFamily = beneficiary.isHeadOfFamily ? 'نعم' : 'لا';
              break;
            case 'childrenCount':
              exportedBeneficiary.childrenCount = beneficiary.childrenIds?.length || 0;
              break;
            case 'profession':
              exportedBeneficiary.profession = beneficiary.profession;
              break;
            case 'economicLevel':
              const economicLevelMap = {
                'very_poor': 'فقير جداً',
                'poor': 'فقير',
                'moderate': 'متوسط',
                'good': 'ميسور'
              };
              exportedBeneficiary.economicLevel = economicLevelMap[beneficiary.economicLevel] || beneficiary.economicLevel;
              break;
            case 'medicalConditions':
              exportedBeneficiary.medicalConditions = beneficiary.medicalConditions?.join(', ') || 'لا توجد';
              break;
            case 'hasDisability':
              exportedBeneficiary.hasDisability = beneficiary.medicalConditions?.length > 0 ? 'نعم' : 'لا';
              break;
            case 'identityStatus':
              const identityStatusMap = {
                'verified': 'موثق',
                'pending': 'بانتظار التوثيق',
                'rejected': 'مرفوض التوثيق'
              };
              exportedBeneficiary.identityStatus = identityStatusMap[beneficiary.identityStatus] || beneficiary.identityStatus;
              break;
            case 'status':
              const statusMap = {
                'active': 'نشط',
                'pending': 'معلق',
                'suspended': 'موقوف'
              };
              exportedBeneficiary.status = statusMap[beneficiary.status] || beneficiary.status;
              break;
            case 'eligibilityStatus':
              const eligibilityStatusMap = {
                'eligible': 'مؤهل',
                'under_review': 'تحت المراجعة',
                'rejected': 'مرفوض'
              };
              exportedBeneficiary.eligibilityStatus = eligibilityStatusMap[beneficiary.eligibilityStatus] || beneficiary.eligibilityStatus;
              break;
            case 'totalPackages':
              exportedBeneficiary.totalPackages = beneficiary.totalPackages;
              break;
            case 'lastReceived':
              exportedBeneficiary.lastReceived = beneficiary.lastReceived;
              break;
            case 'createdAt':
              exportedBeneficiary.createdAt = new Date(beneficiary.createdAt).toLocaleDateString('ar-SA');
              break;
            case 'notes':
              exportedBeneficiary.notes = beneficiary.notes || 'لا توجد ملاحظات';
              break;
          }
        });

        return exportedBeneficiary;
      })
    };

    // تصدير البيانات
    const fileName = `قائمة_المستفيدين_${new Date().toISOString().split('T')[0]}`;
    
    if (exportFormat === 'json') {
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'csv') {
      // إنشاء CSV
      const selectedFieldKeys = selectedFields.map(f => f.key);
      const headers = selectedFields.map(f => f.label);
      
      let csvContent = headers.join(',') + '\n';
      
      exportData.beneficiaries.forEach(beneficiary => {
        const row = selectedFieldKeys.map(key => {
          const value = beneficiary[key] || '';
          // تنظيف القيم للـ CSV
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvContent += row.join(',') + '\n';
      });
      
      const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }

    alert(`تم تصدير ${beneficiaries.length} مستفيد بصيغة ${exportFormat.toUpperCase()} بنجاح!`);
    onClose();
  };

  const getGovernorateStats = () => {
    const stats: { [key: string]: number } = {};
    beneficiaries.forEach(b => {
      const gov = b.detailedAddress.governorate;
      stats[gov] = (stats[gov] || 0) + 1;
    });
    return stats;
  };

  const getEconomicLevelStats = () => {
    const stats: { [key: string]: number } = {};
    beneficiaries.forEach(b => {
      stats[b.economicLevel] = (stats[b.economicLevel] || 0) + 1;
    });
    return stats;
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : FileText;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
      gray: 'bg-gray-100 text-gray-600'
    };
    return category ? colorClasses[category.color as keyof typeof colorClasses] : 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Export Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-center space-x-3 space-x-reverse mb-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">تصدير قائمة المستفيدين</h3>
            <p className="text-gray-600">اختر الحقول والتنسيق المطلوب للتصدير</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">عدد المستفيدين</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{beneficiaries.length}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">الحقول المحددة</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{getSelectedFieldsCount()}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-gray-900">تنسيق التصدير</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{exportFormat.toUpperCase()}</p>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">الفلاتر المطبقة على التصدير:</h4>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Badge key={filter.key} variant="info" size="sm">
                  {filter.label}: {filter.value}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export Format Selection */}
      <Card>
        <h4 className="font-medium text-gray-900 mb-4">تنسيق التصدير</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div
            onClick={() => setExportFormat('json')}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              exportFormat === 'json'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h5 className="font-medium text-gray-900">JSON</h5>
              <p className="text-sm text-gray-600">ملف JSON مع جميع التفاصيل</p>
            </div>
          </div>

          <div
            onClick={() => setExportFormat('csv')}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              exportFormat === 'csv'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h5 className="font-medium text-gray-900">CSV</h5>
              <p className="text-sm text-gray-600">ملف CSV لفتحه في Excel</p>
            </div>
          </div>

          <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-50">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <h5 className="font-medium text-gray-500">Excel</h5>
              <p className="text-sm text-gray-500">قريباً</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              checked={includeStatistics}
              onChange={(e) => setIncludeStatistics(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">تضمين الإحصائيات في التصدير</span>
          </label>
        </div>
      </Card>

      {/* Fields Selection */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-medium text-gray-900">اختيار الحقول للتصدير</h4>
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSelectAll}
            >
              {exportFields.every(field => field.selected) ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
            </Button>
            <Badge variant="info">
              {getSelectedFieldsCount()} حقل محدد
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map(category => {
            const IconComponent = category.icon;
            const categoryFields = exportFields.filter(field => field.category === category.id);
            const allSelected = categoryFields.every(field => field.selected);
            
            return (
              <div key={category.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(category.id)}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <h5 className="font-medium text-gray-900">{category.name}</h5>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Badge variant="neutral" size="sm">
                      {getCategorySelectedCount(category.id)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCategoryToggle(category.id)}
                    >
                      {allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {categoryFields.map(field => (
                    <label
                      key={field.key}
                      className="flex items-start space-x-3 space-x-reverse p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={field.selected}
                        onChange={() => handleFieldToggle(field.key)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{field.label}</div>
                        <div className="text-xs text-gray-600">{field.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Export Actions */}
      <div className="flex space-x-3 space-x-reverse justify-end pt-4 border-t border-gray-200">
        <Button
          variant="secondary"
          onClick={onClose}
        >
          إلغاء
        </Button>
        <Button
          variant="primary"
          icon={Download}
          iconPosition="right"
          onClick={handleExport}
          disabled={getSelectedFieldsCount() === 0}
        >
          تصدير ({beneficiaries.length} مستفيد)
        </Button>
      </div>
    </div>
  );
}