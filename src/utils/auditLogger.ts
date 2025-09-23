import { useCallback } from 'react';

// نظام تسجيل المراجعة
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'suspend' | 'activate' | 'login' | 'logout';
  entityType: 'beneficiary' | 'organization' | 'package' | 'template' | 'user' | 'role' | 'system' | 'task';
  entityId: string;
  entityName: string;
  description: string;
  details?: {
    oldValues?: any;
    newValues?: any;
    reason?: string;
    additionalInfo?: any;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'data' | 'security' | 'system' | 'user_management';
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs = 1000;

  logAction(
    userId: string,
    userName: string,
    userRole: string,
    actionType: AuditLog['actionType'],
    entityType: AuditLog['entityType'],
    entityId: string,
    entityName: string,
    description: string,
    options: {
      details?: AuditLog['details'];
      severity?: AuditLog['severity'];
      category?: AuditLog['category'];
      success?: boolean;
      errorMessage?: string;
    } = {}
  ) {
    const auditLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      actionType,
      entityType,
      entityId,
      entityName,
      description,
      details: options.details,
      severity: options.severity || this.getSeverityByAction(actionType),
      category: options.category || this.getCategoryByEntityType(entityType),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      success: options.success !== undefined ? options.success : true,
      errorMessage: options.errorMessage
    };

    this.logs.unshift(auditLog);
    
    // الاحتفاظ بآخر 1000 سجل فقط
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // طباعة السجل في الكونسول للتطوير
    console.log('🔍 سجل مراجعة جديد:', {
      user: userName,
      action: actionType,
      entity: `${entityType}:${entityName}`,
      description,
      timestamp: auditLog.timestamp
    });

    // حفظ في localStorage للاستمرارية
    this.saveToStorage();
  }

  private getSeverityByAction(actionType: AuditLog['actionType']): AuditLog['severity'] {
    switch (actionType) {
      case 'delete':
      case 'suspend':
        return 'high';
      case 'approve':
      case 'reject':
      case 'activate':
        return 'medium';
      case 'create':
      case 'update':
        return 'low';
      case 'login':
      case 'logout':
        return 'low';
      default:
        return 'medium';
    }
  }

  private getCategoryByEntityType(entityType: AuditLog['entityType']): AuditLog['category'] {
    switch (entityType) {
      case 'beneficiary':
      case 'organization':
      case 'package':
      case 'template':
      case 'task':
        return 'data';
      case 'user':
      case 'role':
        return 'user_management';
      case 'system':
        return 'system';
      default:
        return 'data';
    }
  }

  private getClientIP(): string {
    // في بيئة التطوير، نعيد IP وهمي
    return '192.168.1.100';
  }

  getLogs(): AuditLog[] {
    return this.logs;
  }

  getLogsByUser(userId: string): AuditLog[] {
    return this.logs.filter(log => log.userId === userId);
  }

  getLogsByAction(actionType: AuditLog['actionType']): AuditLog[] {
    return this.logs.filter(log => log.actionType === actionType);
  }

  getLogsByEntity(entityType: AuditLog['entityType'], entityId?: string): AuditLog[] {
    return this.logs.filter(log => 
      log.entityType === entityType && 
      (entityId ? log.entityId === entityId : true)
    );
  }

  getLogsByDateRange(startDate: string, endDate: string): AuditLog[] {
    return this.logs.filter(log => {
      const logDate = log.timestamp.split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });
  }

  getLogsBySeverity(severity: AuditLog['severity']): AuditLog[] {
    return this.logs.filter(log => log.severity === severity);
  }

  getLogsByCategory(category: AuditLog['category']): AuditLog[] {
    return this.logs.filter(log => log.category === category);
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('audit_logs');
    console.log('🧹 تم مسح جميع سجلات المراجعة');
  }

  private saveToStorage() {
    try {
      localStorage.setItem('audit_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('فشل في حفظ سجلات المراجعة في localStorage:', error);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('audit_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('فشل في تحميل سجلات المراجعة من localStorage:', error);
    }
  }

  constructor() {
    this.loadFromStorage();
    
    // إضافة بعض السجلات الوهمية للعرض
    if (this.logs.length === 0) {
      this.addMockLogs();
    }
  }

  private addMockLogs() {
    const mockLogs: Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>[] = [
      {
        userId: 'admin-1',
        userName: 'أحمد محمد الإدمن',
        userRole: 'مدير النظام',
        actionType: 'approve',
        entityType: 'beneficiary',
        entityId: 'ben-1',
        entityName: 'محمد أحمد الغزاوي',
        description: 'تم توثيق هوية المستفيد وقبول وثائقه',
        details: {
          oldValues: { identityStatus: 'pending' },
          newValues: { identityStatus: 'verified' },
          reason: 'الوثائق صحيحة ومطابقة'
        },
        severity: 'medium',
        category: 'data',
        success: true
      },
      {
        userId: 'admin-1',
        userName: 'أحمد محمد الإدمن',
        userRole: 'مدير النظام',
        actionType: 'create',
        entityType: 'organization',
        entityId: 'org-new',
        entityName: 'جمعية الخير الجديدة',
        description: 'تم إضافة مؤسسة جديدة للنظام',
        details: {
          newValues: {
            name: 'جمعية الخير الجديدة',
            type: 'جمعية خيرية',
            location: 'غزة - الرمال'
          }
        },
        severity: 'low',
        category: 'data',
        success: true
      },
      {
        userId: 'supervisor-1',
        userName: 'فاطمة أحمد المشرفة',
        userRole: 'مشرف المؤسسة',
        actionType: 'suspend',
        entityType: 'beneficiary',
        entityId: 'ben-2',
        entityName: 'خالد سالم النجار',
        description: 'تم تعليق حساب المستفيد لمخالفة الشروط',
        details: {
          oldValues: { status: 'active' },
          newValues: { status: 'suspended' },
          reason: 'تقديم معلومات غير صحيحة'
        },
        severity: 'high',
        category: 'security',
        success: true
      },
      {
        userId: 'admin-1',
        userName: 'أحمد محمد الإدمن',
        userRole: 'مدير النظام',
        actionType: 'update',
        entityType: 'system',
        entityId: 'setting-1',
        entityName: 'إعدادات الأمان',
        description: 'تم تحديث إعدادات مهلة انتهاء الجلسة',
        details: {
          oldValues: { session_timeout: '30' },
          newValues: { session_timeout: '60' },
          reason: 'تحسين تجربة المستخدم'
        },
        severity: 'medium',
        category: 'system',
        success: true
      },
      {
        userId: 'reviewer-1',
        userName: 'سارة أحمد المراجعة',
        userRole: 'مراجع الطلبات',
        actionType: 'reject',
        entityType: 'beneficiary',
        entityId: 'ben-3',
        entityName: 'أحمد علي الشوا',
        description: 'تم رفض طلب المستفيد لعدم اكتمال الوثائق',
        details: {
          oldValues: { identityStatus: 'pending' },
          newValues: { identityStatus: 'rejected' },
          reason: 'صورة الهوية غير واضحة'
        },
        severity: 'medium',
        category: 'data',
        success: true
      }
    ];

    mockLogs.forEach(logData => {
      const auditLog: AuditLog = {
        ...logData,
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent
      };
      this.logs.push(auditLog);
    });

    this.saveToStorage();
  }
}

