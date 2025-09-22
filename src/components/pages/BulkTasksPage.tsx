import React, { useState } from 'react';
import { Package, Users, Send, CheckCircle, AlertTriangle, Clock, Building2, Search, Filter, Plus, Eye, Edit, X, ArrowLeft, Calendar, MapPin, Phone, FileText, Star, TrendingUp, Upload, Download, RefreshCw, UserPlus, Trash2, Heart } from 'lucide-react';
import { 
  mockBeneficiaries, 
  mockPackages, 
  calculateStats, 
  mockOrganizations, 
  mockFamilies, 
  mockPackageTemplates, 
  addOrUpdateBeneficiaryFromImport, 
  validateImportedBeneficiary, 
  generateBeneficiariesCSVTemplate,
  type Beneficiary,
  type Organization,
  type PackageTemplate
} from '../../data/mockData';
import { Button, Card, Input, Badge, Modal } from '../ui';
import { useErrorLogger } from '../../utils/errorLogger';

interface BulkTasksPageProps {
  preselectedBeneficiaryIds?: string[];
  onNavigateBack?: () => void;
}

export default function BulkTasksPage({ preselectedBeneficiaryIds = [], onNavigateBack }: BulkTasksPageProps) {
  const { logInfo, logError } = useErrorLogger();
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>(preselectedBeneficiaryIds);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [packageCode, setPackageCode] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationSearchTerm, setOrganizationSearchTerm] = useState('');
  const [familySearchTerm, setFamilySearchTerm] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // حالة استيراد المستفيدين
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    imported: number;
    updated: number;
    errors: Array<{ row: number; errors: string[] }>;
    importedBeneficiaries: Beneficiary[];
  } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Get beneficiaries data
  const allBeneficiaries = mockBeneficiaries;
  const organizations = mockOrganizations;
  const packageTemplates = mockPackageTemplates;

  // Filter beneficiaries for search
  const filteredBeneficiaries = allBeneficiaries.filter(ben =>
    ben.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ben.nationalId.includes(searchTerm) ||
    ben.phone.includes(searchTerm)
  );

  // Filter organizations for search
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(organizationSearchTerm.toLowerCase()) ||
    org.type.toLowerCase().includes(organizationSearchTerm.toLowerCase())
  );

  // Filter families for search
  const filteredFamilies = mockFamilies.filter(family =>
    family.name.toLowerCase().includes(familySearchTerm.toLowerCase())
  );

  const selectedBeneficiariesData = allBeneficiaries.filter(b => selectedBeneficiaries.includes(b.id));
  const selectedOrganizationData = selectedOrganization === 'internal' 
    ? { id: 'internal', name: 'الطرود الداخلية - المنصة', type: 'داخلي' }
    : organizations.find(org => org.id === selectedOrganization) || 
      mockFamilies.find(family => family.id === selectedOrganization);
  const selectedTemplateData = packageTemplates.find(t => t.id === selectedTemplate);
  const availableTemplates = selectedOrganization === 'internal' 
    ? packageTemplates.filter(t => t.organization_id === 'internal') // Internal templates
    : packageTemplates.filter(t => t.organization_id === selectedOrganization);

  const handleSelectBeneficiary = (beneficiaryId: string) => {
    setSelectedBeneficiaries(prev => 
      prev.includes(beneficiaryId) 
        ? prev.filter(id => id !== beneficiaryId)
        : [...prev, beneficiaryId]
    );
  };

  const handleRemoveBeneficiary = (beneficiaryId: string) => {
    setSelectedBeneficiaries(prev => prev.filter(id => id !== beneficiaryId));
  };

  const handleCreateTasks = () => {
    if (selectedBeneficiaries.length === 0) {
      alert('يرجى تحديد مستفيدين أولاً');
      return;
    }

    if (!selectedOrganization || (!selectedTemplate && !packageCode)) {
      alert('يرجى اختيار المؤسسة والطرد (قالب أو كود)');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeCreateTasks = () => {
    const taskId = `TASK-${Date.now()}`;
    const packageInfo = selectedTemplateData ? selectedTemplateData.name : `طرد برقم: ${packageCode}`;
    
    // محاكاة إنشاء المهام
    logInfo(`تم إنشاء ${selectedBeneficiaries.length} مهمة جديدة`, 'BulkTasksPage');
    
    alert(`تم إنشاء المهام بنجاح!\n\nرقم المهمة: ${taskId}\nعدد المستفيدين: ${selectedBeneficiaries.length}\nالطرد: ${packageInfo}\nالمؤسسة: ${selectedOrganizationData?.name}\n\nسيتم إشعار المندوبين قريباً`);
    
    // Reset form
    setSelectedBeneficiaries([]);
    setSelectedOrganization('');
    setSelectedTemplate('');
    setPackageCode('');
    setNotes('');
    setShowConfirmModal(false);
  };

  // وظائف استيراد المستفيدين
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImportBeneficiaries = async () => {
    if (!importFile) {
      setNotification({ message: 'يرجى اختيار ملف أولاً', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      // محاكاة قراءة الملف
      await new Promise(resolve => setTimeout(resolve, 2000));

      // محاكاة تحليل البيانات من CSV
      const mockCSVData = [
        { name: 'أحمد محمد المستورد', nationalId: '900111111', phone: '0597111111', alternativePhone: '0598111111' },
        { name: 'فاطمة سالم المستوردة', nationalId: '900222222', phone: '0597222222', alternativePhone: '' },
        { name: 'محمد علي المستورد', nationalId: '900333333', phone: '0597333333', alternativePhone: '0598333333' },
        { name: 'سارة أحمد المستوردة', nationalId: '900444444', phone: '0597444444', alternativePhone: '' },
        { name: 'خالد يوسف المستورد', nationalId: '900555555', phone: '0597555555', alternativePhone: '0598555555' },
        { name: 'مريم محمد المستوردة', nationalId: '900666666', phone: '0597666666', alternativePhone: '' },
        { name: 'يوسف أحمد المستورد', nationalId: '900777777', phone: '0597777777', alternativePhone: '0598777777' },
        { name: 'نور سالم المستوردة', nationalId: '900888888', phone: '0597888888', alternativePhone: '' }
      ];

      const results = {
        total: mockCSVData.length,
        imported: 0,
        updated: 0,
        errors: [] as Array<{ row: number; errors: string[] }>,
        importedBeneficiaries: [] as Beneficiary[]
      };

      // معالجة كل صف
      mockCSVData.forEach((rowData, index) => {
        const validation = validateImportedBeneficiary(rowData);
        
        if (!validation.isValid) {
          results.errors.push({
            row: index + 2, // +2 لأن الصف الأول هو العناوين والفهرسة تبدأ من 1
            errors: validation.errors
          });
          return;
        }

        try {
          const result = addOrUpdateBeneficiaryFromImport({
            name: rowData.name.trim(),
            nationalId: rowData.nationalId.trim(),
            phone: rowData.phone?.trim(),
            alternativePhone: rowData.alternativePhone?.trim()
          });

          if (result.isNew) {
            results.imported++;
          } else if (result.updated.length > 0) {
            results.updated++;
          }

          results.importedBeneficiaries.push(result.beneficiary);
        } catch (error) {
          results.errors.push({
            row: index + 2,
            errors: ['خطأ في معالجة البيانات']
          });
        }
      });

      setImportResults(results);

      // إضافة المستفيدين المستوردين للقائمة المحددة
      const newSelectedIds = results.importedBeneficiaries.map(b => b.id);
      setSelectedBeneficiaries(prev => [...prev, ...newSelectedIds]);

      // إشعار النجاح
      setNotification({
        message: `تم استيراد ${results.imported} مستفيد جديد وتحديث ${results.updated} مستفيد موجود`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 5000);

      logInfo(`تم استيراد ${results.imported + results.updated} مستفيد من ملف: ${importFile.name}`, 'BulkTasksPage');
    } catch (error) {
      setNotification({ message: 'حدث خطأ في استيراد الملف', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      logError(error as Error, 'BulkTasksPage');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = generateBeneficiariesCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'قالب_المستفيدين.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    
    setNotification({ message: 'تم تحميل قالب CSV بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const clearImportResults = () => {
    setImportResults(null);
    setImportFile(null);
    setShowImportModal(false);
  };

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'normal': return 'عادي';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          {onNavigateBack && (
            <Button
              variant="secondary"
              icon={ArrowLeft}
              iconPosition="right"
              onClick={onNavigateBack}
            >
              العودة للقائمة
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">إنشاء مهام جماعية</h2>
            <p className="text-gray-600 mt-1">إنشاء مهام توزيع لمجموعة من المستفيدين</p>
          </div>
        </div>
        <div className="flex space-x-3 space-x-reverse">
          <Button
            variant="secondary"
            icon={Upload}
            iconPosition="right"
            onClick={() => setShowImportModal(true)}
          >
            استيراد مستفيدين
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">خطوات إنشاء المهام</h3>
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>الخطوة {selectedBeneficiaries.length > 0 ? (selectedOrganization ? (selectedTemplate || packageCode ? '3' : '2') : '2') : '1'} من 3</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedBeneficiaries.length > 0 ? 'text-green-600' : 'text-blue-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedBeneficiaries.length > 0 ? 'bg-green-100' : 'bg-blue-100'}`}>
              {selectedBeneficiaries.length > 0 ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">1</span>}
            </div>
            <span className="text-sm font-medium">تحديد المستفيدين</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedOrganization ? 'text-green-600' : selectedBeneficiaries.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedOrganization ? 'bg-green-100' : selectedBeneficiaries.length > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {selectedOrganization ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">2</span>}
            </div>
            <span className="text-sm font-medium">اختيار المؤسسة</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center space-x-2 space-x-reverse ${(selectedTemplate || packageCode) && selectedOrganization ? 'text-green-600' : selectedOrganization ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${(selectedTemplate || packageCode) && selectedOrganization ? 'bg-green-100' : selectedOrganization ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {(selectedTemplate || packageCode) && selectedOrganization ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">3</span>}
            </div>
            <span className="text-sm font-medium">تحديد الطرد</span>
          </div>
        </div>
      </Card>

      {/* Selected Beneficiaries */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">المستفيدين المحددين ({selectedBeneficiaries.length})</h3>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
            {selectedBeneficiariesData.map((beneficiary) => (
              <div key={beneficiary.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{beneficiary.name}</p>
                    <p className="text-sm text-gray-600">{beneficiary.detailedAddress.district}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveBeneficiary(beneficiary.id)}
                  className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">لم يتم تحديد أي مستفيدين</p>
            <p className="text-sm mt-2">يرجى تحديد المستفيدين من القائمة أدناه</p>
          </div>
        )}
      </Card>

      {/* Add More Beneficiaries */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">إضافة مستفيدين إضافيين</h3>
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant="secondary"
              icon={Download}
              iconPosition="right"
              size="sm"
              onClick={downloadCSVTemplate}
            >
              تحميل قالب CSV
            </Button>
            <Button
              variant="primary"
              icon={Upload}
              iconPosition="right"
              size="sm"
              onClick={() => setShowImportModal(true)}
            >
              استيراد من ملف
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <Input
            type="text"
            icon={Search}
            iconPosition="right"
            placeholder="البحث عن مستفيدين (الاسم، رقم الهوية، الهاتف)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {searchTerm && (
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredBeneficiaries.filter(b => !selectedBeneficiaries.includes(b.id)).slice(0, 10).map((beneficiary) => (
              <div
                key={beneficiary.id}
                onClick={() => handleSelectBeneficiary(beneficiary.id)}
                className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{beneficiary.name}</p>
                    <p className="text-sm text-gray-600">{beneficiary.nationalId} - {beneficiary.phone}</p>
                    <p className="text-sm text-gray-500">{beneficiary.detailedAddress.district}</p>
                  </div>
                </div>
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Organization Selection */}
      {selectedBeneficiaries.length > 0 && (
        <Card>
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">اختيار مصدر الطرود</h3>
              {selectedOrganization && (
                <div className="flex items-center space-x-2 space-x-reverse text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">تم الاختيار</span>
                </div>
              )}
            </div>

            {/* Internal Packages - Featured Section */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">الطرود الداخلية</h4>
                      <p className="text-green-100">طرود من المنصة مباشرة</p>
                    </div>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-full">
                    <span className="text-white text-sm font-medium">داخلي</span>
                  </div>
                </div>
                
                <p className="text-green-100 mb-6">
                  طرود متوفرة من مخزون المنصة الداخلي، جاهزة للتوزيع الفوري على المستفيدين
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/10 p-3 rounded-lg">
                    <p className="text-white text-sm">الطرود المتاحة</p>
                    <p className="text-2xl font-bold text-white">1,247</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <p className="text-white text-sm">القوالب الجاهزة</p>
                    <p className="text-2xl font-bold text-white">15</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <p className="text-white text-sm">متوسط التكلفة</p>
                    <p className="text-2xl font-bold text-white">45 ₪</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedOrganization('internal')}
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all ${
                    selectedOrganization === 'internal'
                      ? 'bg-white text-green-600 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {selectedOrganization === 'internal' ? (
                    <div className="flex items-center justify-center space-x-2 space-x-reverse">
                      <CheckCircle className="w-5 h-5" />
                      <span>تم اختيار الطرود الداخلية</span>
                    </div>
                  ) : (
                    'اختيار الطرود الداخلية'
                  )}
                </button>
              </div>
            </div>

            {/* External Organizations Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">المؤسسات الخارجية</h4>
                    <p className="text-gray-600">طرود مدعومة من مؤسسات خارجية</p>
                  </div>
                </div>
                <Badge variant="info" size="sm">
                  {organizations.length} مؤسسة
                </Badge>
              </div>

              {/* Organizations Search */}
              <div className="mb-6">
                <Input
                  type="text"
                  icon={Search}
                  iconPosition="right"
                  placeholder="البحث في المؤسسات..."
                  value={organizationSearchTerm}
                  onChange={(e) => setOrganizationSearchTerm(e.target.value)}
                />
              </div>

              {/* Popular Organizations */}
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-3">المؤسسات الشائعة</h5>
                <div className="flex flex-wrap gap-2">
                  {organizations.filter(org => org.isPopular).map((org) => (
                    <button
                      key={org.id}
                      onClick={() => setSelectedOrganization(org.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedOrganization === org.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Organizations Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                {filteredOrganizations.map((organization) => (
                  <div
                    key={organization.id}
                    onClick={() => setSelectedOrganization(organization.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedOrganization === organization.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 space-x-reverse mb-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{organization.name}</h4>
                        <p className="text-sm text-gray-600">{organization.type}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {organization.packagesAvailable || 0} طرد متاح • {organization.templatesCount || 0} قوالب
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Families Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">العائلات والمبادرات</h4>
                    <p className="text-gray-600">طرود موزعة عبر العائلات بدعم خارجي</p>
                  </div>
                </div>
                <Badge variant="info" size="sm">
                  {mockFamilies.length} عائلة
                </Badge>
              </div>

              {/* Families Search */}
              <div className="mb-6">
                <Input
                  type="text"
                  icon={Search}
                  iconPosition="right"
                  placeholder="البحث في العائلات..."
                  value={familySearchTerm}
                  onChange={(e) => setFamilySearchTerm(e.target.value)}
                />
              </div>

              {/* Families Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                {filteredFamilies.map((family) => {
                  const supportingOrg = organizations.find(org => org.id === family.supportingOrganizationId);
                  return (
                    <div
                      key={family.id}
                      onClick={() => setSelectedOrganization(family.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                        selectedOrganization === family.id
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 space-x-reverse mb-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Heart className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{family.name}</h4>
                          <p className="text-sm text-gray-600">{family.membersCount} فرد</p>
                        </div>
                      </div>
                      
                      {supportingOrg && (
                        <div className="bg-gray-50 p-2 rounded-lg mb-2">
                          <p className="text-xs text-gray-600">بدعم من:</p>
                          <p className="text-sm font-medium text-gray-800">{supportingOrg.name}</p>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        {family.packagesDistributed} طرد موزع • {family.completionRate}% إنجاز
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Package Selection */}
      {selectedOrganization && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">تحديد الطرد</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Template Selection */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">اختيار من القوالب المتاحة</h4>
              {availableTemplates.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {availableTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setPackageCode('');
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">{template.name}</h5>
                        <span className="text-sm font-bold text-green-600">{template.estimatedCost} ₪</span>
                      </div>
                      <p className="text-sm text-gray-600">{template.contents.length} أصناف</p>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.contents.slice(0, 2).map(item => item.name).join(', ')}
                        {template.contents.length > 2 && '...'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد قوالب متاحة</p>
                </div>
              )}
            </div>

            {/* Package Code Input */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">أو إدخال كود الطرد</h4>
              <div className="space-y-4">
                <Input
                  label="كود/رقم الطرد"
                  type="text"
                  value={packageCode}
                  onChange={(e) => {
                    setPackageCode(e.target.value);
                    if (e.target.value) setSelectedTemplate('');
                  }}
                  placeholder="مثال: PKG-2024-001"
                />
                
                {packageCode && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">طرد مخصص</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      سيتم إنشاء مهام لطرد برقم: <strong>{packageCode}</strong>
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      تأكد من وجود هذا الطرد في المخزون
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Task Options */}
      {(selectedTemplate || packageCode) && selectedOrganization && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">خيارات المهمة</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">أولوية التوزيع</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="normal">عادية - خلال 2-3 أيام</option>
                <option value="high">عالية - خلال 24 ساعة</option>
                <option value="urgent">عاجلة - خلال 6 ساعات</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ التوزيع المطلوب</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات للمندوبين</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="تعليمات خاصة للمندوبين أو ملاحظات حول التوزيع..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Summary and Create Tasks */}
      {selectedBeneficiaries.length > 0 && selectedOrganization && (selectedTemplate || packageCode) && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">ملخص المهام</h3>
          
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200 mb-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-xl mb-2">
                  <Users className="w-6 h-6 text-blue-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">عدد المستفيدين</p>
                <p className="text-2xl font-bold text-blue-900">{selectedBeneficiaries.length}</p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-xl mb-2">
                  <Building2 className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">المؤسسة</p>
                <p className="text-lg font-bold text-green-900">{selectedOrganizationData?.name}</p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-xl mb-2">
                  <Package className="w-6 h-6 text-purple-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">الطرد</p>
                <p className="text-lg font-bold text-purple-900">
                  {selectedTemplateData ? selectedTemplateData.name : packageCode}
                </p>
              </div>

              <div className="text-center">
                <div className="bg-orange-100 p-3 rounded-xl mb-2">
                  <Clock className="w-6 h-6 text-orange-600 mx-auto" />
                </div>
                <p className="text-sm text-gray-600">الأولوية</p>
                <Badge variant={
                  priority === 'urgent' ? 'error' :
                  priority === 'high' ? 'warning' : 'info'
                } className="text-lg font-bold">
                  {getPriorityText(priority)}
                </Badge>
              </div>
            </div>
          </div>

          {selectedTemplateData && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-900 mb-3">تفاصيل الطرد</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">التكلفة الإجمالية:</span>
                  <span className="font-bold text-green-600 mr-2">
                    {(selectedBeneficiaries.length * selectedTemplateData.estimatedCost).toLocaleString()} ₪
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">الوزن الإجمالي:</span>
                  <span className="font-bold text-gray-900 mr-2">
                    {(selectedBeneficiaries.length * selectedTemplateData.totalWeight).toFixed(1)} كيلو
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            icon={Send}
            iconPosition="right"
            onClick={handleCreateTasks}
            className="w-full text-lg py-4"
          >
            إنشاء {selectedBeneficiaries.length} مهمة توزيع
          </Button>
        </Card>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="تأكيد إنشاء المهام"
          size="md"
        >
          <div className="p-6 text-center">
            <div className="bg-blue-100 p-6 rounded-xl mb-6">
              <Send className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">هل أنت متأكد من إنشاء هذه المهام؟</h3>
              <p className="text-gray-600">
                سيتم إنشاء {selectedBeneficiaries.length} مهمة توزيع وإشعار المندوبين
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-right mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">عدد المستفيدين:</span>
                  <span className="font-medium text-gray-900">{selectedBeneficiaries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">المؤسسة:</span>
                  <span className="font-medium text-gray-900">{selectedOrganizationData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الطرد:</span>
                  <span className="font-medium text-gray-900">
                    {selectedTemplateData ? selectedTemplateData.name : packageCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الأولوية:</span>
                  <span className="font-medium text-gray-900">{getPriorityText(priority)}</span>
                </div>
                {selectedTemplateData && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">التكلفة المتوقعة:</span>
                    <span className="font-medium text-green-600">
                      {(selectedBeneficiaries.length * selectedTemplateData.estimatedCost).toLocaleString()} ₪
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse justify-center">
              <Button
                variant="secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={executeCreateTasks}
              >
                تأكيد إنشاء المهام
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <Modal
          isOpen={showImportModal}
          onClose={() => {
            if (!isImporting) {
              clearImportResults();
            }
          }}
          title="استيراد مستفيدين من ملف Excel/CSV"
          size="lg"
        >
          <div className="p-6">
            {!importResults ? (
              <div className="space-y-6">
                {/* File Upload Section */}
                <div className="text-center">
                  <div className="bg-blue-50 p-8 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors">
                    <Upload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">اختر ملف Excel أو CSV</h4>
                    <p className="text-gray-600 mb-4">
                      يجب أن يحتوي الملف على: الاسم، رقم الهوية، رقم الهاتف (اختياري)، رقم الهاتف البديل (اختياري)
                    </p>
                    
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="beneficiaries-file-upload"
                      disabled={isImporting}
                    />
                    <label
                      htmlFor="beneficiaries-file-upload"
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center"
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      اختيار ملف
                    </label>
                  </div>
                  
                  {importFile && (
                    <div className="mt-4 bg-green-50 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div className="text-right">
                          <p className="font-medium text-green-800">تم اختيار الملف: {importFile.name}</p>
                          <p className="text-sm text-green-600">الحجم: {(importFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Template Download */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">تحميل قالب CSV جاهز</h4>
                      <p className="text-sm text-gray-600">قالب يحتوي على أمثلة وتنسيق صحيح للبيانات</p>
                    </div>
                    <Button
                      variant="secondary"
                      icon={Download}
                      iconPosition="right"
                      onClick={downloadCSVTemplate}
                    >
                      تحميل القالب
                    </Button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3">تعليمات الاستيراد</h4>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-start space-x-2 space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>الملف يجب أن يحتوي على عمود "الاسم" وعمود "رقم الهوية" كحد أدنى</span>
                    </li>
                    <li className="flex items-start space-x-2 space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>رقم الهوية يجب أن يكون 9 أرقام بالضبط</span>
                    </li>
                    <li className="flex items-start space-x-2 space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>رقم الهاتف يجب أن يبدأ بـ 05 ويتكون من 10 أرقام</span>
                    </li>
                    <li className="flex items-start space-x-2 space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>إذا كان المستفيد موجود (نفس رقم الهوية)، سيتم تحديث بياناته</span>
                    </li>
                    <li className="flex items-start space-x-2 space-x-reverse">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>الحد الأقصى لحجم الملف: 10 ميجابايت</span>
                    </li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 space-x-reverse justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowImportModal(false)}
                    disabled={isImporting}
                  >
                    إلغاء
                  </Button>
                  <Button
                    variant="primary"
                    icon={isImporting ? undefined : Upload}
                    iconPosition="right"
                    onClick={handleImportBeneficiaries}
                    disabled={!importFile || isImporting}
                    loading={isImporting}
                  >
                    {isImporting ? 'جاري الاستيراد...' : 'بدء الاستيراد'}
                  </Button>
                </div>
              </div>
            ) : (
              /* Import Results */
              <div className="space-y-6">
                {/* Results Summary */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3 space-x-reverse mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">نتائج الاستيراد</h3>
                      <p className="text-gray-600">تم معالجة الملف: {importFile?.name}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">إجمالي الصفوف</p>
                        <p className="text-2xl font-bold text-gray-900">{importResults.total}</p>
                      </div>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                      <div className="text-center">
                        <p className="text-sm text-green-600">مستفيدين جدد</p>
                        <p className="text-2xl font-bold text-green-900">{importResults.imported}</p>
                      </div>
                    </div>
                    <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                      <div className="text-center">
                        <p className="text-sm text-blue-600">تم التحديث</p>
                        <p className="text-2xl font-bold text-blue-900">{importResults.updated}</p>
                      </div>
                    </div>
                    <div className="bg-red-100 p-4 rounded-lg border border-red-200">
                      <div className="text-center">
                        <p className="text-sm text-red-600">أخطاء</p>
                        <p className="text-2xl font-bold text-red-900">{importResults.errors.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Imported Beneficiaries */}
                {importResults.importedBeneficiaries.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-3">المستفيدين المستوردين ({importResults.importedBeneficiaries.length})</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {importResults.importedBeneficiaries.map((beneficiary, index) => (
                        <div key={beneficiary.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <UserPlus className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{beneficiary.name}</p>
                              <p className="text-sm text-gray-600">{beneficiary.nationalId} - {beneficiary.phone}</p>
                            </div>
                          </div>
                          <Badge variant="success" size="sm">
                            {mockBeneficiaries.find(b => b.nationalId === beneficiary.nationalId && b.id !== beneficiary.id) ? 'محدث' : 'جديد'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {importResults.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h4 className="font-medium text-red-800 mb-3">أخطاء الاستيراد ({importResults.errors.length})</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {importResults.errors.map((error, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-red-200">
                          <div className="flex items-start space-x-2 space-x-reverse">
                            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-red-800">الصف {error.row}:</p>
                              <ul className="text-sm text-red-700 mt-1">
                                {error.errors.map((err, errIndex) => (
                                  <li key={errIndex}>• {err}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 space-x-reverse justify-end pt-4 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    icon={RefreshCw}
                    iconPosition="right"
                    onClick={clearImportResults}
                  >
                    استيراد ملف آخر
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setShowImportModal(false)}
                  >
                    إغلاق ({importResults.imported + importResults.updated} مستفيد مضاف)
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
          <Package className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">تعليمات إنشاء المهام الجماعية</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن تحديد المستفيدين من القائمة الحالية أو البحث عن مستفيدين إضافيين</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن استيراد مستفيدين جدد من ملف Excel أو CSV</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن اختيار قالب طرد جاهز أو إدخال كود طرد مخصص</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>سيتم تعيين أفضل المندوبين المتاحين حسب المناطق</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>سيتم إرسال إشعارات للمستفيدين والمندوبين</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}