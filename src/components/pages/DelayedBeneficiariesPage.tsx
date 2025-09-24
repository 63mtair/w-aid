import React, { useState } from 'react';
import { Clock, Edit, Phone, AlertTriangle, CheckCircle, X, RefreshCw, Download, Search, Filter, Calendar, MapPin, Users, Send, MessageSquare, TrendingUp, Activity } from 'lucide-react';
import { mockBeneficiaries, type Beneficiary } from '../../data/mockData';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal, ConfirmationModal } from '../ui';
import BeneficiaryProfileModal from '../BeneficiaryProfileModal';

export default function DelayedBeneficiariesPage() {
  const { logInfo, logError } = useErrorLogger();
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [delayFilter, setDelayFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'details' | 'edit' | 'reschedule' | 'bulk-reminder'>('details');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'reschedule' | 'bulk-reminder' | 'update-address';
    beneficiaryId?: string;
    beneficiaryName?: string;
    beneficiaryIds?: string[];
  } | null>(null);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // محاكاة المستفيدين المتأخرين (آخر 10 مستفيدين كمثال)
  const delayedBeneficiaries = mockBeneficiaries.slice(0, 10).map(b => ({
    ...b,
    delayDays: Math.floor(Math.random() * 7) + 1, // 1-7 أيام تأخير
    delayReason: ['عنوان غير صحيح', 'عدم توفر المستفيد', 'مشكلة في التوصيل', 'ظروف أمنية'][Math.floor(Math.random() * 4)]
  }));

  // فلترة المستفيدين المتأخرين
  const filteredDelayedBeneficiaries = delayedBeneficiaries.filter(beneficiary => {
    const matchesSearch = beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         beneficiary.nationalId.includes(searchTerm) ||
                         beneficiary.phone.includes(searchTerm);
    
    const matchesRegion = regionFilter === 'all' || beneficiary.detailedAddress.governorate === regionFilter;
    
    const matchesDelay = delayFilter === 'all' || 
                        (delayFilter === 'recent' && beneficiary.delayDays <= 3) ||
                        (delayFilter === 'old' && beneficiary.delayDays > 3);
    
    return matchesSearch && matchesRegion && matchesDelay;
  });

  // إحصائيات
  const statistics = {
    total: delayedBeneficiaries.length,
    recent: delayedBeneficiaries.filter(b => b.delayDays <= 3).length,
    old: delayedBeneficiaries.filter(b => b.delayDays > 3).length,
    wrongAddress: delayedBeneficiaries.filter(b => b.delayReason === 'عنوان غير صحيح').length,
    unavailable: delayedBeneficiaries.filter(b => b.delayReason === 'عدم توفر المستفيد').length,
    deliveryIssues: delayedBeneficiaries.filter(b => b.delayReason === 'مشكلة في التوصيل').length,
    securityIssues: delayedBeneficiaries.filter(b => b.delayReason === 'ظروف أمنية').length
  };

  const regions = [...new Set(mockBeneficiaries.map(b => b.detailedAddress.governorate))];

  const handleEditBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setModalType('edit');
    setShowModal(true);
  };

  const handleCall = (phone: string) => {
    if (confirm(`هل تريد الاتصال بالرقم ${phone}؟`)) {
      window.open(`tel:${phone}`);
    }
  };

  const handleReschedule = (beneficiary: Beneficiary) => {
    setConfirmAction({
      type: 'reschedule',
      beneficiaryId: beneficiary.id,
      beneficiaryName: beneficiary.name
    });
    setShowConfirmModal(true);
  };

  const handleBulkReminder = () => {
    if (selectedBeneficiaries.length === 0) {
      setNotification({ message: 'يرجى تحديد مستفيدين أولاً', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    setConfirmAction({
      type: 'bulk-reminder',
      beneficiaryIds: selectedBeneficiaries
    });
    setShowConfirmModal(true);
  };

  const handleSelectBeneficiary = (beneficiaryId: string) => {
    setSelectedBeneficiaries(prev => 
      prev.includes(beneficiaryId) 
        ? prev.filter(id => id !== beneficiaryId)
        : [...prev, beneficiaryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBeneficiaries.length === filteredDelayedBeneficiaries.length) {
      setSelectedBeneficiaries([]);
    } else {
      setSelectedBeneficiaries(filteredDelayedBeneficiaries.map(b => b.id));
    }
  };

  const executeConfirmedAction = () => {
    if (!confirmAction) return;
    
    try {
      switch (confirmAction.type) {
        case 'reschedule':
          if (confirmAction.beneficiaryId) {
            setNotification({ 
              message: `تم إعادة جدولة التوصيل لـ ${confirmAction.beneficiaryName} بنجاح. سيتم التواصل مع المستفيد لتحديد موعد جديد.`, 
              type: 'success' 
            });
            setTimeout(() => setNotification(null), 5000);
            logInfo(`تم إعادة جدولة التوصيل لـ ${confirmAction.beneficiaryName}`, 'DelayedBeneficiariesPage');
          }
          break;
          
        case 'bulk-reminder':
          if (confirmAction.beneficiaryIds) {
            setNotification({ 
              message: `تم إرسال تذكير جماعي لـ ${confirmAction.beneficiaryIds.length} مستفيد عبر الرسائل النصية`, 
              type: 'success' 
            });
            setTimeout(() => setNotification(null), 5000);
            setSelectedBeneficiaries([]);
            logInfo(`تم إرسال تذكير جماعي لـ ${confirmAction.beneficiaryIds.length} مستفيد`, 'DelayedBeneficiariesPage');
          }
          break;
          
        case 'update-address':
          if (confirmAction.beneficiaryId) {
            setNotification({ 
              message: `تم تحديث عنوان ${confirmAction.beneficiaryName} بنجاح. سيتم إعادة جدولة التوصيل.`, 
              type: 'success' 
            });
            setTimeout(() => setNotification(null), 5000);
            logInfo(`تم تحديث عنوان ${confirmAction.beneficiaryName}`, 'DelayedBeneficiariesPage');
          }
          break;
      }
    } catch (error) {
      logError(error as Error, 'DelayedBeneficiariesPage');
      setNotification({ 
        message: 'حدث خطأ في تنفيذ العملية', 
        type: 'error' 
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getConfirmationMessage = () => {
    if (!confirmAction) return { title: '', message: '', confirmText: '', variant: 'primary' as const };
    
    switch (confirmAction.type) {
      case 'reschedule':
        return {
          title: 'تأكيد إعادة جدولة التوصيل',
          message: `هل تريد إعادة جدولة التوصيل للمستفيد "${confirmAction.beneficiaryName}"؟\n\nسيتم:\n• إرسال رسالة نصية للمستفيد لتحديد موعد جديد\n• تحديث حالة الطرد إلى "معاد جدولته"\n• إشعار المندوب بالتغيير\n• إضافة المهمة لقائمة الأولوية`,
          confirmText: 'إعادة الجدولة',
          variant: 'warning' as const
        };
      case 'bulk-reminder':
        return {
          title: 'تأكيد إرسال تذكير جماعي',
          message: `هل تريد إرسال تذكير جماعي لـ ${confirmAction.beneficiaryIds?.length} مستفيد؟\n\nسيتم:\n• إرسال رسائل نصية لجميع المستفيدين المحددين\n• تذكيرهم بموعد استلام الطرد\n• إرسال معلومات الاتصال للاستفسارات\n• تحديث سجل المتابعة`,
          confirmText: `إرسال تذكير لـ ${confirmAction.beneficiaryIds?.length} مستفيد`,
          variant: 'primary' as const
        };
      case 'update-address':
        return {
          title: 'تأكيد تحديث العنوان',
          message: `هل تريد تحديث عنوان المستفيد "${confirmAction.beneficiaryName}"؟\n\nسيتم:\n• فتح نموذج تحديث العنوان\n• التحقق من العنوان الجديد\n• إعادة جدولة التوصيل للعنوان الجديد\n• إشعار المندوب بالتغيير`,
          confirmText: 'تحديث العنوان',
          variant: 'primary' as const
        };
      default:
        return { title: '', message: '', confirmText: '', variant: 'primary' as const };
    }
  };

  const handleExportDelayed = () => {
    const exportData = {
      date: new Date().toISOString(),
      totalDelayed: delayedBeneficiaries.length,
      filteredDelayed: filteredDelayedBeneficiaries.length,
      statistics,
      delayedBeneficiaries: filteredDelayedBeneficiaries.map(b => ({
        name: b.name,
        nationalId: b.nationalId,
        phone: b.phone,
        address: b.detailedAddress.district,
        delayDays: b.delayDays,
        delayReason: b.delayReason,
        lastAttempt: b.lastReceived
      }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `المستفيدين_المتأخرين_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير قائمة المتأخرين بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
    logInfo('تم تصدير قائمة المستفيدين المتأخرين', 'DelayedBeneficiariesPage');
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

      {/* Data Source Indicator */}
      <Card className="bg-orange-50 border-orange-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-orange-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">
            البيانات الوهمية محملة - {delayedBeneficiaries.length} مستفيد متأخر
          </span>
        </div>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3 space-x-reverse">
          {selectedBeneficiaries.length > 0 && (
            <Badge variant="warning" className="px-3 py-2">
              {selectedBeneficiaries.length} مستفيد محدد
            </Badge>
          )}
          <Button 
            variant="warning" 
            icon={Send} 
            iconPosition="right"
            onClick={handleBulkReminder}
            disabled={selectedBeneficiaries.length === 0}
          >
            {selectedBeneficiaries.length > 0 ? `إرسال تذكير (${selectedBeneficiaries.length})` : 'إرسال تذكير جماعي'}
          </Button>
          <Button 
            variant="primary" 
            icon={Download} 
            iconPosition="right"
            onClick={handleExportDelayed}
          >
            تصدير القائمة
          </Button>
          <Button 
            variant="secondary" 
            icon={RefreshCw} 
            iconPosition="right"
            onClick={() => {
              setNotification({ message: 'تم تحديث قائمة المتأخرين', type: 'success' });
              setTimeout(() => setNotification(null), 3000);
            }}
          >
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="grid md:grid-cols-4 gap-4">
          <Input
            type="text"
            icon={Search}
            iconPosition="right"
            placeholder="البحث في المتأخرين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع المناطق</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">فترة التأخير</label>
            <select
              value={delayFilter}
              onChange={(e) => setDelayFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الفترات</option>
              <option value="recent">حديث (1-3 أيام)</option>
              <option value="old">قديم (أكثر من 3 أيام)</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setRegionFilter('all');
                setDelayFilter('all');
                setSelectedBeneficiaries([]);
              }}
              className="w-full"
            >
              إعادة تعيين الفلاتر
            </Button>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-orange-50">
          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-xl mb-2">
              <Clock className="w-6 h-6 text-orange-600 mx-auto" />
            </div>
            <p className="text-sm text-orange-600">إجمالي المتأخرين</p>
            <p className="text-2xl font-bold text-orange-900">{statistics.total}</p>
          </div>
        </Card>

        <Card className="bg-yellow-50">
          <div className="text-center">
            <div className="bg-yellow-100 p-3 rounded-xl mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mx-auto" />
            </div>
            <p className="text-sm text-yellow-600">تأخير حديث</p>
            <p className="text-2xl font-bold text-yellow-900">{statistics.recent}</p>
            <p className="text-xs text-yellow-700">1-3 أيام</p>
          </div>
        </Card>

        <Card className="bg-red-50">
          <div className="text-center">
            <div className="bg-red-100 p-3 rounded-xl mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600 mx-auto" />
            </div>
            <p className="text-sm text-red-600">تأخير قديم</p>
            <p className="text-2xl font-bold text-red-900">{statistics.old}</p>
            <p className="text-xs text-red-700">أكثر من 3 أيام</p>
          </div>
        </Card>

        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-xl mb-2">
              <MapPin className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm text-blue-600">عناوين خاطئة</p>
            <p className="text-2xl font-bold text-blue-900">{statistics.wrongAddress}</p>
            <p className="text-xs text-blue-700">تحتاج تحديث</p>
          </div>
        </Card>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedBeneficiaries.length > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-800">
                تم تحديد {selectedBeneficiaries.length} مستفيد متأخر
              </span>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button
                variant="warning"
                size="sm"
                icon={Send}
                iconPosition="right"
                onClick={handleBulkReminder}
              >
                إرسال تذكير ({selectedBeneficiaries.length})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={X}
                onClick={() => setSelectedBeneficiaries([])}
              >
                إلغاء التحديد
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Delayed Beneficiaries Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <input
                type="checkbox"
                checked={selectedBeneficiaries.length === filteredDelayedBeneficiaries.length && filteredDelayedBeneficiaries.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <h3 className="text-lg font-semibold text-gray-900">
                قائمة المتأخرين ({filteredDelayedBeneficiaries.length})
              </h3>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-orange-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">البيانات الوهمية</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اختيار
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستفيد
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الهاتف
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المنطقة
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  أيام التأخير
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  سبب التأخير
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  آخر محاولة
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDelayedBeneficiaries.length > 0 ? (
                filteredDelayedBeneficiaries.map((beneficiary) => (
                  <tr key={beneficiary.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedBeneficiaries.includes(beneficiary.id)}
                        onChange={() => handleSelectBeneficiary(beneficiary.id)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-orange-100 p-2 rounded-lg ml-4">
                          <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{beneficiary.name}</div>
                          <div className="text-sm text-gray-500">رقم الهوية: {beneficiary.nationalId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {beneficiary.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {beneficiary.detailedAddress.district}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={beneficiary.delayDays <= 3 ? 'warning' : 'error'}
                        size="sm"
                      >
                        {beneficiary.delayDays} {beneficiary.delayDays === 1 ? 'يوم' : 'أيام'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <Badge 
                        variant={
                          beneficiary.delayReason === 'عنوان غير صحيح' ? 'error' :
                          beneficiary.delayReason === 'عدم توفر المستفيد' ? 'warning' :
                          beneficiary.delayReason === 'ظروف أمنية' ? 'error' : 'info'
                        }
                        size="sm"
                      >
                        {beneficiary.delayReason}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(beneficiary.lastReceived).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Eye}
                          onClick={() => {
                            setSelectedBeneficiary(beneficiary);
                            setModalType('details');
                            setShowModal(true);
                          }}
                        >
                          عرض
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Edit}
                          onClick={() => {
                            if (beneficiary.delayReason === 'عنوان غير صحيح') {
                              setConfirmAction({
                                type: 'update-address',
                                beneficiaryId: beneficiary.id,
                                beneficiaryName: beneficiary.name
                              });
                              setShowConfirmModal(true);
                            } else {
                              handleEditBeneficiary(beneficiary);
                            }
                          }}
                        >
                          {beneficiary.delayReason === 'عنوان غير صحيح' ? 'تحديث العنوان' : 'تعديل'}
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          icon={Calendar}
                          onClick={() => handleReschedule(beneficiary)}
                        >
                          إعادة جدولة
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Phone}
                          onClick={() => handleCall(beneficiary.phone)}
                        >
                          اتصال
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">
                        {searchTerm || regionFilter !== 'all' || delayFilter !== 'all' 
                          ? 'لا توجد نتائج مطابقة للفلاتر' 
                          : 'لا توجد حالات تأخير'}
                      </p>
                      <p className="text-sm mt-2">
                        {searchTerm || regionFilter !== 'all' || delayFilter !== 'all'
                          ? 'جرب تعديل الفلاتر أو مصطلح البحث'
                          : 'جميع الطرود تم تسليمها في الوقت المحدد'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delay Analysis */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">تحليل أسباب التأخير</h3>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">عناوين غير صحيحة</span>
                </div>
                <span className="text-2xl font-bold text-red-900">{statistics.wrongAddress}</span>
              </div>
              <p className="text-sm text-red-600 mt-2">تحتاج تحديث العنوان</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Users className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">عدم توفر المستفيد</span>
                </div>
                <span className="text-2xl font-bold text-yellow-900">{statistics.unavailable}</span>
              </div>
              <p className="text-sm text-yellow-600 mt-2">تحتاج إعادة جدولة</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">مشاكل في التوصيل</span>
                </div>
                <span className="text-2xl font-bold text-blue-900">{statistics.deliveryIssues}</span>
              </div>
              <p className="text-sm text-blue-600 mt-2">تحتاج متابعة خاصة</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <AlertTriangle className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">ظروف أمنية</span>
                </div>
                <span className="text-2xl font-bold text-purple-900">{statistics.securityIssues}</span>
              </div>
              <p className="text-sm text-purple-600 mt-2">تحتاج تنسيق أمني</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h3>
          <div className="space-y-4">
            <Button
              variant="primary"
              icon={MessageSquare}
              iconPosition="right"
              onClick={() => {
                setNotification({ 
                  message: 'تم إرسال رسائل تذكير لجميع المتأخرين', 
                  type: 'success' 
                });
                setTimeout(() => setNotification(null), 3000);
              }}
              className="w-full"
            >
              إرسال تذكير لجميع المتأخرين
            </Button>
            
            <Button
              variant="warning"
              icon={Calendar}
              iconPosition="right"
              onClick={() => {
                setNotification({ 
                  message: 'تم إعادة جدولة جميع الطرود المتأخرة', 
                  type: 'warning' 
                });
                setTimeout(() => setNotification(null), 3000);
              }}
              className="w-full"
            >
              إعادة جدولة جماعية
            </Button>
            
            <Button
              variant="secondary"
              icon={MapPin}
              iconPosition="right"
              onClick={() => {
                setNotification({ 
                  message: 'تم فتح أداة تحديث العناوين الجماعي', 
                  type: 'success' 
                });
                setTimeout(() => setNotification(null), 3000);
              }}
              className="w-full"
            >
              تحديث العناوين الخاطئة
            </Button>
            
            <Button
              variant="success"
              icon={Activity}
              iconPosition="right"
              onClick={() => {
                setNotification({ 
                  message: 'تم إنشاء تقرير تحليل التأخير', 
                  type: 'success' 
                });
                setTimeout(() => setNotification(null), 3000);
              }}
              className="w-full"
            >
              تحليل أسباب التأخير
            </Button>
          </div>
        </Card>
      </div>

      {/* Delay Trends */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">اتجاهات التأخير</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">تحسن الأداء</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">هذا الأسبوع:</span>
                <span className="font-medium text-green-900">-15% تأخير</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">متوسط وقت الحل:</span>
                <span className="font-medium text-green-900">2.3 ساعة</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">معدل الحل</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">تم حل:</span>
                <span className="font-medium text-blue-900">87% من الحالات</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">متوسط المحاولات:</span>
                <span className="font-medium text-blue-900">2.1 محاولة</span>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-2 space-x-reverse mb-3">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-800">أفضل وقت للمتابعة</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-700">الوقت الأمثل:</span>
                <span className="font-medium text-purple-900">10:00-14:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">أفضل يوم:</span>
                <span className="font-medium text-purple-900">الأحد</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
      </div>

      {/* Modal for Details/Edit */}
      {showModal && selectedBeneficiary && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'details' ? 'تفاصيل المستفيد المتأخر' :
            modalType === 'edit' ? 'تعديل بيانات المستفيد' :
            'إجراء'
          }
          size="lg"
        >
          {modalType === 'details' && (
            <BeneficiaryProfileModal
              beneficiary={selectedBeneficiary}
              onClose={() => setShowModal(false)}
              onNavigateToIndividualSend={() => {}}
              onEditBeneficiary={(beneficiary) => {
                setModalType('edit');
              }}
            />
          )}
          
          {modalType === 'edit' && (
            <div className="p-6 text-center">
              <div className="bg-gray-100 rounded-xl p-8 mb-4">
                <Edit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">نموذج تعديل بيانات المستفيد</p>
                <p className="text-sm text-gray-500 mt-2">سيتم دمج BeneficiaryForm هنا</p>
              </div>
              
              <div className="flex space-x-3 space-x-reverse justify-center">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  إلغاء
                </Button>
                <Button variant="primary">
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Confirmation Modal */}
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
        type={getConfirmationMessage().variant === 'warning' ? 'warning' : 'info'}
      />
    </div>
  );
}