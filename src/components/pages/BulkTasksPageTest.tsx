import React, { useState, useEffect } from 'react';
import { Send, Users, Package, Building2, Heart, Search, Filter, Plus, Eye, Edit, Trash2, CheckCircle, Clock, AlertTriangle, Download, RefreshCw, Upload, FileText, X, Calendar, MapPin, Phone, Star, UserPlus, Activity, BarChart3, TrendingUp } from 'lucide-react';
import { 
  mockBeneficiaries, 
  mockPackageTemplates, 
  mockOrganizations, 
  mockFamilies,
  mockTasks,
  type Beneficiary, 
  type PackageTemplate, 
  type Organization, 
  type Family,
  type Task
} from '../../data/mockData';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal } from '../ui';

interface BulkTasksPageTestProps {
  preselectedBeneficiaryIds?: string[];
  onNavigateBack?: () => void;
}

export default function BulkTasksPageTest({ preselectedBeneficiaryIds = [] }: BulkTasksPageTestProps) {
  const { logInfo, logError } = useErrorLogger();
  
  // State management
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>(preselectedBeneficiaryIds);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [supporterType, setSupporterType] = useState<'organization' | 'family'>('organization');
  const [customSupporter, setCustomSupporter] = useState<string>('');
  const [useCustomSupporter, setUseCustomSupporter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'import' | 'preview' | 'confirm'>('import');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
  // Import state
  const [importResults, setImportResults] = useState<{
    successful: any[];
    errors: any[];
    updated: any[];
  }>({
    successful: [],
    errors: [],
    updated: []
  });

  // Get filtered data based on supporter type
  const availableTemplates = supporterType === 'organization' && selectedOrganization
    ? mockPackageTemplates.filter(t => t.organization_id === selectedOrganization)
    : supporterType === 'family' && selectedFamily
    ? mockPackageTemplates.filter(t => t.organization_id === selectedFamily) // Assuming families can have templates too
    : [];

  const selectedBeneficiariesData = mockBeneficiaries.filter(b => selectedBeneficiaries.includes(b.id));

  useEffect(() => {
    if (preselectedBeneficiaryIds.length > 0) {
      setSelectedBeneficiaries(preselectedBeneficiaryIds);
      logInfo(`تم تحديد ${preselectedBeneficiaryIds.length} مستفيد مسبقاً`, 'BulkTasksPageTest');
    }
  }, [preselectedBeneficiaryIds, logInfo]);

  const handleSupporterTypeChange = (type: 'organization' | 'family') => {
    setSupporterType(type);
    setSelectedOrganization('');
    setSelectedFamily('');
    setSelectedTemplate('');
    setUseCustomSupporter(false);
    setCustomSupporter('');
  };

  const handleImportBeneficiaries = () => {
    setModalType('import');
    setShowModal(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // محاكاة قراءة وتحليل الملف
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          setNotification({ message: 'الملف فارغ أو غير صالح', type: 'error' });
          setTimeout(() => setNotification(null), 3000);
          return;
        }

        // تحليل البيانات (محاكاة)
        const results = {
          successful: [],
          errors: [],
          updated: []
        };

        // محاكاة معالجة البيانات
        lines.slice(1).forEach((line, index) => {
          const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
          
          if (columns.length >= 3) {
            const [name, nationalId, phone, altPhone] = columns;
            
            // التحقق من صحة البيانات
            if (!name || !nationalId) {
              results.errors.push({
                row: index + 2,
                data: columns,
                error: 'الاسم ورقم الهوية مطلوبان'
              });
              return;
            }

            if (!/^\d{9}$/.test(nationalId)) {
              results.errors.push({
                row: index + 2,
                data: columns,
                error: 'رقم الهوية يجب أن يكون 9 أرقام'
              });
              return;
            }

            if (phone && !/^05\d{8}$/.test(phone)) {
              results.errors.push({
                row: index + 2,
                data: columns,
                error: 'رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام'
              });
              return;
            }

            // البحث عن المستفيد الموجود
            const existingBeneficiary = mockBeneficiaries.find(b => b.nationalId === nationalId);
            
            if (existingBeneficiary) {
              results.updated.push({
                id: existingBeneficiary.id,
                name: name,
                nationalId: nationalId,
                phone: phone || existingBeneficiary.phone,
                altPhone: altPhone || '',
                existingName: existingBeneficiary.name
              });
            } else {
              results.successful.push({
                id: `imported-${Date.now()}-${index}`,
                name: name,
                nationalId: nationalId,
                phone: phone || '',
                altPhone: altPhone || ''
              });
            }
          } else {
            results.errors.push({
              row: index + 2,
              data: columns,
              error: 'عدد الأعمدة غير كافي'
            });
          }
        });

        setImportResults(results);
        setModalType('preview');
        
        logInfo(`تم تحليل الملف: ${results.successful.length} جديد، ${results.updated.length} محدث، ${results.errors.length} خطأ`, 'BulkTasksPageTest');
      } catch (error) {
        setNotification({ message: 'خطأ في قراءة الملف', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
        logError(error as Error, 'BulkTasksPageTest');
      }
    };
    
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    // محاكاة إضافة المستفيدين الجدد
    const newBeneficiaryIds: string[] = [];
    
    importResults.successful.forEach(beneficiary => {
      const newBeneficiary: Beneficiary = {
        id: beneficiary.id,
        name: beneficiary.name,
        fullName: beneficiary.name,
        nationalId: beneficiary.nationalId,
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phone: beneficiary.phone,
        address: 'غزة - غير محدد',
        detailedAddress: {
          governorate: 'غزة',
          city: 'غير محدد',
          district: 'غير محدد',
          street: '',
          additionalInfo: ''
        },
        location: { lat: 31.3469, lng: 34.3029 },
        profession: 'غير محدد',
        maritalStatus: 'single',
        economicLevel: 'poor',
        membersCount: 1,
        additionalDocuments: [],
        identityStatus: 'pending',
        status: 'active',
        eligibilityStatus: 'under_review',
        lastReceived: new Date().toISOString().split('T')[0],
        totalPackages: 0,
        notes: 'تم استيراده من ملف CSV',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        updatedBy: 'admin'
      };
      
      mockBeneficiaries.unshift(newBeneficiary);
      newBeneficiaryIds.push(newBeneficiary.id);
    });

    // تحديث المستفيدين الموجودين
    importResults.updated.forEach(beneficiary => {
      const index = mockBeneficiaries.findIndex(b => b.nationalId === beneficiary.nationalId);
      if (index !== -1) {
        mockBeneficiaries[index] = {
          ...mockBeneficiaries[index],
          name: beneficiary.name,
          phone: beneficiary.phone || mockBeneficiaries[index].phone,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin'
        };
        newBeneficiaryIds.push(mockBeneficiaries[index].id);
      }
    });

    // إضافة المستفيدين المستوردين للقائمة المحددة
    setSelectedBeneficiaries(prev => [...new Set([...prev, ...newBeneficiaryIds])]);
    
    setNotification({ 
      message: `تم استيراد ${importResults.successful.length} مستفيد جديد وتحديث ${importResults.updated.length} مستفيد موجود`, 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 5000);
    
    setShowModal(false);
    setImportResults({ successful: [], errors: [], updated: [] });
    
    logInfo(`تم استيراد ${importResults.successful.length + importResults.updated.length} مستفيد`, 'BulkTasksPageTest');
  };

  const handleRemoveBeneficiary = (beneficiaryId: string) => {
    setSelectedBeneficiaries(prev => prev.filter(id => id !== beneficiaryId));
  };

  const handleCreateTasks = () => {
    if (selectedBeneficiaries.length === 0) {
      setNotification({ message: 'يرجى اختيار مستفيدين أولاً', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (!selectedTemplate) {
      setNotification({ message: 'يرجى اختيار قالب طرد', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (supporterType === 'organization' && !selectedOrganization && !useCustomSupporter) {
      setNotification({ message: 'يرجى اختيار مؤسسة أو إدخال داعم مخصص', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (supporterType === 'family' && !selectedFamily && !useCustomSupporter) {
      setNotification({ message: 'يرجى اختيار عائلة أو إدخال داعم مخصص', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setModalType('confirm');
    setShowModal(true);
  };

  const executeCreateTasks = () => {
    // محاكاة إنشاء المهام
    const newTasks: Task[] = selectedBeneficiaries.map(beneficiaryId => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      packageId: selectedTemplate,
      beneficiaryId: beneficiaryId,
      status: 'pending',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // غداً
      notes: `مهمة جماعية - ${supporterType === 'organization' ? 'مؤسسة' : 'عائلة'}: ${
        useCustomSupporter ? customSupporter :
        supporterType === 'organization' ? mockOrganizations.find(o => o.id === selectedOrganization)?.name :
        mockFamilies.find(f => f.id === selectedFamily)?.name
      }`
    }));

    // إضافة المهام للبيانات الوهمية
    mockTasks.unshift(...newTasks);

    setNotification({ 
      message: `تم إنشاء ${newTasks.length} مهمة توزيع بنجاح`, 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 5000);

    // إعادة تعيين النموذج
    setSelectedBeneficiaries([]);
    setSelectedTemplate('');
    setSelectedOrganization('');
    setSelectedFamily('');
    setCustomSupporter('');
    setUseCustomSupporter(false);
    setShowModal(false);

    logInfo(`تم إنشاء ${newTasks.length} مهمة توزيع جماعية`, 'BulkTasksPageTest');
  };

  const downloadCSVTemplate = () => {
    const csvContent = 'الاسم,رقم الهوية,رقم الهاتف,رقم الهاتف البديل\nأحمد محمد الخالدي,900123456,0597123456,0598123456\nفاطمة سالم النجار,900234567,0598234567,\nمحمد علي الغزاوي,900345678,0599345678,0597345678';
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'قالب_المستفيدين.csv';
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تحميل قالب CSV بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredBeneficiaries = mockBeneficiaries.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.nationalId.includes(searchTerm) ||
    b.phone.includes(searchTerm)
  );

  const getNotificationClasses = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success': return 'bg-green-100 border-green-200 text-green-800';
      case 'error': return 'bg-red-100 border-red-200 text-red-800';
      case 'warning': return 'bg-orange-100 border-orange-200 text-orange-800';
    }
  };

  const getNotificationIcon = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <Clock className="w-5 h-5 text-orange-600" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 space-x-reverse ${getNotificationClasses(notification.type)}`}>
          {getNotificationIcon(notification.type)}
          <span className="font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Data Source Indicator */}
      <Card className="bg-blue-50 border-blue-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            البيانات الوهمية محملة - {mockBeneficiaries.length} مستفيد، {mockPackageTemplates.length} قالب
          </span>
        </div>
      </Card>

      {/* Step 1: Choose Supporter Type */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Building2 className="w-5 h-5 ml-2 text-blue-600" />
          الخطوة 1: اختيار نوع الداعم
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div
            onClick={() => handleSupporterTypeChange('organization')}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
              supporterType === 'organization'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">المؤسسات</h4>
              <p className="text-sm text-gray-600">اختيار مؤسسة من الشركاء لدعم التوزيع</p>
              <Badge variant="info" size="sm" className="mt-3">
                {mockOrganizations.length} مؤسسة متاحة
              </Badge>
            </div>
          </div>

          <div
            onClick={() => handleSupporterTypeChange('family')}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
              supporterType === 'family'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">العائلات</h4>
              <p className="text-sm text-gray-600">اختيار عائلة أو مبادر فردي لدعم التوزيع</p>
              <Badge variant="info" size="sm" className="mt-3">
                {mockFamilies.length} عائلة متاحة
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Step 2: Choose Supporter */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          {supporterType === 'organization' ? (
            <Building2 className="w-5 h-5 ml-2 text-blue-600" />
          ) : (
            <Heart className="w-5 h-5 ml-2 text-purple-600" />
          )}
          الخطوة 2: اختيار {supporterType === 'organization' ? 'المؤسسة' : 'العائلة'}
        </h3>

        {supporterType === 'organization' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختيار المؤسسة الداعمة
              </label>
              <select
                value={selectedOrganization}
                onChange={(e) => setSelectedOrganization(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={useCustomSupporter}
              >
                <option value="">اختر المؤسسة</option>
                {mockOrganizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <input
                type="checkbox"
                id="custom-org"
                checked={useCustomSupporter}
                onChange={(e) => setUseCustomSupporter(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="custom-org" className="text-sm text-gray-700">
                إدخال مؤسسة مخصصة (غير مسجلة في النظام)
              </label>
            </div>

            {useCustomSupporter && (
              <Input
                label="اسم المؤسسة المخصصة"
                type="text"
                value={customSupporter}
                onChange={(e) => setCustomSupporter(e.target.value)}
                placeholder="مثال: مبادرة أحمد الطبش"
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختيار العائلة الداعمة
              </label>
              <select
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={useCustomSupporter}
              >
                <option value="">اختر العائلة</option>
                {mockFamilies.map(family => (
                  <option key={family.id} value={family.id}>{family.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
              <input
                type="checkbox"
                id="custom-family"
                checked={useCustomSupporter}
                onChange={(e) => setUseCustomSupporter(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="custom-family" className="text-sm text-gray-700">
                إدخال مبادر فردي (غير مسجل في النظام)
              </label>
            </div>

            {useCustomSupporter && (
              <Input
                label="اسم المبادر الفردي"
                type="text"
                value={customSupporter}
                onChange={(e) => setCustomSupporter(e.target.value)}
                placeholder="مثال: مبادرة أحمد الطبش"
              />
            )}
          </div>
        )}
      </Card>

      {/* Step 3: Choose Package Template */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Package className="w-5 h-5 ml-2 text-green-600" />
          الخطوة 3: اختيار قالب الطرد
        </h3>

        {(selectedOrganization || selectedFamily || useCustomSupporter) ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              قوالب الطرود المتاحة
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر قالب الطرد</option>
              {availableTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.contents.length} عنصر
                </option>
              ))}
            </select>

            {selectedTemplate && (
              <div className="mt-4 bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">تفاصيل القالب المحدد</h4>
                {(() => {
                  const template = availableTemplates.find(t => t.id === selectedTemplate);
                  return template ? (
                    <div className="text-sm text-green-700">
                      <p><strong>الاسم:</strong> {template.name}</p>
                      <p><strong>الوصف:</strong> {template.description}</p>
                      <p><strong>عدد العناصر:</strong> {template.contents.length}</p>
                      <p><strong>الوزن الإجمالي:</strong> {template.totalWeight} كيلو</p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>يرجى اختيار الداعم أولاً لعرض قوالب الطرود المتاحة</p>
          </div>
        )}
      </Card>

      {/* Step 4: Import or Select Beneficiaries */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Users className="w-5 h-5 ml-2 text-purple-600" />
          الخطوة 4: إدارة المستفيدين
        </h3>

        <div className="space-y-6">
          {/* Import Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">استيراد مستفيدين من ملف</h4>
                <p className="text-gray-600 text-sm">استيراد قائمة مستفيدين من ملف CSV أو Excel</p>
              </div>
              <Button
                variant="primary"
                icon={Upload}
                iconPosition="right"
                onClick={handleImportBeneficiaries}
              >
                استيراد مستفيدين
              </Button>
            </div>
          </div>

          {/* Selected Beneficiaries */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                المستفيدين المحددين ({selectedBeneficiaries.length})
              </h4>
              <div className="flex space-x-2 space-x-reverse">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedBeneficiaries([])}
                  disabled={selectedBeneficiaries.length === 0}
                >
                  مسح الكل
                </Button>
              </div>
            </div>

            {selectedBeneficiaries.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الهوية</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنطقة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedBeneficiariesData.map((beneficiary) => (
                        <tr key={beneficiary.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{beneficiary.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{beneficiary.nationalId}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{beneficiary.phone}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{beneficiary.detailedAddress.district}</td>
                          <td className="px-4 py-3">
                            <Button
                              variant="danger"
                              size="sm"
                              icon={X}
                              onClick={() => handleRemoveBeneficiary(beneficiary.id)}
                            >
                              إزالة
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>لم يتم تحديد أي مستفيدين بعد</p>
                <p className="text-sm mt-1">استخدم زر "استيراد مستفيدين" لإضافة مستفيدين</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Create Tasks Button */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="text-center">
          <div className="bg-green-100 p-4 rounded-xl w-fit mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">إنشاء مهام التوزيع</h3>
          <p className="text-gray-600 mb-6">
            سيتم إنشاء {selectedBeneficiaries.length} مهمة توزيع للمستفيدين المحددين
          </p>
          <Button
            variant="success"
            icon={Send}
            iconPosition="right"
            onClick={handleCreateTasks}
            disabled={selectedBeneficiaries.length === 0 || !selectedTemplate}
            className="px-8 py-4 text-lg"
          >
            إنشاء {selectedBeneficiaries.length} مهمة توزيع
          </Button>
        </div>
      </Card>

      {/* Summary Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-xl mb-2">
              <Users className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm text-blue-600">مستفيدين محددين</p>
            <p className="text-2xl font-bold text-blue-900">{selectedBeneficiaries.length}</p>
          </div>
        </Card>

        <Card className="bg-green-50">
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-xl mb-2">
              <Package className="w-6 h-6 text-green-600 mx-auto" />
            </div>
            <p className="text-sm text-green-600">قالب محدد</p>
            <p className="text-2xl font-bold text-green-900">{selectedTemplate ? '1' : '0'}</p>
          </div>
        </Card>

        <Card className="bg-purple-50">
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-xl mb-2">
              {supporterType === 'organization' ? (
                <Building2 className="w-6 h-6 text-purple-600 mx-auto" />
              ) : (
                <Heart className="w-6 h-6 text-purple-600 mx-auto" />
              )}
            </div>
            <p className="text-sm text-purple-600">داعم محدد</p>
            <p className="text-2xl font-bold text-purple-900">
              {(selectedOrganization || selectedFamily || useCustomSupporter) ? '1' : '0'}
            </p>
          </div>
        </Card>

        <Card className="bg-orange-50">
          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-xl mb-2">
              <Activity className="w-6 h-6 text-orange-600 mx-auto" />
            </div>
            <p className="text-sm text-orange-600">مهام ستُنشأ</p>
            <p className="text-2xl font-bold text-orange-900">
              {(selectedBeneficiaries.length > 0 && selectedTemplate) ? selectedBeneficiaries.length : '0'}
            </p>
          </div>
        </Card>
      </div>

      {/* Modal for Import/Preview/Confirm */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'import' ? 'استيراد مستفيدين من ملف' :
            modalType === 'preview' ? 'معاينة نتائج الاستيراد' :
            'تأكيد إنشاء المهام'
          }
          size="lg"
        >
          <div className="p-6">
            {/* Import Modal */}
            {modalType === 'import' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="bg-blue-100 p-8 rounded-2xl mb-6">
                    <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-gray-900 mb-3">استيراد مستفيدين من ملف</h4>
                    <p className="text-gray-600">اختر ملف CSV أو Excel يحتوي على بيانات المستفيدين</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-blue-300 rounded-2xl p-12 mb-6 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                    <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">اسحب ملف CSV أو Excel هنا أو اضغط للاختيار</p>
                    <p className="text-sm text-gray-500 mb-4">الملفات المدعومة: .csv, .xlsx, .xls</p>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center font-medium"
                    >
                      <Upload className="w-5 h-5 ml-2" />
                      اختيار ملف المستفيدين
                    </label>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">تنسيق الملف المطلوب</span>
                    </div>
                    <p className="text-yellow-700 text-sm">
                      يجب أن يحتوي الملف على الأعمدة التالية: الاسم، رقم الهوية، رقم الهاتف، رقم الهاتف البديل (اختياري)
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    icon={Download}
                    iconPosition="right"
                    onClick={downloadCSVTemplate}
                    className="mb-4"
                  >
                    تحميل قالب CSV
                  </Button>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-center">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}

            {/* Preview Modal */}
            {modalType === 'preview' && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3">ملخص نتائج الاستيراد</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-green-100 p-3 rounded-lg text-center">
                      <p className="font-bold text-green-800">{importResults.successful.length}</p>
                      <p className="text-green-600">مستفيد جديد</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg text-center">
                      <p className="font-bold text-blue-800">{importResults.updated.length}</p>
                      <p className="text-blue-600">مستفيد محدث</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg text-center">
                      <p className="font-bold text-red-800">{importResults.errors.length}</p>
                      <p className="text-red-600">خطأ</p>
                    </div>
                  </div>
                </div>

                {/* Successful Imports */}
                {importResults.successful.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h5 className="font-medium text-green-800 mb-3">مستفيدين جدد ({importResults.successful.length})</h5>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {importResults.successful.slice(0, 5).map((beneficiary, index) => (
                        <div key={index} className="text-sm text-green-700 bg-white p-2 rounded">
                          {beneficiary.name} - {beneficiary.nationalId}
                        </div>
                      ))}
                      {importResults.successful.length > 5 && (
                        <div className="text-sm text-green-600">+ {importResults.successful.length - 5} مستفيد آخر</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Updated Beneficiaries */}
                {importResults.updated.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-3">مستفيدين محدثين ({importResults.updated.length})</h5>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {importResults.updated.slice(0, 5).map((beneficiary, index) => (
                        <div key={index} className="text-sm text-blue-700 bg-white p-2 rounded">
                          {beneficiary.name} - {beneficiary.nationalId} (كان: {beneficiary.existingName})
                        </div>
                      ))}
                      {importResults.updated.length > 5 && (
                        <div className="text-sm text-blue-600">+ {importResults.updated.length - 5} مستفيد آخر</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {importResults.errors.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <h5 className="font-medium text-red-800 mb-3">أخطاء ({importResults.errors.length})</h5>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {importResults.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-sm text-red-700 bg-white p-2 rounded">
                          الصف {error.row}: {error.error}
                        </div>
                      ))}
                      {importResults.errors.length > 5 && (
                        <div className="text-sm text-red-600">+ {importResults.errors.length - 5} خطأ آخر</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleConfirmImport}
                    disabled={importResults.successful.length === 0 && importResults.updated.length === 0}
                  >
                    تأكيد الاستيراد ({importResults.successful.length + importResults.updated.length} مستفيد)
                  </Button>
                </div>
              </div>
            )}

            {/* Confirm Modal */}
            {modalType === 'confirm' && (
              <div className="space-y-6">
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <h4 className="text-lg font-bold text-green-800 mb-4">تأكيد إنشاء مهام التوزيع</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">عدد المستفيدين:</span>
                      <span className="font-medium text-green-900 mr-2">{selectedBeneficiaries.length}</span>
                    </div>
                    <div>
                      <span className="text-green-700">قالب الطرد:</span>
                      <span className="font-medium text-green-900 mr-2">
                        {availableTemplates.find(t => t.id === selectedTemplate)?.name || 'غير محدد'}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700">الداعم:</span>
                      <span className="font-medium text-green-900 mr-2">
                        {useCustomSupporter ? customSupporter :
                         supporterType === 'organization' ? mockOrganizations.find(o => o.id === selectedOrganization)?.name :
                         mockFamilies.find(f => f.id === selectedFamily)?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700">نوع الداعم:</span>
                      <span className="font-medium text-green-900 mr-2">
                        {supporterType === 'organization' ? 'مؤسسة' : 'عائلة'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">ملاحظة مهمة</span>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    سيتم إنشاء {selectedBeneficiaries.length} مهمة توزيع جديدة. هذا الإجراء لا يمكن التراجع عنه.
                  </p>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="success" onClick={executeCreateTasks}>
                    تأكيد إنشاء المهام
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <Send className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">إرشادات المهام الجماعية (نسخة اختبار)</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>هذه نسخة اختبار من صفحة المهام الجماعية مع التحسينات المطلوبة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>تم حذف زر "العودة للقائمة" والأزرار الإضافية في قسم الاستيراد</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>تم تحسين تدفق اختيار الداعم (مؤسسة أو عائلة) أولاً</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>يمكنك مقارنة هذه النسخة بالصفحة الأصلية قبل اتخاذ قرار الاستبدال</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}