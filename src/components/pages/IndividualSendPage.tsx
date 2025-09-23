import React, { useState } from 'react';
import { Send, User, Package, Search, Filter, Plus, Eye, Edit, Phone, CheckCircle, Clock, AlertTriangle, Download, RefreshCw, Calendar, MapPin, Star, Building2, Heart, Activity, BarChart3, TrendingUp, FileText, X } from 'lucide-react';
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
import { Button, Card, Input, Badge, Modal, ConfirmationModal } from '../ui';
import BeneficiaryProfileModal from '../BeneficiaryProfileModal';

interface IndividualSendPageProps {
  preselectedBeneficiaryId?: string;
  onNavigateBack?: () => void;
}

export default function IndividualSendPage({ preselectedBeneficiaryId }: IndividualSendPageProps) {
  const { logInfo, logError } = useErrorLogger();
  
  // State management
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>(preselectedBeneficiaryId || '');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [supporterType, setSupporterType] = useState<'organization' | 'family'>('organization');
  const [customSupporter, setCustomSupporter] = useState<string>('');
  const [useCustomSupporter, setUseCustomSupporter] = useState(false);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [notes, setNotes] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'search' | 'preview' | 'details'>('search');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Get filtered data based on supporter type
  const availableTemplates = supporterType === 'organization' && selectedOrganization
    ? mockPackageTemplates.filter(t => t.organization_id === selectedOrganization)
    : supporterType === 'family' && selectedFamily
    ? mockPackageTemplates.filter(t => t.organization_id === selectedFamily)
    : [];

  const selectedBeneficiaryData = selectedBeneficiary 
    ? mockBeneficiaries.find(b => b.id === selectedBeneficiary)
    : null;

  const filteredBeneficiaries = mockBeneficiaries.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.nationalId.includes(searchTerm) ||
    b.phone.includes(searchTerm)
  );

  React.useEffect(() => {
    if (preselectedBeneficiaryId) {
      setSelectedBeneficiary(preselectedBeneficiaryId);
      logInfo(`تم تحديد مستفيد مسبقاً: ${preselectedBeneficiaryId}`, 'IndividualSendPage');
    }
  }, [preselectedBeneficiaryId, logInfo]);

  const handleSupporterTypeChange = (type: 'organization' | 'family') => {
    setSupporterType(type);
    setSelectedOrganization('');
    setSelectedFamily('');
    setSelectedTemplate('');
    setUseCustomSupporter(false);
    setCustomSupporter('');
  };

  const handleBeneficiarySearch = () => {
    setModalType('search');
    setShowModal(true);
  };

  const handleSelectBeneficiary = (beneficiaryId: string) => {
    setSelectedBeneficiary(beneficiaryId);
    setShowModal(false);
    logInfo(`تم اختيار المستفيد: ${beneficiaryId}`, 'IndividualSendPage');
  };

  const handleViewBeneficiaryDetails = () => {
    if (selectedBeneficiaryData) {
      setShowBeneficiaryModal(true);
    }
  };

  const handlePreviewTask = () => {
    if (!selectedBeneficiary) {
      setNotification({ message: 'يرجى اختيار مستفيد أولاً', type: 'error' });
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

    setModalType('preview');
    setShowModal(true);
  };

  const handleCreateTask = () => {
    setShowConfirmModal(true);
  };

  const executeCreateTask = () => {
    // محاكاة إنشاء المهمة
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      packageId: selectedTemplate,
      beneficiaryId: selectedBeneficiary,
      status: 'pending',
      priority: priority,
      createdAt: new Date().toISOString(),
      scheduledAt: scheduledDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      notes: notes || `إرسال فردي - ${supporterType === 'organization' ? 'مؤسسة' : 'عائلة'}: ${
        useCustomSupporter ? customSupporter :
        supporterType === 'organization' ? mockOrganizations.find(o => o.id === selectedOrganization)?.name :
        mockFamilies.find(f => f.id === selectedFamily)?.name
      }`
    };

    // إضافة المهمة للبيانات الوهمية
    mockTasks.unshift(newTask);

    setNotification({ 
      message: `تم إنشاء مهمة التوزيع بنجاح للمستفيد ${selectedBeneficiaryData?.name}`, 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 5000);

    // إعادة تعيين النموذج
    setSelectedBeneficiary('');
    setSelectedTemplate('');
    setSelectedOrganization('');
    setSelectedFamily('');
    setCustomSupporter('');
    setUseCustomSupporter(false);
    setPriority('medium');
    setNotes('');
    setScheduledDate('');

    logInfo(`تم إنشاء مهمة توزيع فردية للمستفيد: ${selectedBeneficiaryData?.name}`, 'IndividualSendPage');
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
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return 'غير محدد';
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

      {/* Step 1: Choose Beneficiary */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <User className="w-5 h-5 ml-2 text-blue-600" />
          الخطوة 1: اختيار المستفيد
        </h3>

        <div className="space-y-4">
          {selectedBeneficiaryData ? (
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-blue-800">{selectedBeneficiaryData.name}</h4>
                    <p className="text-blue-700 text-sm">رقم الهوية: {selectedBeneficiaryData.nationalId}</p>
                    <p className="text-blue-600 text-sm">الهاتف: {selectedBeneficiaryData.phone}</p>
                    <p className="text-blue-600 text-sm">العنوان: {selectedBeneficiaryData.detailedAddress.district}</p>
                  </div>
                </div>
                <div className="flex space-x-2 space-x-reverse">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Eye}
                    onClick={handleViewBeneficiaryDetails}
                  >
                    عرض التفاصيل
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Search}
                    onClick={handleBeneficiarySearch}
                  >
                    تغيير المستفيد
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-4">لم يتم اختيار مستفيد بعد</p>
              <Button
                variant="primary"
                icon={Search}
                iconPosition="right"
                onClick={handleBeneficiarySearch}
              >
                البحث عن مستفيد
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Step 2: Choose Supporter Type */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Building2 className="w-5 h-5 ml-2 text-green-600" />
          الخطوة 2: اختيار نوع الداعم
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

      {/* Step 3: Choose Supporter */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          {supporterType === 'organization' ? (
            <Building2 className="w-5 h-5 ml-2 text-blue-600" />
          ) : (
            <Heart className="w-5 h-5 ml-2 text-purple-600" />
          )}
          الخطوة 3: اختيار {supporterType === 'organization' ? 'المؤسسة' : 'العائلة'}
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

      {/* Step 4: Choose Package Template */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Package className="w-5 h-5 ml-2 text-green-600" />
          الخطوة 4: اختيار قالب الطرد
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

      {/* Step 5: Task Settings */}
      <Card>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Settings className="w-5 h-5 ml-2 text-purple-600" />
          الخطوة 5: إعدادات المهمة
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              أولوية المهمة
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجل</option>
            </select>
            <div className="mt-2">
              <Badge variant={
                priority === 'urgent' ? 'error' :
                priority === 'high' ? 'warning' :
                priority === 'medium' ? 'info' : 'neutral'
              } size="sm">
                {getPriorityText(priority)}
              </Badge>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              موعد التسليم المفضل (اختياري)
            </label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-gray-500 mt-1">
              إذا لم يتم تحديد موعد، سيتم الجدولة خلال 24 ساعة
            </p>
          </div>

          <div className="md:col-span-2">
            <Input
              label="ملاحظات خاصة (اختياري)"
              type="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات خاصة للمندوب أو تعليمات للتسليم..."
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Preview and Create Task */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <div className="text-center">
            <div className="bg-blue-100 p-4 rounded-xl w-fit mx-auto mb-4">
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">معاينة المهمة</h3>
            <p className="text-gray-600 mb-6">
              راجع تفاصيل المهمة قبل الإنشاء
            </p>
            <Button
              variant="primary"
              icon={Eye}
              iconPosition="right"
              onClick={handlePreviewTask}
              disabled={!selectedBeneficiary || !selectedTemplate}
              className="w-full"
            >
              معاينة تفاصيل المهمة
            </Button>
          </div>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <div className="text-center">
            <div className="bg-green-100 p-4 rounded-xl w-fit mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">إنشاء مهمة التوزيع</h3>
            <p className="text-gray-600 mb-6">
              إنشاء مهمة توزيع فردية للمستفيد المحدد
            </p>
            <Button
              variant="success"
              icon={Send}
              iconPosition="right"
              onClick={handleCreateTask}
              disabled={!selectedBeneficiary || !selectedTemplate}
              className="w-full"
            >
              إنشاء مهمة التوزيع
            </Button>
          </div>
        </Card>
      </div>

      {/* Summary Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-xl mb-2">
              <User className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm text-blue-600">مستفيد محدد</p>
            <p className="text-2xl font-bold text-blue-900">{selectedBeneficiary ? '1' : '0'}</p>
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
            <p className="text-sm text-orange-600">جاهز للإنشاء</p>
            <p className="text-2xl font-bold text-orange-900">
              {(selectedBeneficiary && selectedTemplate && (selectedOrganization || selectedFamily || useCustomSupporter)) ? '1' : '0'}
            </p>
          </div>
        </Card>
      </div>

      {/* Modal for Search/Preview */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'search' ? 'البحث عن مستفيد' :
            modalType === 'preview' ? 'معاينة تفاصيل المهمة' :
            'تفاصيل إضافية'
          }
          size="lg"
        >
          <div className="p-6">
            {/* Search Modal */}
            {modalType === 'search' && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-3">البحث في المستفيدين</h4>
                  <Input
                    type="text"
                    icon={Search}
                    iconPosition="right"
                    placeholder="البحث بالاسم، رقم الهوية، أو رقم الهاتف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {filteredBeneficiaries.length > 0 ? (
                    <div className="space-y-2">
                      {filteredBeneficiaries.slice(0, 20).map((beneficiary) => (
                        <div
                          key={beneficiary.id}
                          onClick={() => handleSelectBeneficiary(beneficiary.id)}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all"
                        >
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{beneficiary.name}</p>
                              <p className="text-sm text-gray-600">رقم الهوية: {beneficiary.nationalId}</p>
                              <p className="text-sm text-gray-500">الهاتف: {beneficiary.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={
                                beneficiary.identityStatus === 'verified' ? 'success' :
                                beneficiary.identityStatus === 'pending' ? 'warning' : 'error'
                              }
                              size="sm"
                            >
                              {beneficiary.identityStatus === 'verified' ? 'موثق' :
                               beneficiary.identityStatus === 'pending' ? 'بانتظار التوثيق' : 'مرفوض'}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">{beneficiary.detailedAddress.district}</p>
                          </div>
                        </div>
                      ))}
                      {filteredBeneficiaries.length > 20 && (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">عرض أول 20 نتيجة من {filteredBeneficiaries.length} مستفيد</p>
                          <p className="text-xs mt-1">استخدم البحث لتضييق النتائج</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>لا توجد نتائج للبحث</p>
                      <p className="text-sm mt-1">جرب تعديل مصطلح البحث</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}

            {/* Preview Modal */}
            {modalType === 'preview' && (
              <div className="space-y-6">
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <h4 className="text-lg font-bold text-green-800 mb-4">معاينة مهمة التوزيع</h4>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-green-700 mb-2">معلومات المستفيد</h5>
                        <div className="bg-white p-3 rounded-lg text-sm">
                          <p><strong>الاسم:</strong> {selectedBeneficiaryData?.name}</p>
                          <p><strong>رقم الهوية:</strong> {selectedBeneficiaryData?.nationalId}</p>
                          <p><strong>الهاتف:</strong> {selectedBeneficiaryData?.phone}</p>
                          <p><strong>العنوان:</strong> {selectedBeneficiaryData?.detailedAddress.district}</p>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-green-700 mb-2">معلومات الداعم</h5>
                        <div className="bg-white p-3 rounded-lg text-sm">
                          <p><strong>النوع:</strong> {supporterType === 'organization' ? 'مؤسسة' : 'عائلة'}</p>
                          <p><strong>الاسم:</strong> {
                            useCustomSupporter ? customSupporter :
                            supporterType === 'organization' ? mockOrganizations.find(o => o.id === selectedOrganization)?.name :
                            mockFamilies.find(f => f.id === selectedFamily)?.name
                          }</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-green-700 mb-2">تفاصيل الطرد</h5>
                        <div className="bg-white p-3 rounded-lg text-sm">
                          {(() => {
                            const template = availableTemplates.find(t => t.id === selectedTemplate);
                            return template ? (
                              <>
                                <p><strong>اسم القالب:</strong> {template.name}</p>
                                <p><strong>عدد العناصر:</strong> {template.contents.length}</p>
                                <p><strong>الوزن:</strong> {template.totalWeight} كيلو</p>
                                <p><strong>الوصف:</strong> {template.description}</p>
                              </>
                            ) : <p className="text-gray-500">لا توجد تفاصيل متاحة</p>;
                          })()}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-green-700 mb-2">إعدادات المهمة</h5>
                        <div className="bg-white p-3 rounded-lg text-sm">
                          <p><strong>الأولوية:</strong> 
                            <Badge variant={
                              priority === 'urgent' ? 'error' :
                              priority === 'high' ? 'warning' :
                              priority === 'medium' ? 'info' : 'neutral'
                            } size="sm" className="mr-2">
                              {getPriorityText(priority)}
                            </Badge>
                          </p>
                          <p><strong>الموعد المحدد:</strong> {
                            scheduledDate 
                              ? new Date(scheduledDate).toLocaleString('ar-SA')
                              : 'خلال 24 ساعة (افتراضي)'
                          }</p>
                          {notes && <p><strong>الملاحظات:</strong> {notes}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إغلاق المعاينة
                  </Button>
                  <Button variant="success" onClick={() => {
                    setShowModal(false);
                    handleCreateTask();
                  }}>
                    إنشاء المهمة
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Beneficiary Details Modal */}
      {showBeneficiaryModal && selectedBeneficiaryData && (
        <BeneficiaryProfileModal
          beneficiary={selectedBeneficiaryData}
          onClose={() => setShowBeneficiaryModal(false)}
          onNavigateToIndividualSend={() => {}}
          onEditBeneficiary={() => {
            setNotification({ message: 'سيتم فتح نموذج تعديل المستفيد', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeCreateTask}
        title="تأكيد إنشاء مهمة التوزيع"
        message={`هل أنت متأكد من إنشاء مهمة توزيع للمستفيد "${selectedBeneficiaryData?.name}"؟

تفاصيل المهمة:
• المستفيد: ${selectedBeneficiaryData?.name} (${selectedBeneficiaryData?.nationalId})
• قالب الطرد: ${availableTemplates.find(t => t.id === selectedTemplate)?.name || 'غير محدد'}
• الداعم: ${useCustomSupporter ? customSupporter :
  supporterType === 'organization' ? mockOrganizations.find(o => o.id === selectedOrganization)?.name :
  mockFamilies.find(f => f.id === selectedFamily)?.name}
• الأولوية: ${getPriorityText(priority)}
• الموعد: ${scheduledDate ? new Date(scheduledDate).toLocaleString('ar-SA') : 'خلال 24 ساعة'}

سيتم إنشاء المهمة وإضافتها لقائمة المهام.`}
        confirmButtonText="إنشاء المهمة"
        confirmButtonVariant="success"
        type="success"
      />

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <Send className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">إرشادات الإرسال الفردي</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>ابدأ باختيار المستفيد، ثم نوع الداعم، ثم القالب المناسب</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن تحديد أولوية المهمة وموعد التسليم المفضل</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>استخدم المعاينة للتأكد من صحة جميع التفاصيل قبل الإنشاء</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>تأكد من صحة بيانات المستفيد وتوفر قالب الطرد المناسب</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}