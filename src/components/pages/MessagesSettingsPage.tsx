import React, { useState } from 'react';
import { MessageSquare, Search, Filter, Plus, Eye, Edit, Trash2, CheckCircle, Clock, AlertTriangle, Send, Download, RefreshCw, X, Bell, Mail, Phone, Settings, Users, Package, Activity, Star, Copy, Save } from 'lucide-react';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal } from '../ui';

interface MessageTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'notification';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  lastUsed: string;
  createdAt: string;
  createdBy: string;
}

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  type: 'sms' | 'email' | 'push';
  isEnabled: boolean;
  triggers: string[];
  recipients: string[];
}

export default function MessagesSettingsPage() {
  const { logInfo, logError } = useErrorLogger();
  const [activeTab, setActiveTab] = useState('templates');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | 'test'>('add');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // البيانات الوهمية لقوالب الرسائل
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([
    {
      id: 'template-1',
      name: 'رسالة ترحيب للمستفيد الجديد',
      type: 'sms',
      content: 'مرحباً {name}، تم تسجيلك بنجاح في منصة المساعدات الإنسانية. رقم هويتك: {nationalId}',
      variables: ['name', 'nationalId'],
      isActive: true,
      usageCount: 156,
      lastUsed: '2024-12-21',
      createdAt: '2024-12-01',
      createdBy: 'أحمد الإدمن'
    },
    {
      id: 'template-2',
      name: 'إشعار توفر طرد جديد',
      type: 'sms',
      content: 'عزيزي {name}، يتوفر لديك طرد جديد ({packageName}). يرجى التواصل معنا لتحديد موعد الاستلام.',
      variables: ['name', 'packageName'],
      isActive: true,
      usageCount: 89,
      lastUsed: '2024-12-20',
      createdAt: '2024-12-05',
      createdBy: 'فاطمة المشرفة'
    },
    {
      id: 'template-3',
      name: 'تأكيد تسليم الطرد',
      type: 'sms',
      content: 'تم تسليم طردك ({packageName}) بنجاح في {deliveryTime}. شكراً لك.',
      variables: ['packageName', 'deliveryTime'],
      isActive: true,
      usageCount: 234,
      lastUsed: '2024-12-21',
      createdAt: '2024-11-15',
      createdBy: 'أحمد الإدمن'
    },
    {
      id: 'template-4',
      name: 'تذكير بموعد الاستلام',
      type: 'sms',
      content: 'تذكير: لديك موعد لاستلام طرد غداً في {appointmentTime}. الموقع: {location}',
      variables: ['appointmentTime', 'location'],
      isActive: true,
      usageCount: 67,
      lastUsed: '2024-12-19',
      createdAt: '2024-12-10',
      createdBy: 'سارة الموظفة'
    },
    {
      id: 'template-5',
      name: 'إشعار تأخير في التسليم',
      type: 'sms',
      content: 'نعتذر عن التأخير في تسليم طردك. سيتم التواصل معك قريباً لتحديد موعد جديد.',
      variables: [],
      isActive: false,
      usageCount: 23,
      lastUsed: '2024-12-15',
      createdAt: '2024-11-20',
      createdBy: 'محمد المشرف'
    }
  ]);

  // البيانات الوهمية لإعدادات الإشعارات
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    {
      id: 'notif-1',
      name: 'إشعار المستفيد الجديد',
      description: 'إرسال رسالة ترحيب عند تسجيل مستفيد جديد',
      type: 'sms',
      isEnabled: true,
      triggers: ['beneficiary_created'],
      recipients: ['beneficiary']
    },
    {
      id: 'notif-2',
      name: 'إشعار توفر طرد',
      description: 'إشعار المستفيد عند توفر طرد جديد له',
      type: 'sms',
      isEnabled: true,
      triggers: ['package_assigned'],
      recipients: ['beneficiary']
    },
    {
      id: 'notif-3',
      name: 'تأكيد التسليم',
      description: 'إرسال تأكيد للمستفيد عند تسليم الطرد',
      type: 'sms',
      isEnabled: true,
      triggers: ['package_delivered'],
      recipients: ['beneficiary']
    },
    {
      id: 'notif-4',
      name: 'تنبيه الإدارة للطرود المتأخرة',
      description: 'تنبيه الإدارة عند تأخر طرد أكثر من 24 ساعة',
      type: 'email',
      isEnabled: true,
      triggers: ['package_delayed'],
      recipients: ['admin', 'supervisor']
    }
  ]);

  const tabs = [
    { id: 'templates', name: 'قوالب الرسائل', icon: MessageSquare },
    { id: 'notifications', name: 'إعدادات الإشعارات', icon: Bell },
    { id: 'history', name: 'سجل الرسائل', icon: Activity },
    { id: 'settings', name: 'إعدادات عامة', icon: Settings }
  ];

  // فلترة القوالب
  const filteredTemplates = messageTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // إحصائيات
  const templateStats = {
    total: messageTemplates.length,
    active: messageTemplates.filter(t => t.isActive).length,
    sms: messageTemplates.filter(t => t.type === 'sms').length,
    email: messageTemplates.filter(t => t.type === 'email').length,
    totalUsage: messageTemplates.reduce((sum, t) => sum + t.usageCount, 0)
  };

  const handleAddTemplate = () => {
    setModalType('add');
    setSelectedTemplate(null);
    setShowModal(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setModalType('edit');
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleViewTemplate = (template: MessageTemplate) => {
    setModalType('view');
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleTestTemplate = (template: MessageTemplate) => {
    setModalType('test');
    setSelectedTemplate(template);
    setShowModal(true);
  };

  const handleToggleTemplate = (templateId: string) => {
    setMessageTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { ...template, isActive: !template.isActive }
          : template
      )
    );
    
    const template = messageTemplates.find(t => t.id === templateId);
    setNotification({ 
      message: `تم ${template?.isActive ? 'إلغاء تفعيل' : 'تفعيل'} القالب بنجاح`, 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      setMessageTemplates(prev => prev.filter(t => t.id !== templateId));
      setNotification({ message: 'تم حذف القالب بنجاح', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleToggleNotification = (notificationId: string) => {
    setNotificationSettings(prev => 
      prev.map(setting => 
        setting.id === notificationId 
          ? { ...setting, isEnabled: !setting.isEnabled }
          : setting
      )
    );
    
    const setting = notificationSettings.find(s => s.id === notificationId);
    setNotification({ 
      message: `تم ${setting?.isEnabled ? 'إلغاء تفعيل' : 'تفعيل'} الإشعار بنجاح`, 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sms': return 'bg-blue-100 text-blue-800';
      case 'email': return 'bg-green-100 text-green-800';
      case 'notification': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'sms': return 'رسالة نصية';
      case 'email': return 'بريد إلكتروني';
      case 'notification': return 'إشعار';
      default: return 'غير محدد';
    }
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

  const handleExportTemplates = () => {
    const exportData = {
      date: new Date().toISOString(),
      totalTemplates: messageTemplates.length,
      activeTemplates: templateStats.active,
      templates: filteredTemplates.map(t => ({
        name: t.name,
        type: getTypeText(t.type),
        content: t.content,
        variables: t.variables,
        isActive: t.isActive ? 'مفعل' : 'معطل',
        usageCount: t.usageCount
      }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `قوالب_الرسائل_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير قوالب الرسائل بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
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
      <Card className="bg-blue-50 border-blue-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            البيانات الوهمية محملة - {messageTemplates.length} قالب رسالة
          </span>
        </div>
      </Card>

      {/* Tabs */}
      <Card padding="none">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 space-x-reverse px-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 space-x-reverse py-4 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4 ml-2" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </Card>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-3 space-x-reverse">
              <Button 
                variant="success" 
                icon={Download} 
                iconPosition="right"
                onClick={handleExportTemplates}
              >
                تصدير القوالب
              </Button>
              <Button 
                variant="primary" 
                icon={Plus} 
                iconPosition="right"
                onClick={handleAddTemplate}
              >
                إضافة قالب جديد
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  type="text"
                  icon={Search}
                  iconPosition="right"
                  placeholder="البحث في قوالب الرسائل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">جميع الأنواع</option>
                  <option value="sms">رسائل نصية</option>
                  <option value="email">بريد إلكتروني</option>
                  <option value="notification">إشعارات</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-blue-50">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-xl mb-2">
                  <MessageSquare className="w-6 h-6 text-blue-600 mx-auto" />
                </div>
                <p className="text-sm text-blue-600">إجمالي القوالب</p>
                <p className="text-2xl font-bold text-blue-900">{templateStats.total}</p>
              </div>
            </Card>

            <Card className="bg-green-50">
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-xl mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <p className="text-sm text-green-600">قوالب نشطة</p>
                <p className="text-2xl font-bold text-green-900">{templateStats.active}</p>
              </div>
            </Card>

            <Card className="bg-orange-50">
              <div className="text-center">
                <div className="bg-orange-100 p-3 rounded-xl mb-2">
                  <Phone className="w-6 h-6 text-orange-600 mx-auto" />
                </div>
                <p className="text-sm text-orange-600">رسائل نصية</p>
                <p className="text-2xl font-bold text-orange-900">{templateStats.sms}</p>
              </div>
            </Card>

            <Card className="bg-purple-50">
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-xl mb-2">
                  <Activity className="w-6 h-6 text-purple-600 mx-auto" />
                </div>
                <p className="text-sm text-purple-600">إجمالي الاستخدام</p>
                <p className="text-2xl font-bold text-purple-900">{templateStats.totalUsage}</p>
              </div>
            </Card>
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`p-2 rounded-lg ${getTypeColor(template.type)}`}>
                        {template.type === 'sms' ? <Phone className="w-4 h-4" /> :
                         template.type === 'email' ? <Mail className="w-4 h-4" /> :
                         <Bell className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <Badge variant={template.isActive ? 'success' : 'neutral'} size="sm">
                          {template.isActive ? 'مفعل' : 'معطل'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-700 line-clamp-3">{template.content}</p>
                  </div>

                  {template.variables.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">المتغيرات:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map(variable => (
                          <Badge key={variable} variant="info" size="sm">
                            {`{${variable}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>استُخدم {template.usageCount} مرة</span>
                    <span>آخر استخدام: {new Date(template.lastUsed).toLocaleDateString('ar-SA')}</span>
                  </div>

                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleViewTemplate(template)}
                      className="flex-1"
                    >
                      عرض
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Edit}
                      onClick={() => handleEditTemplate(template)}
                      className="flex-1"
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="warning"
                      size="sm"
                      icon={Send}
                      onClick={() => handleTestTemplate(template)}
                    >
                      اختبار
                    </Button>
                  </div>

                  <div className="flex space-x-2 space-x-reverse mt-2">
                    <Button
                      variant={template.isActive ? "warning" : "success"}
                      size="sm"
                      onClick={() => handleToggleTemplate(template.id)}
                      className="flex-1"
                    >
                      {template.isActive ? 'إلغاء التفعيل' : 'تفعيل'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full bg-gray-50 border border-gray-200 rounded-2xl p-12">
                <div className="text-center text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">
                    {searchTerm || typeFilter !== 'all' 
                      ? 'لا توجد قوالب مطابقة للفلاتر' 
                      : 'لا توجد قوالب رسائل'}
                  </p>
                  <p className="text-sm mt-2">
                    {searchTerm || typeFilter !== 'all'
                      ? 'جرب تعديل الفلاتر أو مصطلح البحث'
                      : 'ابدأ بإضافة قالب رسالة جديد'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">إعدادات الإشعارات التلقائية</h3>
              <p className="text-gray-600 mt-1">إدارة الإشعارات التي يتم إرسالها تلقائياً</p>
            </div>
          </div>

          <div className="space-y-4">
            {notificationSettings.map((setting) => (
              <Card key={setting.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`p-3 rounded-lg ${getTypeColor(setting.type)}`}>
                      {setting.type === 'sms' ? <Phone className="w-5 h-5" /> :
                       setting.type === 'email' ? <Mail className="w-5 h-5" /> :
                       <Bell className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{setting.name}</h4>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                      <div className="flex items-center space-x-2 space-x-reverse mt-2">
                        <Badge variant="info" size="sm">
                          {getTypeText(setting.type)}
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          {setting.recipients.length} مستقبل
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={setting.isEnabled}
                        onChange={() => handleToggleNotification(setting.id)}
                        className="sr-only"
                        id={`toggle-${setting.id}`}
                      />
                      <label
                        htmlFor={`toggle-${setting.id}`}
                        className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors ${
                          setting.isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          setting.isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}></div>
                      </label>
                    </div>
                    <span className={`text-sm font-medium ${setting.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                      {setting.isEnabled ? 'مفعل' : 'معطل'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card className="p-8">
          <div className="text-center">
            <div className="bg-gray-100 rounded-xl p-8 mb-4">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">سجل الرسائل المرسلة</p>
              <p className="text-sm text-gray-500 mt-2">سيتم تطوير هذا القسم لعرض سجل جميع الرسائل المرسلة</p>
            </div>
            <Button variant="primary">
              عرض السجل
            </Button>
          </div>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card className="p-8">
          <div className="text-center">
            <div className="bg-gray-100 rounded-xl p-8 mb-4">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">الإعدادات العامة للرسائل</p>
              <p className="text-sm text-gray-500 mt-2">سيتم تطوير هذا القسم لإدارة إعدادات مزودي الخدمة</p>
            </div>
            <Button variant="primary">
              إدارة الإعدادات
            </Button>
          </div>
        </Card>
      )}

      {/* Modal for Template Operations */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'add' ? 'إضافة قالب رسالة جديد' :
            modalType === 'edit' ? 'تعديل قالب الرسالة' :
            modalType === 'test' ? 'اختبار قالب الرسالة' :
            'عرض تفاصيل القالب'
          }
          size="lg"
        >
          <div className="p-6">
            {modalType === 'view' && selectedTemplate && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">تفاصيل القالب</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">اسم القالب:</span>
                      <span className="font-medium text-blue-900 mr-2">{selectedTemplate.name}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">النوع:</span>
                      <Badge variant="info" size="sm" className="mr-2">
                        {getTypeText(selectedTemplate.type)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-blue-700">الحالة:</span>
                      <Badge variant={selectedTemplate.isActive ? 'success' : 'neutral'} size="sm" className="mr-2">
                        {selectedTemplate.isActive ? 'مفعل' : 'معطل'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-blue-700">عدد مرات الاستخدام:</span>
                      <span className="font-medium text-blue-900 mr-2">{selectedTemplate.usageCount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h5 className="font-medium text-gray-800 mb-2">محتوى الرسالة:</h5>
                  <div className="bg-white p-3 rounded border text-sm text-gray-700">
                    {selectedTemplate.content}
                  </div>
                </div>

                {selectedTemplate.variables.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2">المتغيرات المستخدمة:</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables.map(variable => (
                        <Badge key={variable} variant="success" size="sm">
                          {`{${variable}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إغلاق
                  </Button>
                  <Button variant="primary" onClick={() => setModalType('edit')}>
                    تعديل القالب
                  </Button>
                </div>
              </div>
            )}

            {modalType === 'test' && selectedTemplate && (
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-3">اختبار قالب: {selectedTemplate.name}</h4>
                  <p className="text-yellow-700 text-sm">سيتم إرسال رسالة تجريبية باستخدام هذا القالب</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h5 className="font-medium text-gray-800 mb-2">معاينة الرسالة:</h5>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                    {selectedTemplate.content.replace(/{(\w+)}/g, (match, variable) => {
                      const sampleValues: { [key: string]: string } = {
                        name: 'أحمد محمد',
                        nationalId: '900123456',
                        packageName: 'طرد مواد غذائية',
                        deliveryTime: '2024-12-21 10:30',
                        appointmentTime: 'غداً الساعة 10:00 صباحاً',
                        location: 'مكتب التوزيع - خان يونس'
                      };
                      return sampleValues[variable] || `{${variable}}`;
                    })}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h5 className="font-medium text-blue-800 mb-2">إعدادات الاختبار:</h5>
                  <div className="space-y-3">
                    <Input
                      label="رقم الهاتف للاختبار"
                      type="tel"
                      placeholder="0591234567"
                    />
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        id="test-mode"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="test-mode" className="text-sm text-gray-700">
                        وضع الاختبار (لن يتم إرسال رسالة فعلية)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button 
                    variant="warning" 
                    onClick={() => {
                      setNotification({ message: 'تم إرسال رسالة اختبار بنجاح', type: 'success' });
                      setTimeout(() => setNotification(null), 3000);
                      setShowModal(false);
                    }}
                  >
                    إرسال اختبار
                  </Button>
                </div>
              </div>
            )}

            {(modalType === 'add' || modalType === 'edit') && (
              <div className="text-center">
                <div className="bg-gray-100 p-8 rounded-2xl mb-6">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    {modalType === 'add' ? 'إضافة قالب رسالة جديد' : 'تعديل قالب الرسالة'}
                  </h4>
                  <p className="text-gray-600">
                    سيتم تطوير نموذج {modalType === 'add' ? 'إضافة' : 'تعديل'} قالب الرسالة هنا
                  </p>
                </div>
                
                <div className="flex space-x-3 space-x-reverse justify-center">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary">
                    {modalType === 'add' ? 'إضافة القالب' : 'حفظ التغييرات'}
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
          <MessageSquare className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">إرشادات إدارة الرسائل</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>استخدم المتغيرات مثل {`{name}`} و {`{nationalId}`} لتخصيص الرسائل</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>اختبر القوالب قبل تفعيلها لضمان صحة المحتوى</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>القوالب المعطلة لن تُستخدم في الإشعارات التلقائية</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>تأكد من صحة أرقام الهواتف قبل إرسال الرسائل النصية</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}