import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter, Download, RefreshCw, Eye, Calendar, Users, Shield, Database, AlertTriangle, CheckCircle, Clock, Trash2, X, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuditLogger, type AuditLog } from '../../utils/auditLogger';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Input, Badge, Modal } from '../ui';

export default function AuditLogPage() {
  const { logAction, getLogs, clearLogs, getLogsByUser, getLogsByAction, getLogsByEntity, getLogsByDateRange, getLogsBySeverity, getLogsByCategory } = useAuditLogger();
  const { loggedInUser } = useAuth();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Load logs on component mount
  useEffect(() => {
    const updateLogs = () => {
      setLogs(getLogs());
    };

    updateLogs();
    const interval = setInterval(updateLogs, 5000); // تحديث كل 5 ثواني
    return () => clearInterval(interval);
  }, [getLogs]);

  // Get unique values for filters
  const uniqueUsers = [...new Set(logs.map(log => log.userName))];
  const uniqueActions = [...new Set(logs.map(log => log.actionType))];
  const uniqueEntities = [...new Set(logs.map(log => log.entityType))];

  // Apply filters and sorting
  const getFilteredAndSortedLogs = () => {
    let filtered = [...logs];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(searchLower) ||
        log.userName.toLowerCase().includes(searchLower) ||
        log.entityName.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.actionType === actionFilter);
    }
    
    if (entityFilter !== 'all') {
      filtered = filtered.filter(log => log.entityType === entityFilter);
    }
    
    if (userFilter !== 'all') {
      filtered = filtered.filter(log => log.userName === userFilter);
    }
    
    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            filtered = getLogsByDateRange(customDateRange.start, customDateRange.end);
          }
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortColumn) {
        case 'timestamp':
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
          break;
        case 'userName':
          aValue = a.userName;
          bValue = b.userName;
          break;
        case 'actionType':
          aValue = a.actionType;
          bValue = b.actionType;
          break;
        case 'entityName':
          aValue = a.entityName;
          bValue = b.entityName;
          break;
        case 'severity':
          const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          aValue = severityOrder[a.severity];
          bValue = severityOrder[b.severity];
          break;
        default:
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const filteredLogs = getFilteredAndSortedLogs();
  
  // Apply pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Statistics
  const statistics = {
    total: logs.length,
    today: logs.filter(log => {
      const today = new Date().toISOString().split('T')[0];
      return log.timestamp.split('T')[0] === today;
    }).length,
    critical: logs.filter(log => log.severity === 'critical').length,
    failed: logs.filter(log => !log.success).length,
    byAction: {
      create: logs.filter(log => log.actionType === 'create').length,
      update: logs.filter(log => log.actionType === 'update').length,
      delete: logs.filter(log => log.actionType === 'delete').length,
      approve: logs.filter(log => log.actionType === 'approve').length,
      suspend: logs.filter(log => log.actionType === 'suspend').length
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const handleExportLogs = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalLogs: logs.length,
      filteredLogs: filteredLogs.length,
      filters: {
        search: searchTerm,
        action: actionFilter,
        entity: entityFilter,
        user: userFilter,
        severity: severityFilter,
        category: categoryFilter,
        date: dateFilter
      },
      statistics,
      logs: filteredLogs.map(log => ({
        timestamp: log.timestamp,
        user: log.userName,
        role: log.userRole,
        action: getActionText(log.actionType),
        entity: `${getEntityText(log.entityType)}: ${log.entityName}`,
        description: log.description,
        severity: getSeverityText(log.severity),
        category: getCategoryText(log.category),
        success: log.success ? 'نجح' : 'فشل',
        ipAddress: log.ipAddress
      }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `سجل_المراجعة_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير سجل المراجعة بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClearLogs = () => {
    if (confirm('هل أنت متأكد من حذف جميع سجلات المراجعة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      clearLogs();
      setLogs([]);
      setNotification({ message: 'تم حذف جميع سجلات المراجعة', type: 'warning' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getActionText = (action: string) => {
    const actionTexts: { [key: string]: string } = {
      create: 'إنشاء',
      update: 'تعديل',
      delete: 'حذف',
      approve: 'موافقة',
      reject: 'رفض',
      suspend: 'تعليق',
      activate: 'تفعيل',
      login: 'تسجيل دخول',
      logout: 'تسجيل خروج'
    };
    return actionTexts[action] || action;
  };

  const getEntityText = (entity: string) => {
    const entityTexts: { [key: string]: string } = {
      beneficiary: 'مستفيد',
      organization: 'مؤسسة',
      package: 'طرد',
      template: 'قالب',
      user: 'مستخدم',
      role: 'دور',
      system: 'النظام',
      task: 'مهمة'
    };
    return entityTexts[entity] || entity;
  };

  const getSeverityText = (severity: string) => {
    const severityTexts: { [key: string]: string } = {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
      critical: 'حرجة'
    };
    return severityTexts[severity] || severity;
  };

  const getCategoryText = (category: string) => {
    const categoryTexts: { [key: string]: string } = {
      data: 'البيانات',
      security: 'الأمان',
      system: 'النظام',
      user_management: 'إدارة المستخدمين'
    };
    return categoryTexts[category] || category;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'approve': return 'bg-green-100 text-green-800';
      case 'reject': return 'bg-red-100 text-red-800';
      case 'suspend': return 'bg-orange-100 text-orange-800';
      case 'activate': return 'bg-green-100 text-green-800';
      case 'login': return 'bg-blue-100 text-blue-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'data': return 'bg-blue-100 text-blue-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'system': return 'bg-purple-100 text-purple-800';
      case 'user_management': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
            سجل المراجعة نشط - {logs.length} سجل ({statistics.today} اليوم)
          </span>
        </div>
      </Card>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-3 space-x-reverse">
          <Button 
            variant="success" 
            icon={Download} 
            iconPosition="right"
            onClick={handleExportLogs}
          >
            تصدير السجل
          </Button>
          <Button 
            variant="primary" 
            icon={RefreshCw} 
            iconPosition="right"
            onClick={() => setLogs(getLogs())}
          >
            تحديث
          </Button>
          <Button 
            variant="danger" 
            icon={Trash2} 
            iconPosition="right"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
          >
            مسح السجل
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-blue-50">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-xl mb-2">
              <Activity className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm text-blue-600">إجمالي السجلات</p>
            <p className="text-2xl font-bold text-blue-900">{statistics.total}</p>
          </div>
        </Card>

        <Card className="bg-green-50">
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-xl mb-2">
              <Calendar className="w-6 h-6 text-green-600 mx-auto" />
            </div>
            <p className="text-sm text-green-600">أنشطة اليوم</p>
            <p className="text-2xl font-bold text-green-900">{statistics.today}</p>
          </div>
        </Card>

        <Card className="bg-red-50">
          <div className="text-center">
            <div className="bg-red-100 p-3 rounded-xl mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600 mx-auto" />
            </div>
            <p className="text-sm text-red-600">سجلات حرجة</p>
            <p className="text-2xl font-bold text-red-900">{statistics.critical}</p>
          </div>
        </Card>

        <Card className="bg-orange-50">
          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-xl mb-2">
              <X className="w-6 h-6 text-orange-600 mx-auto" />
            </div>
            <p className="text-sm text-orange-600">عمليات فاشلة</p>
            <p className="text-2xl font-bold text-orange-900">{statistics.failed}</p>
          </div>
        </Card>

        <Card className="bg-purple-50">
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-xl mb-2">
              <CheckCircle className="w-6 h-6 text-purple-600 mx-auto" />
            </div>
            <p className="text-sm text-purple-600">موافقات</p>
            <p className="text-2xl font-bold text-purple-900">{statistics.byAction.approve}</p>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <Input
            type="text"
            icon={Search}
            iconPosition="right"
            placeholder="البحث في السجلات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الإجراء</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الإجراءات</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{getActionText(action)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الكيان</label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الكيانات</option>
              {uniqueEntities.map(entity => (
                <option key={entity} value={entity}>{getEntityText(entity)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المستخدم</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع المستخدمين</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">مستوى الخطورة</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع المستويات</option>
              <option value="critical">حرجة</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الفئات</option>
              <option value="data">البيانات</option>
              <option value="security">الأمان</option>
              <option value="system">النظام</option>
              <option value="user_management">إدارة المستخدمين</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الفترة الزمنية</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع التواريخ</option>
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="custom">فترة مخصصة</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setActionFilter('all');
                setEntityFilter('all');
                setUserFilter('all');
                setSeverityFilter('all');
                setCategoryFilter('all');
                setDateFilter('all');
                setCustomDateRange({ start: '', end: '' });
              }}
              className="w-full"
            >
              إعادة تعيين الفلاتر
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="mt-4 grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Audit Logs Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              سجل المراجعة ({filteredLogs.length} من {logs.length})
            </h3>
            <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
              <Activity className="w-4 h-4" />
              <span className="text-sm">تحديث تلقائي</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <span>الوقت</span>
                    {sortColumn === 'timestamp' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <span>المستخدم</span>
                    {sortColumn === 'userName' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('actionType')}
                >
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <span>الإجراء</span>
                    {sortColumn === 'actionType' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('entityName')}
                >
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <span>الكيان المتأثر</span>
                    {sortColumn === 'entityName' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوصف
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('severity')}
                >
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <span>الخطورة</span>
                    {sortColumn === 'severity' && (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className={`hover:bg-gray-50 transition-colors ${!log.success ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {new Date(log.timestamp).toLocaleDateString('ar-SA')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg ml-3">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                          <div className="text-xs text-gray-500">{log.userRole}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          log.actionType === 'delete' || log.actionType === 'suspend' ? 'error' :
                          log.actionType === 'approve' || log.actionType === 'create' ? 'success' :
                          log.actionType === 'reject' ? 'error' : 'info'
                        }
                        size="sm"
                      >
                        {getActionText(log.actionType)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.entityName}</div>
                        <div className="text-xs text-gray-500">{getEntityText(log.entityType)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {log.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          log.severity === 'critical' ? 'error' :
                          log.severity === 'high' ? 'warning' :
                          log.severity === 'medium' ? 'info' : 'success'
                        }
                        size="sm"
                      >
                        {getSeverityText(log.severity)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleViewDetails(log)}
                      >
                        عرض التفاصيل
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">
                        {searchTerm || actionFilter !== 'all' || entityFilter !== 'all' || userFilter !== 'all' 
                          ? 'لا توجد سجلات مطابقة للفلاتر' 
                          : 'لا توجد سجلات مراجعة'}
                      </p>
                      <p className="text-sm mt-2">
                        {searchTerm || actionFilter !== 'all' || entityFilter !== 'all' || userFilter !== 'all'
                          ? 'جرب تعديل الفلاتر أو مصطلح البحث'
                          : 'ستظهر سجلات المراجعة هنا عند تنفيذ إجراءات في النظام'}
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
                عرض {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} من {filteredLogs.length} سجل
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronRight}
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
                  icon={ChevronLeft}
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

      {/* Action Statistics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إحصائيات الإجراءات</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-green-700">عمليات الإنشاء</span>
              <span className="text-2xl font-bold text-green-900">{statistics.byAction.create}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-700">عمليات التعديل</span>
              <span className="text-2xl font-bold text-blue-900">{statistics.byAction.update}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-red-700">عمليات الحذف</span>
              <span className="text-2xl font-bold text-red-900">{statistics.byAction.delete}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-purple-700">عمليات الموافقة</span>
              <span className="text-2xl font-bold text-purple-900">{statistics.byAction.approve}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-orange-700">عمليات التعليق</span>
              <span className="text-2xl font-bold text-orange-900">{statistics.byAction.suspend}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">أنشطة المستخدمين</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {uniqueUsers.slice(0, 10).map(user => {
              const userLogs = logs.filter(log => log.userName === user);
              const recentActivity = userLogs[0];
              
              return (
                <div key={user} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user}</p>
                      <p className="text-xs text-gray-500">
                        آخر نشاط: {recentActivity ? new Date(recentActivity.timestamp).toLocaleDateString('ar-SA') : 'لا يوجد'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{userLogs.length}</p>
                    <p className="text-xs text-gray-500">إجراء</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Modal for Log Details */}
      {showModal && selectedLog && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="تفاصيل سجل المراجعة"
          size="lg"
        >
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-4">معلومات أساسية</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">الوقت:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {new Date(selectedLog.timestamp).toLocaleString('ar-SA')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">المستخدم:</span>
                  <span className="font-medium text-gray-900 mr-2">{selectedLog.userName}</span>
                </div>
                <div>
                  <span className="text-gray-600">الدور:</span>
                  <span className="font-medium text-gray-900 mr-2">{selectedLog.userRole}</span>
                </div>
                <div>
                  <span className="text-gray-600">عنوان IP:</span>
                  <span className="font-medium text-gray-900 mr-2">{selectedLog.ipAddress}</span>
                </div>
              </div>
            </div>

            {/* Action Information */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-4">تفاصيل الإجراء</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">نوع الإجراء:</span>
                  <Badge variant={
                    selectedLog.actionType === 'delete' || selectedLog.actionType === 'suspend' ? 'error' :
                    selectedLog.actionType === 'approve' || selectedLog.actionType === 'create' ? 'success' :
                    selectedLog.actionType === 'reject' ? 'error' : 'info'
                  } size="sm" className="mr-2">
                    {getActionText(selectedLog.actionType)}
                  </Badge>
                </div>
                <div>
                  <span className="text-blue-700">الكيان المتأثر:</span>
                  <span className="font-medium text-blue-900 mr-2">
                    {getEntityText(selectedLog.entityType)}: {selectedLog.entityName}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-blue-700">الوصف:</span>
                  <p className="text-blue-900 mt-1">{selectedLog.description}</p>
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">التصنيف</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-yellow-700">مستوى الخطورة:</span>
                    <Badge variant={
                      selectedLog.severity === 'critical' ? 'error' :
                      selectedLog.severity === 'high' ? 'warning' :
                      selectedLog.severity === 'medium' ? 'info' : 'success'
                    } size="sm" className="mr-2">
                      {getSeverityText(selectedLog.severity)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-yellow-700">الفئة:</span>
                    <Badge variant="info" size="sm" className="mr-2">
                      {getCategoryText(selectedLog.category)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-yellow-700">حالة التنفيذ:</span>
                    <Badge variant={selectedLog.success ? 'success' : 'error'} size="sm" className="mr-2">
                      {selectedLog.success ? 'نجح' : 'فشل'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">معلومات تقنية</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-purple-700">معرف السجل:</span>
                    <span className="font-mono text-xs text-purple-900 mr-2">{selectedLog.id}</span>
                  </div>
                  <div>
                    <span className="text-purple-700">معرف الكيان:</span>
                    <span className="font-mono text-xs text-purple-900 mr-2">{selectedLog.entityId}</span>
                  </div>
                  <div>
                    <span className="text-purple-700">المتصفح:</span>
                    <span className="text-xs text-purple-900 mr-2 truncate">
                      {selectedLog.userAgent?.split(' ')[0] || 'غير محدد'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            {selectedLog.details && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-semibold text-green-800 mb-4">تفاصيل التغيير</h4>
                
                {selectedLog.details.oldValues && (
                  <div className="mb-4">
                    <h5 className="font-medium text-green-700 mb-2">القيم القديمة:</h5>
                    <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                      {JSON.stringify(selectedLog.details.oldValues, null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedLog.details.newValues && (
                  <div className="mb-4">
                    <h5 className="font-medium text-green-700 mb-2">القيم الجديدة:</h5>
                    <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                      {JSON.stringify(selectedLog.details.newValues, null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedLog.details.reason && (
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">السبب:</h5>
                    <p className="text-sm text-green-900">{selectedLog.details.reason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Error Information */}
            {!selectedLog.success && selectedLog.errorMessage && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">تفاصيل الخطأ</h4>
                <p className="text-sm text-red-700">{selectedLog.errorMessage}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="primary" onClick={() => setShowModal(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <Activity className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">حول سجل المراجعة</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يتم تسجيل جميع الإجراءات الهامة تلقائياً في النظام</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>السجلات تحتوي على تفاصيل كاملة عن المستخدم والإجراء والتغييرات</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن فلترة وتصدير السجلات للمراجعة والتدقيق</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>السجلات الحرجة تحتاج مراجعة فورية من الإدارة</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}