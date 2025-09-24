import React, { useState } from 'react';
import { Database, Download, Upload, RefreshCw, Trash2, Calendar, Shield, CheckCircle, AlertTriangle, Clock, X, Save, Eye, Settings, HardDrive, Server, Activity, FileText, Archive, Key } from 'lucide-react';
import { useErrorLogger } from '../../utils/errorLogger';
import { useAuditLogger } from '../../utils/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Input, Badge, Modal, ConfirmationModal } from '../ui';

interface BackupFile {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'schema' | 'data';
  size: string;
  createdAt: string;
  createdBy: string;
  status: 'completed' | 'in_progress' | 'failed';
  description: string;
  downloadUrl?: string;
  checksum: string;
}

interface BackupSchedule {
  id: string;
  name: string;
  type: 'full' | 'incremental';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  isActive: boolean;
  lastRun: string;
  nextRun: string;
  retentionDays: number;
}

export default function BackupManagementPage() {
  const { logInfo, logError } = useErrorLogger();
  const { logAction } = useAuditLogger();
  const { loggedInUser } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'schedule' | 'restore' | 'view'>('create');
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'restore' | 'create';
    backupId?: string;
    backupName?: string;
  } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // البيانات الوهمية للنسخ الاحتياطية
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([
    {
      id: 'backup-1',
      name: 'نسخة_احتياطية_كاملة_2024-12-21',
      type: 'full',
      size: '245 MB',
      createdAt: '2024-12-21T10:30:00Z',
      createdBy: 'أحمد الإدمن',
      status: 'completed',
      description: 'نسخة احتياطية كاملة تشمل جميع البيانات والإعدادات',
      checksum: 'sha256:a1b2c3d4e5f6...'
    },
    {
      id: 'backup-2',
      name: 'نسخة_تدريجية_2024-12-20',
      type: 'incremental',
      size: '45 MB',
      createdAt: '2024-12-20T23:00:00Z',
      createdBy: 'النظام التلقائي',
      status: 'completed',
      description: 'نسخة تدريجية للتغييرات منذ آخر نسخة كاملة',
      checksum: 'sha256:b2c3d4e5f6a1...'
    },
    {
      id: 'backup-3',
      name: 'نسخة_البيانات_2024-12-19',
      type: 'data',
      size: '189 MB',
      createdAt: '2024-12-19T15:45:00Z',
      createdBy: 'فاطمة المشرفة',
      status: 'completed',
      description: 'نسخة احتياطية للبيانات فقط (بدون إعدادات النظام)',
      checksum: 'sha256:c3d4e5f6a1b2...'
    },
    {
      id: 'backup-4',
      name: 'نسخة_الطوارئ_2024-12-18',
      type: 'full',
      size: '267 MB',
      createdAt: '2024-12-18T08:15:00Z',
      createdBy: 'أحمد الإدمن',
      status: 'completed',
      description: 'نسخة طوارئ قبل تحديث النظام الكبير',
      checksum: 'sha256:d4e5f6a1b2c3...'
    },
    {
      id: 'backup-5',
      name: 'نسخة_فاشلة_2024-12-17',
      type: 'full',
      size: '0 MB',
      createdAt: '2024-12-17T20:30:00Z',
      createdBy: 'النظام التلقائي',
      status: 'failed',
      description: 'فشلت النسخة بسبب نفاد مساحة التخزين',
      checksum: ''
    }
  ]);

  // البيانات الوهمية لجدولة النسخ الاحتياطية
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([
    {
      id: 'schedule-1',
      name: 'نسخة يومية تلقائية',
      type: 'incremental',
      frequency: 'daily',
      time: '23:00',
      isActive: true,
      lastRun: '2024-12-20T23:00:00Z',
      nextRun: '2024-12-21T23:00:00Z',
      retentionDays: 30
    },
    {
      id: 'schedule-2',
      name: 'نسخة أسبوعية كاملة',
      type: 'full',
      frequency: 'weekly',
      time: '02:00',
      isActive: true,
      lastRun: '2024-12-15T02:00:00Z',
      nextRun: '2024-12-22T02:00:00Z',
      retentionDays: 90
    },
    {
      id: 'schedule-3',
      name: 'نسخة شهرية أرشيفية',
      type: 'full',
      frequency: 'monthly',
      time: '01:00',
      isActive: false,
      lastRun: '2024-11-01T01:00:00Z',
      nextRun: '2025-01-01T01:00:00Z',
      retentionDays: 365
    }
  ]);

  const [activeTab, setActiveTab] = useState('backups');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const tabs = [
    { id: 'backups', name: 'النسخ الاحتياطية', icon: Database },
    { id: 'schedules', name: 'الجدولة التلقائية', icon: Calendar },
    { id: 'restore', name: 'الاستعادة', icon: RefreshCw },
    { id: 'settings', name: 'إعدادات النسخ', icon: Settings }
  ];

  // فلترة النسخ الاحتياطية
  const filteredBackups = backupFiles.filter(backup => {
    const matchesSearch = backup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         backup.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || backup.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || backup.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // إحصائيات
  const statistics = {
    total: backupFiles.length,
    completed: backupFiles.filter(b => b.status === 'completed').length,
    failed: backupFiles.filter(b => b.status === 'failed').length,
    totalSize: backupFiles
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + parseFloat(b.size.replace(' MB', '')), 0),
    activeSchedules: backupSchedules.filter(s => s.isActive).length,
    lastBackup: backupFiles
      .filter(b => b.status === 'completed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  };

  const handleCreateBackup = () => {
    setConfirmAction({ type: 'create' });
    setShowConfirmModal(true);
  };

  const handleDeleteBackup = (backup: BackupFile) => {
    setConfirmAction({
      type: 'delete',
      backupId: backup.id,
      backupName: backup.name
    });
    setShowConfirmModal(true);
  };

  const handleRestoreBackup = (backup: BackupFile) => {
    setConfirmAction({
      type: 'restore',
      backupId: backup.id,
      backupName: backup.name
    });
    setShowConfirmModal(true);
  };

  const handleViewBackup = (backup: BackupFile) => {
    setSelectedBackup(backup);
    setModalType('view');
    setShowModal(true);
  };

  const handleDownloadBackup = (backup: BackupFile) => {
    // محاكاة تحميل النسخة الاحتياطية
    const mockData = {
      backupInfo: {
        name: backup.name,
        type: backup.type,
        createdAt: backup.createdAt,
        size: backup.size,
        checksum: backup.checksum
      },
      systemData: {
        beneficiaries: 'بيانات المستفيدين...',
        organizations: 'بيانات المؤسسات...',
        packages: 'بيانات الطرود...',
        settings: 'إعدادات النظام...'
      }
    };
    
    const dataStr = JSON.stringify(mockData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${backup.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: `تم تحميل النسخة الاحتياطية: ${backup.name}`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
    
    if (loggedInUser) {
      logAction(
        loggedInUser.id,
        loggedInUser.name,
        'مدير النظام',
        'create',
        'system',
        backup.id,
        backup.name,
        `تم تحميل النسخة الاحتياطية: ${backup.name}`,
        { severity: 'low', category: 'system' }
      );
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    
    try {
      switch (confirmAction.type) {
        case 'create':
          setIsCreatingBackup(true);
          // محاكاة إنشاء نسخة احتياطية
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const newBackup: BackupFile = {
            id: `backup-${Date.now()}`,
            name: `نسخة_احتياطية_${new Date().toISOString().split('T')[0]}`,
            type: 'full',
            size: '234 MB',
            createdAt: new Date().toISOString(),
            createdBy: loggedInUser?.name || 'مدير النظام',
            status: 'completed',
            description: 'نسخة احتياطية كاملة تم إنشاؤها يدوياً',
            checksum: `sha256:${Math.random().toString(36).substr(2, 16)}...`
          };
          
          setBackupFiles(prev => [newBackup, ...prev]);
          setIsCreatingBackup(false);
          
          setNotification({ 
            message: 'تم إنشاء النسخة الاحتياطية بنجاح', 
            type: 'success' 
          });
          setTimeout(() => setNotification(null), 3000);
          
          if (loggedInUser) {
            logAction(
              loggedInUser.id,
              loggedInUser.name,
              'مدير النظام',
              'create',
              'system',
              newBackup.id,
              newBackup.name,
              `تم إنشاء نسخة احتياطية جديدة: ${newBackup.name}`,
              { severity: 'medium', category: 'system' }
            );
          }
          break;
          
        case 'delete':
          if (confirmAction.backupId) {
            setBackupFiles(prev => prev.filter(b => b.id !== confirmAction.backupId));
            setNotification({ 
              message: `تم حذف النسخة الاحتياطية: ${confirmAction.backupName}`, 
              type: 'warning' 
            });
            setTimeout(() => setNotification(null), 3000);
            
            if (loggedInUser) {
              logAction(
                loggedInUser.id,
                loggedInUser.name,
                'مدير النظام',
                'delete',
                'system',
                confirmAction.backupId,
                confirmAction.backupName || 'نسخة احتياطية',
                `تم حذف النسخة الاحتياطية: ${confirmAction.backupName}`,
                { severity: 'high', category: 'system' }
              );
            }
          }
          break;
          
        case 'restore':
          if (confirmAction.backupId) {
            // محاكاة استعادة النسخة الاحتياطية
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setNotification({ 
              message: `تم بدء عملية الاستعادة من: ${confirmAction.backupName}. سيتم إعادة تشغيل النظام خلال دقائق.`, 
              type: 'warning' 
            });
            setTimeout(() => setNotification(null), 5000);
            
            if (loggedInUser) {
              logAction(
                loggedInUser.id,
                loggedInUser.name,
                'مدير النظام',
                'update',
                'system',
                confirmAction.backupId,
                confirmAction.backupName || 'نسخة احتياطية',
                `تم بدء استعادة النظام من النسخة الاحتياطية: ${confirmAction.backupName}`,
                { severity: 'critical', category: 'system' }
              );
            }
          }
          break;
      }
    } catch (error) {
      logError(error as Error, 'BackupManagementPage');
      setNotification({ 
        message: 'حدث خطأ في تنفيذ العملية', 
        type: 'error' 
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const getConfirmationMessage = () => {
    if (!confirmAction) return { title: '', message: '', confirmText: '', variant: 'primary' as const };
    
    switch (confirmAction.type) {
      case 'create':
        return {
          title: 'تأكيد إنشاء نسخة احتياطية',
          message: `هل تريد إنشاء نسخة احتياطية كاملة الآن؟\n\nسيتم:\n• إنشاء نسخة من جميع البيانات والإعدادات\n• ضغط الملفات وتشفيرها\n• حفظها في مكان آمن\n• إنشاء checksum للتحقق من سلامة البيانات\n\nقد تستغرق العملية عدة دقائق حسب حجم البيانات.`,
          confirmText: 'إنشاء النسخة الاحتياطية',
          variant: 'primary' as const
        };
      case 'delete':
        return {
          title: 'تأكيد حذف النسخة الاحتياطية',
          message: `هل أنت متأكد من حذف النسخة الاحتياطية "${confirmAction.backupName}"؟\n\n⚠️ تحذير:\n• هذا الإجراء لا يمكن التراجع عنه\n• ستفقد هذه النسخة نهائياً\n• تأكد من وجود نسخ احتياطية أخرى\n• قد تحتاج هذه النسخة للاستعادة في المستقبل`,
          confirmText: 'حذف النسخة الاحتياطية',
          variant: 'danger' as const
        };
      case 'restore':
        return {
          title: 'تأكيد استعادة النظام',
          message: `هل أنت متأكد من استعادة النظام من النسخة الاحتياطية "${confirmAction.backupName}"؟\n\n⚠️ تحذير مهم جداً:\n• سيتم استبدال جميع البيانات الحالية\n• ستفقد جميع التغييرات منذ تاريخ هذه النسخة\n• سيتم إعادة تشغيل النظام تلقائياً\n• العملية قد تستغرق 10-15 دقيقة\n• تأكد من إنشاء نسخة احتياطية من الوضع الحالي أولاً\n\nهذا إجراء حساس جداً ولا يمكن التراجع عنه!`,
          confirmText: 'استعادة النظام',
          variant: 'danger' as const
        };
      default:
        return { title: '', message: '', confirmText: '', variant: 'primary' as const };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتملة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'failed': return 'فشلت';
      default: return 'غير محدد';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-blue-100 text-blue-800';
      case 'incremental': return 'bg-green-100 text-green-800';
      case 'schema': return 'bg-purple-100 text-purple-800';
      case 'data': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'full': return 'كاملة';
      case 'incremental': return 'تدريجية';
      case 'schema': return 'هيكل البيانات';
      case 'data': return 'البيانات فقط';
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

  const handleToggleSchedule = (scheduleId: string) => {
    setBackupSchedules(prev => 
      prev.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, isActive: !schedule.isActive }
          : schedule
      )
    );
    
    const schedule = backupSchedules.find(s => s.id === scheduleId);
    setNotification({ 
      message: `تم ${schedule?.isActive ? 'إيقاف' : 'تفعيل'} الجدولة: ${schedule?.name}`, 
      type: 'success' 
    });
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
            البيانات الوهمية محملة - {backupFiles.length} نسخة احتياطية
          </span>
        </div>
      </Card>

      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">إدارة النسخ الاحتياطية</h1>
              <p className="text-gray-600 mt-2">حماية وأمان بيانات منصة المساعدات الإنسانية</p>
              <div className="flex items-center space-x-2 space-x-reverse mt-3">
                <Badge variant="info" size="sm">
                  {statistics.total} نسخة
                </Badge>
                <Badge variant="success" size="sm">
                  {statistics.completed} مكتملة
                </Badge>
                {statistics.failed > 0 && (
                  <Badge variant="error" size="sm">
                    {statistics.failed} فاشلة
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">آخر نسخة احتياطية</p>
                <p className="text-lg font-bold text-blue-600">
                  {statistics.lastBackup ? new Date(statistics.lastBackup.createdAt).toLocaleDateString('ar-SA') : 'لا توجد'}
                </p>
                <p className="text-xs text-gray-500">
                  {statistics.lastBackup ? statistics.lastBackup.size : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Backups Tab */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-3 space-x-reverse">
              <Button 
                variant="primary" 
                icon={Database} 
                iconPosition="right"
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                loading={isCreatingBackup}
              >
                {isCreatingBackup ? 'جاري الإنشاء...' : 'إنشاء نسخة احتياطية'}
              </Button>
              <Button 
                variant="secondary" 
                icon={RefreshCw} 
                iconPosition="right"
                onClick={() => {
                  setNotification({ message: 'تم تحديث قائمة النسخ الاحتياطية', type: 'success' });
                  setTimeout(() => setNotification(null), 3000);
                }}
              >
                تحديث القائمة
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <Card>
            <div className="grid md:grid-cols-4 gap-4">
              <Input
                type="text"
                icon={Database}
                iconPosition="right"
                placeholder="البحث في النسخ الاحتياطية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع النسخة</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">جميع الأنواع</option>
                  <option value="full">كاملة</option>
                  <option value="incremental">تدريجية</option>
                  <option value="data">البيانات فقط</option>
                  <option value="schema">هيكل البيانات</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="completed">مكتملة</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="failed">فاشلة</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setStatusFilter('all');
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
            <Card className="bg-blue-50">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-xl mb-2">
                  <Database className="w-6 h-6 text-blue-600 mx-auto" />
                </div>
                <p className="text-sm text-blue-600">إجمالي النسخ</p>
                <p className="text-2xl font-bold text-blue-900">{statistics.total}</p>
              </div>
            </Card>

            <Card className="bg-green-50">
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-xl mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <p className="text-sm text-green-600">مكتملة</p>
                <p className="text-2xl font-bold text-green-900">{statistics.completed}</p>
              </div>
            </Card>

            <Card className="bg-purple-50">
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-xl mb-2">
                  <HardDrive className="w-6 h-6 text-purple-600 mx-auto" />
                </div>
                <p className="text-sm text-purple-600">الحجم الإجمالي</p>
                <p className="text-2xl font-bold text-purple-900">{statistics.totalSize.toFixed(0)} MB</p>
              </div>
            </Card>

            <Card className="bg-orange-50">
              <div className="text-center">
                <div className="bg-orange-100 p-3 rounded-xl mb-2">
                  <Calendar className="w-6 h-6 text-orange-600 mx-auto" />
                </div>
                <p className="text-sm text-orange-600">جدولة نشطة</p>
                <p className="text-2xl font-bold text-orange-900">{statistics.activeSchedules}</p>
              </div>
            </Card>
          </div>

          {/* Backups Table */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  النسخ الاحتياطية ({filteredBackups.length})
                </h3>
                <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
                  <Database className="w-4 h-4" />
                  <span className="text-sm">البيانات الوهمية</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النسخة الاحتياطية
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      النوع
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحجم
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBackups.length > 0 ? (
                    filteredBackups.map((backup) => (
                      <tr key={backup.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-lg ml-4">
                              <Database className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{backup.name}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{backup.description}</div>
                              <div className="text-xs text-gray-400 mt-1">بواسطة: {backup.createdBy}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={
                              backup.type === 'full' ? 'info' :
                              backup.type === 'incremental' ? 'success' :
                              backup.type === 'data' ? 'warning' : 'neutral'
                            }
                            size="sm"
                          >
                            {getTypeText(backup.type)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <HardDrive className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{backup.size}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">
                              {new Date(backup.createdAt).toLocaleDateString('ar-SA')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(backup.createdAt).toLocaleTimeString('ar-SA')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={
                              backup.status === 'completed' ? 'success' :
                              backup.status === 'in_progress' ? 'info' : 'error'
                            }
                            size="sm"
                          >
                            {getStatusText(backup.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2 space-x-reverse">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Eye}
                              onClick={() => handleViewBackup(backup)}
                            >
                              عرض
                            </Button>
                            {backup.status === 'completed' && (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  icon={Download}
                                  onClick={() => handleDownloadBackup(backup)}
                                >
                                  تحميل
                                </Button>
                                <Button
                                  variant="warning"
                                  size="sm"
                                  icon={RefreshCw}
                                  onClick={() => handleRestoreBackup(backup)}
                                >
                                  استعادة
                                </Button>
                              </>
                            )}
                            <Button
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => handleDeleteBackup(backup)}
                            >
                              حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">
                            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                              ? 'لا توجد نسخ مطابقة للفلاتر' 
                              : 'لا توجد نسخ احتياطية'}
                          </p>
                          <p className="text-sm mt-2">
                            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                              ? 'جرب تعديل الفلاتر أو مصطلح البحث'
                              : 'ابدأ بإنشاء نسخة احتياطية جديدة'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">الجدولة التلقائية للنسخ الاحتياطية</h3>
              <p className="text-gray-600 mt-1">إدارة النسخ الاحتياطية التلقائية المجدولة</p>
            </div>
            <Button 
              variant="primary" 
              icon={Calendar} 
              iconPosition="right"
              onClick={() => {
                setModalType('schedule');
                setShowModal(true);
              }}
            >
              إضافة جدولة جديدة
            </Button>
          </div>

          <div className="space-y-4">
            {backupSchedules.map((schedule) => (
              <Card key={schedule.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`p-3 rounded-lg ${getTypeColor(schedule.type)}`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{schedule.name}</h4>
                      <p className="text-sm text-gray-600">
                        {getTypeText(schedule.type)} - كل {
                          schedule.frequency === 'daily' ? 'يوم' :
                          schedule.frequency === 'weekly' ? 'أسبوع' : 'شهر'
                        } في {schedule.time}
                      </p>
                      <div className="flex items-center space-x-4 space-x-reverse mt-2 text-xs text-gray-500">
                        <span>آخر تشغيل: {new Date(schedule.lastRun).toLocaleDateString('ar-SA')}</span>
                        <span>التشغيل التالي: {new Date(schedule.nextRun).toLocaleDateString('ar-SA')}</span>
                        <span>الاحتفاظ: {schedule.retentionDays} يوم</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={schedule.isActive}
                        onChange={() => handleToggleSchedule(schedule.id)}
                        className="sr-only"
                        id={`toggle-${schedule.id}`}
                      />
                      <label
                        htmlFor={`toggle-${schedule.id}`}
                        className={`flex items-center cursor-pointer w-12 h-6 rounded-full transition-colors ${
                          schedule.isActive ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          schedule.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}></div>
                      </label>
                    </div>
                    <span className={`text-sm font-medium ${schedule.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                      {schedule.isActive ? 'مفعل' : 'معطل'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Restore Tab */}
      {activeTab === 'restore' && (
        <Card className="p-8">
          <div className="text-center">
            <div className="bg-orange-100 p-8 rounded-2xl mb-6">
              <RefreshCw className="w-16 h-16 text-orange-600 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-3">استعادة النظام</h4>
              <p className="text-gray-600">اختر نسخة احتياطية لاستعادة النظام منها</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <div className="flex items-center space-x-3 space-x-reverse mb-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <span className="font-bold text-red-800">تحذير مهم</span>
              </div>
              <ul className="text-sm text-red-700 space-y-2 text-right">
                <li>• استعادة النظام ستحذف جميع البيانات الحالية</li>
                <li>• تأكد من إنشاء نسخة احتياطية من الوضع الحالي أولاً</li>
                <li>• العملية قد تستغرق 10-15 دقيقة</li>
                <li>• سيتم إعادة تشغيل النظام تلقائياً</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              {backupFiles.filter(b => b.status === 'completed').slice(0, 5).map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`p-2 rounded-lg ${getTypeColor(backup.type)}`}>
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{backup.name}</p>
                      <p className="text-sm text-gray-600">{backup.size} - {new Date(backup.createdAt).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                  <Button
                    variant="warning"
                    size="sm"
                    icon={RefreshCw}
                    onClick={() => handleRestoreBackup(backup)}
                  >
                    استعادة من هذه النسخة
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card className="p-8">
          <div className="text-center">
            <div className="bg-gray-100 rounded-xl p-8 mb-4">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">إعدادات النسخ الاحتياطية</p>
              <p className="text-sm text-gray-500 mt-2">سيتم تطوير هذا القسم لإدارة إعدادات النسخ الاحتياطية</p>
            </div>
            <Button variant="primary">
              إدارة الإعدادات
            </Button>
          </div>
        </Card>
      )}

      {/* Modal for Backup Details */}
      {showModal && selectedBackup && modalType === 'view' && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="تفاصيل النسخة الاحتياطية"
          size="lg"
        >
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-4">معلومات أساسية</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">اسم النسخة:</span>
                  <span className="font-medium text-blue-900 mr-2">{selectedBackup.name}</span>
                </div>
                <div>
                  <span className="text-blue-700">النوع:</span>
                  <Badge variant="info" size="sm" className="mr-2">
                    {getTypeText(selectedBackup.type)}
                  </Badge>
                </div>
                <div>
                  <span className="text-blue-700">الحجم:</span>
                  <span className="font-medium text-blue-900 mr-2">{selectedBackup.size}</span>
                </div>
                <div>
                  <span className="text-blue-700">الحالة:</span>
                  <Badge 
                    variant={
                      selectedBackup.status === 'completed' ? 'success' :
                      selectedBackup.status === 'in_progress' ? 'info' : 'error'
                    }
                    size="sm" 
                    className="mr-2"
                  >
                    {getStatusText(selectedBackup.status)}
                  </Badge>
                </div>
                <div>
                  <span className="text-blue-700">تاريخ الإنشاء:</span>
                  <span className="font-medium text-blue-900 mr-2">
                    {new Date(selectedBackup.createdAt).toLocaleString('ar-SA')}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">أنشأها:</span>
                  <span className="font-medium text-blue-900 mr-2">{selectedBackup.createdBy}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h5 className="font-medium text-gray-800 mb-2">الوصف:</h5>
              <p className="text-sm text-gray-700">{selectedBackup.description}</p>
            </div>

            {/* Security Information */}
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <h5 className="font-medium text-green-800 mb-2">معلومات الأمان:</h5>
              <div className="text-sm text-green-700 space-y-1">
                <div className="flex justify-between">
                  <span>Checksum:</span>
                  <span className="font-mono text-xs">{selectedBackup.checksum}</span>
                </div>
                <div className="flex justify-between">
                  <span>التشفير:</span>
                  <span>AES-256 (محاكاة)</span>
                </div>
                <div className="flex justify-between">
                  <span>التوقيع الرقمي:</span>
                  <span>صالح ✓</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse justify-end pt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                إغلاق
              </Button>
              {selectedBackup.status === 'completed' && (
                <>
                  <Button 
                    variant="success" 
                    icon={Download}
                    iconPosition="right"
                    onClick={() => {
                      handleDownloadBackup(selectedBackup);
                      setShowModal(false);
                    }}
                  >
                    تحميل النسخة
                  </Button>
                  <Button 
                    variant="warning" 
                    icon={RefreshCw}
                    iconPosition="right"
                    onClick={() => {
                      setShowModal(false);
                      handleRestoreBackup(selectedBackup);
                    }}
                  >
                    استعادة النظام
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal for Schedule */}
      {showModal && modalType === 'schedule' && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="إضافة جدولة نسخ احتياطية جديدة"
          size="md"
        >
          <div className="p-6 text-center">
            <div className="bg-gray-100 p-8 rounded-2xl mb-6">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-3">إضافة جدولة جديدة</h4>
              <p className="text-gray-600">سيتم تطوير نموذج إضافة الجدولة هنا</p>
            </div>
            
            <div className="flex space-x-3 space-x-reverse justify-center">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                إلغاء
              </Button>
              <Button variant="primary">
                إضافة الجدولة
              </Button>
            </div>
          </div>
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
        type={getConfirmationMessage().variant === 'danger' ? 'danger' : 'warning'}
      />

      {/* System Health and Recommendations */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">صحة النظام</h3>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">آخر نسخة احتياطية</span>
                </div>
                <span className="text-sm text-green-700">
                  {statistics.lastBackup ? 'منذ يوم واحد' : 'لا توجد'}
                </span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <HardDrive className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">مساحة التخزين</span>
                </div>
                <span className="text-sm text-blue-700">{statistics.totalSize.toFixed(0)} MB مستخدمة</span>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">الجدولة التلقائية</span>
                </div>
                <span className="text-sm text-orange-700">{statistics.activeSchedules} نشطة</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">توصيات الأمان</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 space-x-reverse p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">نسخ احتياطية منتظمة</p>
                <p className="text-xs text-green-600">يتم إنشاء نسخ احتياطية بانتظام</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-x-reverse p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">اختبار الاستعادة</p>
                <p className="text-xs text-yellow-600">يُنصح باختبار عملية الاستعادة شهرياً</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-x-reverse p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">تشفير النسخ</p>
                <p className="text-xs text-blue-600">جميع النسخ مشفرة بـ AES-256</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-x-reverse p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Key className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-purple-800">مفاتيح التشفير</p>
                <p className="text-xs text-purple-600">احتفظ بمفاتيح التشفير في مكان آمن</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <Database className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">إرشادات النسخ الاحتياطية</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>أنشئ نسخة احتياطية كاملة قبل أي تحديث مهم للنظام</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>احتفظ بعدة نسخ احتياطية في أماكن مختلفة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>اختبر عملية الاستعادة بانتظام للتأكد من سلامة النسخ</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>لا تحذف النسخ القديمة إلا بعد التأكد من سلامة النسخ الجديدة</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}