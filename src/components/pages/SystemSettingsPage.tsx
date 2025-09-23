import React, { useState } from 'react';
import { Settings, Shield, Database, Bell, Globe, Clock, Save, RefreshCw, AlertTriangle, CheckCircle, Lock, Unlock, Eye, EyeOff, Download, Upload, Trash2, Plus, Edit, X, Key, Server, Monitor, Wifi, HardDrive, Activity, Users, Package, Truck, BarChart3, Mail, Phone, MessageSquare } from 'lucide-react';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal } from '../ui';

interface SystemSetting {
  id: string;
  key: string;
  name: string;
  description: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'password';
  options?: string[];
  isSecret?: boolean;
  lastModified: string;
  modifiedBy: string;
  icon: any;
}

export default function SystemSettingsPage() {
  const { logInfo, logError } = useErrorLogger();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'import' | 'export'>('add');
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // إعدادات النظام الموحدة (فئة واحدة فقط)
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([
    {
      id: '1',
      key: 'app_name',
      name: 'اسم التطبيق',
      description: 'الاسم الظاهر للتطبيق في جميع الواجهات والصفحات',
      value: 'منصة المساعدات الإنسانية',
      type: 'text',
      lastModified: '2024-12-21',
      modifiedBy: 'أحمد الإدمن',
      icon: Globe
    },
    {
      id: '2',
      key: 'app_version',
      name: 'إصدار التطبيق',
      description: 'رقم إصدار التطبيق الحالي المعروض للمستخدمين',
      value: '1.0.0',
      type: 'text',
      lastModified: '2024-12-21',
      modifiedBy: 'النظام',
      icon: Package
    },
    {
      id: '3',
      key: 'max_beneficiaries_per_page',
      name: 'عدد المستفيدين في الصفحة',
      description: 'الحد الأقصى لعدد المستفيدين المعروضين في صفحة واحدة',
      value: '50',
      type: 'select',
      options: ['10', '20', '50', '100'],
      lastModified: '2024-12-20',
      modifiedBy: 'أحمد الإدمن',
      icon: Users
    },
    {
      id: '4',
      key: 'enable_rtl',
      name: 'دعم اللغة العربية',
      description: 'تفعيل دعم الكتابة من اليمين لليسار والخطوط العربية',
      value: 'true',
      type: 'boolean',
      lastModified: '2024-12-21',
      modifiedBy: 'أحمد الإدمن',
      icon: Globe
    },
    {
      id: '5',
      key: 'sms_provider',
      name: 'مزود خدمة الرسائل النصية',
      description: 'مزود الخدمة المستخدم لإرسال الرسائل النصية والتنبيهات',
      value: 'twilio',
      type: 'select',
      options: ['twilio', 'nexmo', 'local'],
      lastModified: '2024-12-20',
      modifiedBy: 'أحمد الإدمن',
      icon: MessageSquare
    },
    {
      id: '6',
      key: 'email_notifications',
      name: 'تفعيل الإشعارات بالبريد الإلكتروني',
      description: 'إرسال إشعارات للمستخدمين والمديرين عبر البريد الإلكتروني',
      value: 'true',
      type: 'boolean',
      lastModified: '2024-12-21',
      modifiedBy: 'أحمد الإدمن',
      icon: Mail
    },
    {
      id: '7',
      key: 'sms_api_key',
      name: 'مفتاح API للرسائل النصية',
      description: 'مفتاح API الخاص بمزود خدمة الرسائل النصية (سري)',
      value: 'sk_sms_1234567890',
      type: 'password',
      isSecret: true,
      lastModified: '2024-12-20',
      modifiedBy: 'أحمد الإدمن',
      icon: Key
    },
    {
      id: '8',
      key: 'default_language',
      name: 'اللغة الافتراضية',
      description: 'اللغة الافتراضية لواجهة النظام',
      value: 'ar',
      type: 'select',
      options: ['ar', 'en'],
      lastModified: '2024-12-21',
      modifiedBy: 'أحمد الإدمن',
      icon: Globe
    },
    {
      id: '9',
      key: 'contact_email',
      name: 'بريد الدعم الفني',
      description: 'عنوان البريد الإلكتروني للدعم الفني والتواصل',
      value: 'support@humanitarian.ps',
      type: 'text',
      lastModified: '2024-12-19',
      modifiedBy: 'أحمد الإدمن',
      icon: Mail
    },
    {
      id: '10',
      key: 'organization_name',
      name: 'اسم المؤسسة المشغلة',
      description: 'اسم المؤسسة أو الجهة التي تدير النظام',
      value: 'وزارة التنمية الاجتماعية - غزة',
      type: 'text',
      lastModified: '2024-12-18',
      modifiedBy: 'أحمد الإدمن',
      icon: Building2
    }
  ]);

  const [editedSettings, setEditedSettings] = useState<{ [key: string]: string }>({});

  const filteredSettings = systemSettings.filter(setting => {
    const matchesSearch = setting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.key.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSettingChange = (settingId: string, value: string) => {
    setEditedSettings(prev => ({
      ...prev,
      [settingId]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      // محاكاة حفظ الإعدادات
      await new Promise(resolve => setTimeout(resolve, 1000));

      // تحديث الإعدادات في البيانات الوهمية
      setSystemSettings(prev => 
        prev.map(setting => ({
          ...setting,
          value: editedSettings[setting.id] || setting.value,
          lastModified: new Date().toISOString().split('T')[0],
          modifiedBy: 'أحمد الإدمن'
        }))
      );

      setEditedSettings({});
      setHasUnsavedChanges(false);
      setNotification({ message: 'تم حفظ الإعدادات بنجاح', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      logInfo('تم حفظ إعدادات النظام', 'SystemSettingsPage');
    } catch (error) {
      setNotification({ message: 'حدث خطأ في حفظ الإعدادات', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      logError(error as Error, 'SystemSettingsPage');
    }
  };

  const handleResetSettings = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات؟')) {
      setEditedSettings({});
      setHasUnsavedChanges(false);
      setNotification({ message: 'تم إعادة تعيين الإعدادات', type: 'warning' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleExportSettings = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      appName: systemSettings.find(s => s.key === 'app_name')?.value,
      totalSettings: systemSettings.length,
      settings: systemSettings.map(setting => ({
        key: setting.key,
        name: setting.name,
        value: setting.isSecret ? '***' : setting.value,
        type: setting.type,
        lastModified: setting.lastModified
      }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `إعدادات_النظام_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير الإعدادات بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleImportSettings = () => {
    setModalType('import');
    setShowModal(true);
  };

  const handleAddSetting = () => {
    setModalType('add');
    setSelectedSetting(null);
    setShowModal(true);
  };

  const handleEditSetting = (setting: SystemSetting) => {
    setModalType('edit');
    setSelectedSetting(setting);
    setShowModal(true);
  };

  const toggleSecretVisibility = (settingId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [settingId]: !prev[settingId]
    }));
  };

  const getSettingValue = (setting: SystemSetting) => {
    return editedSettings[setting.id] !== undefined ? editedSettings[setting.id] : setting.value;
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
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = getSettingValue(setting);
    const isEdited = editedSettings[setting.id] !== undefined;

    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="relative">
              <input
                type="checkbox"
                checked={value === 'true'}
                onChange={(e) => handleSettingChange(setting.id, e.target.checked ? 'true' : 'false')}
                className="sr-only"
                id={`toggle-${setting.id}`}
              />
              <label
                htmlFor={`toggle-${setting.id}`}
                className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors ${
                  value === 'true' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  value === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}></div>
              </label>
            </div>
            <span className={`text-sm font-medium ${value === 'true' ? 'text-green-600' : 'text-gray-500'}`}>
              {value === 'true' ? 'مفعل' : 'معطل'}
            </span>
          </div>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {setting.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'password':
        return (
          <div className="relative">
            <input
              type={showSecrets[setting.id] ? 'text' : 'password'}
              value={value}
              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="أدخل القيمة السرية..."
            />
            <button
              type="button"
              onClick={() => toggleSecretVisibility(setting.id)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showSecrets[setting.id] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="أدخل رقم..."
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleSettingChange(setting.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="أدخل النص..."
          />
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center space-x-3 space-x-reverse ${getNotificationClasses(notification.type)}`}>
          {getNotificationIcon(notification.type)}
          <span className="font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">إعدادات النظام</h1>
              <p className="text-gray-600 mt-2">إدارة الإعدادات العامة لمنصة المساعدات الإنسانية</p>
              <div className="flex items-center space-x-2 space-x-reverse mt-3">
                <Badge variant="info" size="sm">
                  {systemSettings.length} إعداد
                </Badge>
                <Badge variant={hasUnsavedChanges ? 'warning' : 'success'} size="sm">
                  {hasUnsavedChanges ? 'يوجد تغييرات غير محفوظة' : 'محفوظ'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 space-x-reverse">
            <Button 
              variant="secondary" 
              icon={Download} 
              iconPosition="right"
              onClick={handleExportSettings}
            >
              تصدير الإعدادات
            </Button>
            <Button 
              variant="secondary" 
              icon={Upload} 
              iconPosition="right"
              onClick={handleImportSettings}
            >
              استيراد الإعدادات
            </Button>
          </div>
        </div>
      </div>

      {/* Data Source Indicator */}
      <Card className="bg-blue-50 border-blue-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            البيانات الوهمية محملة - {systemSettings.length} إعداد عام
          </span>
        </div>
      </Card>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <Card className="bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div>
                <span className="font-bold text-orange-800">يوجد تغييرات غير محفوظة</span>
                <p className="text-orange-700 text-sm mt-1">تأكد من حفظ التغييرات قبل مغادرة الصفحة</p>
              </div>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button
                variant="success"
                icon={Save}
                iconPosition="right"
                onClick={handleSaveSettings}
              >
                حفظ التغييرات
              </Button>
              <Button
                variant="secondary"
                icon={RefreshCw}
                iconPosition="right"
                onClick={handleResetSettings}
              >
                إعادة تعيين
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Actions */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              icon={Settings}
              iconPosition="right"
              placeholder="البحث في الإعدادات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-3 space-x-reverse">
            <Button
              variant="secondary"
              icon={Plus}
              iconPosition="right"
              onClick={handleAddSetting}
            >
              إضافة إعداد جديد
            </Button>
          </div>
        </div>
      </Card>

      {/* Settings Grid */}
      <div className="grid gap-6">
        {filteredSettings.length > 0 ? (
          filteredSettings.map((setting) => {
            const IconComponent = setting.icon;
            const isEdited = editedSettings[setting.id] !== undefined;
            
            return (
              <Card 
                key={setting.id} 
                className={`transition-all duration-200 ${
                  isEdited ? 'border-blue-300 bg-blue-50 shadow-lg' : 'hover:shadow-md'
                }`}
              >
                <div className="grid lg:grid-cols-12 gap-6 items-center">
                  {/* Setting Info */}
                  <div className="lg:col-span-5">
                    <div className="flex items-start space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 space-x-reverse mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{setting.name}</h3>
                          {isEdited && (
                            <Badge variant="warning" size="sm">
                              معدل
                            </Badge>
                          )}
                          {setting.isSecret && (
                            <div className="flex items-center space-x-1 space-x-reverse">
                              <Lock className="w-4 h-4 text-red-500" />
                              <Badge variant="error" size="sm">سري</Badge>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-3">{setting.description}</p>
                        <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <Key className="w-3 h-3" />
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{setting.key}</span>
                          </div>
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <Clock className="w-3 h-3" />
                            <span>آخر تعديل: {new Date(setting.lastModified).toLocaleDateString('ar-SA')}</span>
                          </div>
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <Users className="w-3 h-3" />
                            <span>بواسطة: {setting.modifiedBy}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Setting Value */}
                  <div className="lg:col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      القيمة الحالية
                    </label>
                    {renderSettingInput(setting)}
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2">
                    <div className="flex space-x-2 space-x-reverse justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Edit}
                        onClick={() => handleEditSetting(setting)}
                      >
                        تعديل
                      </Button>
                      {setting.isSecret && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={showSecrets[setting.id] ? EyeOff : Eye}
                          onClick={() => toggleSecretVisibility(setting.id)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <Settings className="w-16 h-16 mx-auto mb-6 text-gray-300" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {searchTerm ? 'لا توجد إعدادات مطابقة للبحث' : 'لا توجد إعدادات'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'جرب تعديل مصطلح البحث' : 'ابدأ بإضافة إعداد جديد للنظام'}
              </p>
              {!searchTerm && (
                <Button
                  variant="primary"
                  icon={Plus}
                  iconPosition="right"
                  onClick={handleAddSetting}
                >
                  إضافة إعداد جديد
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">إجراءات سريعة</h3>
            <p className="text-gray-600">إجراءات شائعة لإدارة إعدادات النظام</p>
          </div>
          <div className="flex space-x-3 space-x-reverse">
            <Button
              variant="success"
              icon={Save}
              iconPosition="right"
              onClick={handleSaveSettings}
              disabled={!hasUnsavedChanges}
            >
              حفظ جميع التغييرات
            </Button>
            <Button
              variant="secondary"
              icon={RefreshCw}
              iconPosition="right"
              onClick={handleResetSettings}
              disabled={!hasUnsavedChanges}
            >
              إعادة تعيين الكل
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal for Add/Edit/Import */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'add' ? 'إضافة إعداد جديد' :
            modalType === 'edit' ? 'تعديل الإعداد' :
            modalType === 'import' ? 'استيراد الإعدادات' :
            'تصدير الإعدادات'
          }
          size="md"
        >
          <div className="p-6">
            {modalType === 'import' && (
              <div className="text-center">
                <div className="bg-blue-100 p-8 rounded-2xl mb-6">
                  <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-gray-900 mb-3">استيراد إعدادات النظام</h4>
                  <p className="text-gray-600">اختر ملف JSON يحتوي على إعدادات النظام المحفوظة مسبقاً</p>
                </div>
                
                <div className="border-2 border-dashed border-blue-300 rounded-2xl p-12 mb-6 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                  <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-700 font-medium mb-2">اسحب ملف JSON هنا أو اضغط للاختيار</p>
                  <p className="text-sm text-gray-500 mb-4">الملفات المدعومة: .json فقط</p>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    id="settings-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNotification({ message: `تم اختيار الملف: ${file.name} - سيتم تطوير وظيفة الاستيراد لاحقاً`, type: 'success' });
                        setTimeout(() => setNotification(null), 3000);
                        setShowModal(false);
                      }
                    }}
                  />
                  <label
                    htmlFor="settings-upload"
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center font-medium"
                  >
                    <Upload className="w-5 h-5 ml-2" />
                    اختيار ملف الإعدادات
                  </label>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">تحذير</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-2">
                    استيراد الإعدادات سيستبدل جميع الإعدادات الحالية. تأكد من إنشاء نسخة احتياطية أولاً.
                  </p>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-center">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}

            {(modalType === 'add' || modalType === 'edit') && (
              <div className="text-center">
                <div className="bg-gray-100 p-8 rounded-2xl mb-6">
                  <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    {modalType === 'add' ? 'إضافة إعداد جديد' : 'تعديل الإعداد'}
                  </h4>
                  <p className="text-gray-600">
                    {modalType === 'add' 
                      ? 'سيتم تطوير نموذج إضافة إعداد جديد هنا' 
                      : 'سيتم تطوير نموذج تعديل الإعداد هنا'
                    }
                  </p>
                </div>
                
                <div className="flex space-x-3 space-x-reverse justify-center">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary">
                    {modalType === 'add' ? 'إضافة الإعداد' : 'حفظ التغييرات'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Security and Usage Guidelines */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <div className="flex items-start space-x-4 space-x-reverse">
          <Shield className="w-8 h-8 text-red-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-red-800 mb-4">إرشادات الأمان والاستخدام</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-red-700 mb-3">تحذيرات أمنية:</h5>
                <ul className="text-sm text-red-600 space-y-2">
                  <li className="flex items-start space-x-2 space-x-reverse">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>لا تشارك الإعدادات السرية مع أشخاص غير مخولين</span>
                  </li>
                  <li className="flex items-start space-x-2 space-x-reverse">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>قم بتصدير الإعدادات بانتظام كنسخة احتياطية</span>
                  </li>
                  <li className="flex items-start space-x-2 space-x-reverse">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>راجع مفاتيح API وكلمات المرور بانتظام</span>
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-orange-700 mb-3">نصائح الاستخدام:</h5>
                <ul className="text-sm text-orange-600 space-y-2">
                  <li className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>احفظ التغييرات فور الانتهاء من التعديل</span>
                  </li>
                  <li className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>اختبر الإعدادات الجديدة في بيئة التطوير أولاً</span>
                  </li>
                  <li className="flex items-start space-x-2 space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>راجع سجل المراجعة لمتابعة التغييرات</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}