export const auditLogger = new AuditLogger();

// Hook لاستخدام نظام المراجعة في React
export const useAuditLogger = () => {
  const logAction = useCallback((
    userId: string,
    userName: string,
    userRole: string,
    actionType: AuditLog['actionType'],
    entityType: AuditLog['entityType'],
    entityId: string,
    entityName: string,
    description: string,
    options: {
      details?: AuditLog['details'];
      severity?: AuditLog['severity'];
      category?: AuditLog['category'];
      success?: boolean;
      errorMessage?: string;
    } = {}
  ) => {
    auditLogger.logAction(
      userId,
      userName,
      userRole,
      actionType,
      entityType,
      entityId,
      entityName,
      description,
      options
    );
  }, []);

  const getLogs = useCallback(() => {
    return auditLogger.getLogs();
  }, []);

  const clearLogs = useCallback(() => {
    auditLogger.clearLogs();
  }, []);

  return {
    logAction,
    getLogs,
    clearLogs,
    getLogsByUser: auditLogger.getLogsByUser.bind(auditLogger),
    getLogsByAction: auditLogger.getLogsByAction.bind(auditLogger),
    getLogsByEntity: auditLogger.getLogsByEntity.bind(auditLogger),
    getLogsByDateRange: auditLogger.getLogsByDateRange.bind(auditLogger),
    getLogsBySeverity: auditLogger.getLogsBySeverity.bind(auditLogger),
    getLogsByCategory: auditLogger.getLogsByCategory.bind(auditLogger)
  };
};