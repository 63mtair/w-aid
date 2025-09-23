import React, { useState } from 'react';
import { Shield, Users, UserCheck, Plus, Search, Filter, Edit, Trash2, Eye, Settings, Lock, Unlock, Crown, UserPlus, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { 
  mockRoles as initialMockRoles, 
  mockSystemUsers as initialMockSystemUsers, 
  mockPermissions, 
  type Role, 
  type SystemUser, 
  type Permission 
} from '../data/mockData';
import { Button, Card, Input, Badge, Modal, ConfirmationModal } from './ui';
import { useErrorLogger } from '../utils/errorLogger';

interface PermissionsManagementProps {
}

export default function PermissionsManagement({}: PermissionsManagementProps) {
  const { logInfo, logError } = useErrorLogger();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add-role' | 'edit-role' | 'add-user' | 'assign-role'>('add-role');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete-role' | 'toggle-user' | 'delete-user';
    id: string;
    name: string;
  } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
  // Make data editable
  const [roles, setRoles] = useState<Role[]>(initialMockRoles);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(initialMockSystemUsers);
  
  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  
  const [userRoleForm, setUserRoleForm] = useState({
    userId: '',
    roleId: ''
  });

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: '',
    associatedType: '' as 'organization' | 'family' | '',
    associatedId: '',
    status: 'active' as 'active' | 'inactive'
  });
  const tabs = [
    { id: 'overview', name: 'نظرة عامة', icon: Shield },
    { id: 'roles', name: 'الأدوار', icon: Crown },
    { id: 'users', name: 'المستخدمين', icon: Users },
    { id: 'permissions', name: 'الصلاحيات', icon: Lock },
  ];

  const availablePermissions = [
    { id: "read_all", name: "قراءة جميع البيانات", category: "عام" },
    { id: "write_all", name: "تعديل جميع البيانات", category: "عام" },
    { id: "delete_all", name: "حذف البيانات", category: "عام" },
    { id: "manage_users", name: "إدارة المستخدمين", category: "المستخدمين" },
    { id: "manage_roles", name: "إدارة الأدوار", category: "المستخدمين" },
    { id: "read_beneficiaries", name: "عرض المستفيدين", category: "المستفيدين" },
    { id: "write_beneficiaries", name: "إدارة المستفيدين", category: "المستفيدين" },
    { id: "read_requests", name: "عرض الطلبات", category: "الطلبات" },
    { id: "write_requests", name: "إدارة الطلبات", category: "الطلبات" },
    { id: "approve_requests", name: "موافقة الطلبات", category: "الطلبات" },
    { id: "reject_requests", name: "رفض الطلبات", category: "الطلبات" },
    { id: "read_deliveries", name: "عرض التسليمات", category: "التوزيع" },
    { id: "update_delivery_status", name: "تحديث حالة التسليم", category: "التوزيع" },
    { id: "view_reports", name: "عرض التقارير", category: "التقارير" },
    { id: "export_data", name: "تصدير البيانات", category: "التقارير" }
  ];

  const handleAddRole = () => {
    setModalType('add-role');
    setSelectedItem(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setShowModal(true);
  };

  const handleEditRole = (role: Role) => {
    setModalType('edit-role');
    setSelectedItem(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setShowModal(true);
  };

  const handleAddUser = () => {
    setModalType('add-user');
    setSelectedItem(null);
    setNewUserForm({
      name: '',
      email: '',
      phone: '',
      roleId: '',
      associatedType: '',
      associatedId: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleAssignRole = (user: SystemUser) => {
    setModalType('assign-role');
    setSelectedItem(user);
    setUserRoleForm({
      userId: user.id,
      roleId: user.roleId
    });
    setShowModal(true);
  };

  const handleCreateOrUpdateRole = () => {
    if (!roleForm.name.trim()) {
      setNotification({ message: 'اسم الدور مطلوب', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (selectedItem) {
      // Update existing role
      setRoles(prevRoles => 
        prevRoles.map(role => 
          role.id === selectedItem.id 
            ? { 
                ...role, 
                name: roleForm.name,
                description: roleForm.description,
                permissions: roleForm.permissions
              }
            : role
        )
      );
      setNotification({ message: 'تم تحديث الدور بنجاح', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      logInfo(`تم تحديث الدور: ${roleForm.name}`, 'PermissionsManagement');
    } else {
      // Create new role
      const newRole: Role = {
        id: (roles.length + 1).toString(),
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
        userCount: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      setRoles(prevRoles => [...prevRoles, newRole]);
      setNotification({ message: 'تم إنشاء الدور بنجاح', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      logInfo(`تم إنشاء دور جديد: ${roleForm.name}`, 'PermissionsManagement');
    }

    setShowModal(false);
    setRoleForm({ name: '', description: '', permissions: [] });
    setSelectedItem(null);
  };

  const handleCreateUser = () => {
    if (!newUserForm.name.trim() || !newUserForm.email.trim() || !newUserForm.roleId) {
      setNotification({ message: 'يرجى إدخال جميع الحقول المطلوبة', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Check if email already exists
    const existingUser = systemUsers.find(u => u.email.toLowerCase() === newUserForm.email.toLowerCase());
    if (existingUser) {
      setNotification({ message: 'البريد الإلكتروني مستخدم بالفعل', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Create new user
    const newUser: SystemUser = {
      id: `user-${Date.now()}`,
      name: newUserForm.name.trim(),
      email: newUserForm.email.trim(),
      phone: newUserForm.phone.trim(),
      roleId: newUserForm.roleId,
      associatedType: newUserForm.associatedType || null,
      associatedId: newUserForm.associatedId || null,
      status: newUserForm.status,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setSystemUsers(prevUsers => [...prevUsers, newUser]);
    
    // Update role user count
    setRoles(prevRoles =>
      prevRoles.map(role =>
        role.id === newUserForm.roleId
          ? { ...role, userCount: role.userCount + 1 }
          : role
      )
    );

    setNotification({ message: `تم إنشاء المستخدم ${newUserForm.name} بنجاح`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
    logInfo(`تم إنشاء مستخدم جديد: ${newUserForm.name}`, 'PermissionsManagement');

    setShowModal(false);
    setNewUserForm({
      name: '',
      email: '',
      phone: '',
      roleId: '',
      associatedType: '',
      associatedId: '',
      status: 'active'
    });
  };
  const handleUpdateUserRole = () => {
    if (!userRoleForm.userId || !userRoleForm.roleId) {
      setNotification({ message: 'يجب اختيار المستخدم والدور', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const oldUser = systemUsers.find(u => u.id === userRoleForm.userId);
    const oldRoleId = oldUser?.roleId;

    // Update user's role
    setSystemUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userRoleForm.userId
          ? { ...user, roleId: userRoleForm.roleId }
          : user
      )
    );

    // Update role user counts
    setRoles(prevRoles =>
      prevRoles.map(role => {
        if (role.id === oldRoleId) {
          return { ...role, userCount: Math.max(0, role.userCount - 1) };
        }
        if (role.id === userRoleForm.roleId) {
          return { ...role, userCount: role.userCount + 1 };
        }
        return role;
      })
    );

    setNotification({ message: 'تم تحديث دور المستخدم بنجاح', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
    logInfo(`تم تحديث دور المستخدم: ${oldUser?.name}`, 'PermissionsManagement');
    setShowModal(false);
    setUserRoleForm({ userId: '', roleId: '' });
    setSelectedItem(null);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    // Check if role is assigned to users
    const usersWithRole = systemUsers.filter(user => user.roleId === roleId);
    if (usersWithRole.length > 0) {
      setNotification({ 
        message: `لا يمكن حذف هذا الدور لأنه مُعيّن لـ ${usersWithRole.length} مستخدم`, 
        type: 'error' 
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setConfirmAction({
      type: 'delete-role',
      id: roleId,
      name: role.name
    });
    setShowConfirmModal(true);
  };

  const toggleUserStatus = (userId: string) => {
    const user = systemUsers.find(u => u.id === userId);
    if (!user) return;

    setConfirmAction({
      type: 'toggle-user',
      id: userId,
      name: user.name
    });
    setShowConfirmModal(true);
  };

  const handleDeleteUser = (userId: string) => {
    const user = systemUsers.find(u => u.id === userId);
    if (!user) return;

    setConfirmAction({
      type: 'delete-user',
      id: userId,
      name: user.name
    });
    setShowConfirmModal(true);
  };

  const executeConfirmedAction = () => {
    if (!confirmAction) return;

    try {
      switch (confirmAction.type) {
        case 'delete-role':
          setRoles(prevRoles => prevRoles.filter(role => role.id !== confirmAction.id));
          setNotification({ message: `تم حذف الدور "${confirmAction.name}" بنجاح`, type: 'success' });
          logInfo(`تم حذف الدور: ${confirmAction.name}`, 'PermissionsManagement');
          break;

        case 'toggle-user':
          const user = systemUsers.find(u => u.id === confirmAction.id);
          const newStatus = user?.status === 'active' ? 'inactive' : 'active';
          
          setSystemUsers(prevUsers =>
            prevUsers.map(user =>
              user.id === confirmAction.id
                ? { ...user, status: newStatus }
                : user
            )
          );
          setNotification({ 
            message: `تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} المستخدم "${confirmAction.name}" بنجاح`, 
            type: 'success' 
          });
          logInfo(`تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} المستخدم: ${confirmAction.name}`, 'PermissionsManagement');
          break;

        case 'delete-user':
          const userToDelete = systemUsers.find(u => u.id === confirmAction.id);
          if (userToDelete) {
            // Update role user count
            setRoles(prevRoles =>
              prevRoles.map(role =>
                role.id === userToDelete.roleId
                  ? { ...role, userCount: Math.max(0, role.userCount - 1) }
                  : role
              )
            );
            
            setSystemUsers(prevUsers => prevUsers.filter(user => user.id !== confirmAction.id));
            setNotification({ message: `تم حذف المستخدم "${confirmAction.name}" بنجاح`, type: 'success' });
            logInfo(`تم حذف المستخدم: ${confirmAction.name}`, 'PermissionsManagement');
          }
          break;
      }
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ message: 'حدث خطأ في تنفيذ العملية', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      logError(error as Error, 'PermissionsManagement');
    }
  };

  const getConfirmationMessage = () => {
    if (!confirmAction) return { title: '', message: '', confirmText: '', variant: 'primary' as const };

    switch (confirmAction.type) {
      case 'delete-role':
        return {
          title: 'تأكيد حذف الدور',
          message: `هل أنت متأكد من حذف الدور "${confirmAction.name}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`,
          confirmText: 'حذف الدور',
          variant: 'danger' as const
        };
      case 'toggle-user':
        const user = systemUsers.find(u => u.id === confirmAction.id);
        const action = user?.status === 'active' ? 'إيقاف' : 'تفعيل';
        return {
          title: `تأكيد ${action} المستخدم`,
          message: `هل أنت متأكد من ${action} المستخدم "${confirmAction.name}"؟\n\n${
            user?.status === 'active' 
              ? 'سيتم منع المستخدم من الوصول للنظام'
              : 'سيتم السماح للمستخدم بالوصول للنظام'
          }`,
          confirmText: `${action} المستخدم`,
          variant: user?.status === 'active' ? 'warning' as const : 'success' as const
        };
      case 'delete-user':
        return {
          title: 'تأكيد حذف المستخدم',
          message: `هل أنت متأكد من حذف المستخدم "${confirmAction.name}"؟\n\nسيتم حذف جميع بيانات المستخدم وصلاحياته.\nهذا الإجراء لا يمكن التراجع عنه.`,
          confirmText: 'حذف المستخدم',
          variant: 'danger' as const
        };
      default:
        return { title: '', message: '', confirmText: '', variant: 'primary' as const };
    }
  };
    setSystemUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { 
              ...user, 
              status: user.status === 'active' ? 'inactive' : 'active' 
            }
          : user
      )
    );
    alert('تم تحديث حالة المستخدم بنجاح');
  };

  const handleEditUserPermissions = (user: SystemUser) => {
    setNotification({ message: `سيتم فتح واجهة تعديل الصلاحيات الخاصة بـ ${user.name}`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const getPermissionsByRole = (roleId: string): Permission[] => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return [];
    return mockPermissions.filter(p => role.permissions.includes(p.id));
  };

  const getRoleName = (roleId: string): string => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'غير محدد';
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case "مدير النظام":
        return "bg-red-100 text-red-800";
      case "مشرف المؤسسة":
        return "bg-blue-100 text-blue-800";
      case "مندوب التوزيع":
        return "bg-green-100 text-green-800";
      case "مراجع الطلبات":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPermissionsByCategory = () => {
    const grouped = availablePermissions.reduce((acc: any, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {});
    return grouped;
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
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = systemUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRoleName(user.roleId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = systemUsers.filter(u => u.status === 'active').length;
  const adminUsers = systemUsers.filter(u => u.roleId === '1').length;
  const permissionsByCategory = getPermissionsByCategory();

  const confirmationData = getConfirmationMessage();
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">إدارة الصلاحيات</h1>
                <p className="text-sm text-gray-600">إدارة أدوار المستخدمين وصلاحياتهم في النظام</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 space-x-reverse">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 space-x-reverse px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
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
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">إجمالي الأدوار</p>
                    <p className="text-3xl font-bold text-gray-900">{roles.length}</p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-2xl">
                    <Crown className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">إجمالي المستخدمين</p>
                    <p className="text-3xl font-bold text-gray-900">{systemUsers.length}</p>
                  </div>
                  <div className="bg-green-100 p-4 rounded-2xl">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">مستخدمين نشطين</p>
                    <p className="text-3xl font-bold text-gray-900">{activeUsers}</p>
                  </div>
                  <div className="bg-orange-100 p-4 rounded-2xl">
                    <UserCheck className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">مديرين</p>
                    <p className="text-3xl font-bold text-gray-900">{adminUsers}</p>
                  </div>
                  <div className="bg-purple-100 p-4 rounded-2xl">
                    <Shield className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Roles Overview */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">الأدوار في النظام</h3>
                <Button
                  variant="primary"
                  icon={Plus}
                  iconPosition="right"
                  onClick={handleAddRole}
                >
                  إضافة دور جديد
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {roles.map((role) => {
                  const permissions = getPermissionsByRole(role.id);
                  return (
                    <div key={role.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Crown className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{role.name}</h4>
                            <p className="text-sm text-gray-600">{role.userCount} مستخدم</p>
                          </div>
                        </div>
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4">{role.description}</p>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">الصلاحيات ({permissions.length})</p>
                        <div className="space-y-1">
                          {permissions.slice(0, 3).map((permission) => (
                            <div key={permission.id} className="flex items-center text-xs text-gray-600">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full ml-2"></div>
                              {permission.name}
                            </div>
                          ))}
                          {permissions.length > 3 && (
                            <div className="text-xs text-blue-600 font-medium">
                              + {permissions.length - 3} صلاحية أخرى
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">إدارة الأدوار</h2>
                <p className="text-gray-600 mt-1">إنشاء وتعديل أدوار المستخدمين</p>
              </div>
              <div className="flex space-x-3 space-x-reverse">
                <Button
                  variant="primary"
                  icon={Plus}
                  iconPosition="right"
                  onClick={handleAddRole}
                >
                  إضافة دور جديد
                </Button>
              </div>
            </div>

            {/* Search */}
            <Card>
              <div className="flex items-center space-x-4 space-x-reverse">
                <Input
                  type="text"
                  icon={Search}
                  iconPosition="right"
                  placeholder="البحث في الأدوار..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="secondary" icon={Filter} iconPosition="right">
                  فلترة
                </Button>
              </div>
            </Card>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoles.map((role, index) => (
                <div key={role.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Crown className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{role.name}</h4>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role.name)}`}>
                          {role.userCount} مستخدم
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {role.description && (
                    <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                  )}
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">الصلاحيات ({role.permissions.length})</h5>
                    <div className="space-y-1">
                      {role.permissions.slice(0, 3).map((permissionId) => {
                        const permission = availablePermissions.find(p => p.id === permissionId);
                        return permission ? (
                          <div key={permissionId} className="text-xs text-gray-600 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                            {permission.name}
                          </div>
                        ) : null;
                      })}
                      {role.permissions.length > 3 && (
                        <div className="text-xs text-gray-500">
                          + {role.permissions.length - 3} صلاحية أخرى
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h2>
                <p className="text-gray-600 mt-1">إدارة مستخدمي النظام وأدوارهم</p>
              </div>
              <div className="flex space-x-3 space-x-reverse">
                <Button
                  variant="primary"
                  icon={UserPlus}
                  iconPosition="right"
                  onClick={handleAddUser}
                >
                  إضافة مستخدم
                </Button>
              </div>
            </div>

            {/* Search */}
            <Card>
              <div className="flex items-center space-x-4 space-x-reverse">
                <Input
                  type="text"
                  icon={Search}
                  iconPosition="right"
                  placeholder="البحث في المستخدمين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="secondary" icon={Filter} iconPosition="right">
                  فلترة
                </Button>
              </div>
            </Card>

            {/* Users List */}
            <Card padding="none" className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">قائمة المستخدمين ({filteredUsers.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المستخدم
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        البريد الإلكتروني
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الدور
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        آخر دخول
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
                    {filteredUsers.map((user, index) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-green-100 p-2 rounded-xl ml-4">
                              <Users className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="info" size="sm">
                            {getRoleName(user.roleId)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(user.lastLogin).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={
                            user.status === 'active' ? 'success' :
                            user.status === 'inactive' ? 'neutral' : 'error'
                          } size="sm">
                            {user.status === 'active' ? 'نشط' : 
                             user.status === 'inactive' ? 'غير نشط' : 'معلق'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2 space-x-reverse">
                            <button 
                              onClick={() => handleAssignRole(user)}
                              className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                              title="تعيين دور"
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                              title={user.status === 'active' ? 'إيقاف' : 'تفعيل'}
                            >
                              {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => handleEditUserPermissions(user)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="تعديل الصلاحيات"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="حذف المستخدم"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">إدارة الصلاحيات</h2>
                <p className="text-gray-600 mt-1">عرض وإدارة صلاحيات النظام</p>
              </div>
            </div>

            {/* Permissions by Category */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['عام', 'المستخدمين', 'المستفيدين', 'الطلبات', 'التوزيع', 'التقارير'].map((category) => {
                const categoryPermissions = availablePermissions.filter(p => p.category === category);
                const categoryColors = {
                  'عام': 'blue',
                  'المستخدمين': 'green',
                  'المستفيدين': 'purple',
                  'الطلبات': 'orange',
                  'التوزيع': 'red',
                  'التقارير': 'indigo'
                };
                const color = categoryColors[category as keyof typeof categoryColors] || 'gray';
                
                return (
                  <div key={category} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center space-x-3 space-x-reverse mb-4">
                      <div className={`bg-${color}-100 p-2 rounded-lg`}>
                        <Lock className={`w-5 h-5 text-${color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category}</h3>
                        <p className="text-sm text-gray-600">{categoryPermissions.length} صلاحية</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                            <div className="text-xs text-gray-500">{permission.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          modalType === 'add-role' ? 'إضافة دور جديد' :
          modalType === 'edit-role' ? 'تعديل الدور' :
          modalType === 'add-user' ? 'إضافة مستخدم جديد' :
          'تعيين دور'
        }
        size="lg"
      >
        <div className="p-6">
            
            {/* Role Form */}
            {(modalType === 'add-role' || modalType === 'edit-role') && (
              <div className="space-y-4">
                <Input
                  label="اسم الدور *"
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                  placeholder="أدخل اسم الدور"
                  required
                />
                
                <Input
                  label="وصف الدور"
                  type="textarea"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                  placeholder="أدخل وصف الدور"
                  rows={3}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الصلاحيات</label>
                  <div className="space-y-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {Object.entries(permissionsByCategory).map(([category, permissions]: [string, any]) => (
                      <div key={category}>
                        <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                        <div className="space-y-2 pr-4">
                          {permissions.map((permission: any) => (
                            <div key={permission.id} className="flex items-center space-x-2 space-x-reverse">
                              <input
                                type="checkbox"
                                id={permission.id}
                                checked={roleForm.permissions.includes(permission.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setRoleForm({
                                      ...roleForm,
                                      permissions: [...roleForm.permissions, permission.id]
                                    });
                                  } else {
                                    setRoleForm({
                                      ...roleForm,
                                      permissions: roleForm.permissions.filter(p => p !== permission.id)
                                    });
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor={permission.id} className="text-sm text-gray-700">
                                {permission.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" onClick={handleCreateOrUpdateRole}>
                    {modalType === 'add-role' ? 'إضافة الدور' : 'حفظ التغييرات'}
                  </Button>
                </div>
              </div>
            )}

            {/* Add User Form */}
            {modalType === 'add-user' && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">إضافة مستخدم جديد للنظام</h4>
                  <p className="text-blue-700 text-sm">سيتم إنشاء حساب جديد مع الصلاحيات المحددة</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="الاسم الكامل *"
                    type="text"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                    placeholder="مثال: أحمد محمد الغزاوي"
                    required
                  />

                  <Input
                    label="البريد الإلكتروني *"
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                    placeholder="مثال: ahmed@example.com"
                    required
                  />

                  <Input
                    label="رقم الهاتف"
                    type="tel"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({...newUserForm, phone: e.target.value})}
                    placeholder="مثال: 0591234567"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الدور *</label>
                    <select
                      value={newUserForm.roleId}
                      onChange={(e) => setNewUserForm({...newUserForm, roleId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">اختر الدور</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع الارتباط</label>
                    <select
                      value={newUserForm.associatedType}
                      onChange={(e) => setNewUserForm({...newUserForm, associatedType: e.target.value as any, associatedId: ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">غير مرتبط</option>
                      <option value="organization">مؤسسة</option>
                      <option value="family">عائلة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">حالة المستخدم</label>
                    <select
                      value={newUserForm.status}
                      onChange={(e) => setNewUserForm({...newUserForm, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">نشط</option>
                      <option value="inactive">غير نشط</option>
                    </select>
                  </div>
                </div>

                {newUserForm.associatedType && (
                  <Input
                    label={`معرف ${newUserForm.associatedType === 'organization' ? 'المؤسسة' : 'العائلة'}`}
                    type="text"
                    value={newUserForm.associatedId}
                    onChange={(e) => setNewUserForm({...newUserForm, associatedId: e.target.value})}
                    placeholder={`معرف ${newUserForm.associatedType === 'organization' ? 'المؤسسة' : 'العائلة'} المرتبطة`}
                  />
                )}

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">ملاحظة مهمة</span>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    سيتم إنشاء حساب جديد بكلمة مرور افتراضية. يُنصح بتغيير كلمة المرور عند أول تسجيل دخول.
                  </p>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" onClick={handleCreateUser}>
                    إضافة المستخدم
                  </Button>
                </div>
              </div>
            )}
            {/* Assign Role Form */}
            {modalType === 'assign-role' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المستخدم</label>
                  <select
                    value={userRoleForm.userId}
                    onChange={(e) => setUserRoleForm({...userRoleForm, userId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">اختر المستخدم</option>
                    {systemUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                  <select
                    value={userRoleForm.roleId}
                    onChange={(e) => setUserRoleForm({...userRoleForm, roleId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">اختر الدور</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary" onClick={handleUpdateUserRole}>
                    تعيين الدور
                  </Button>
                </div>
              </div>
            )}

        </div>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        onConfirm={executeConfirmedAction}
        title={confirmationData.title}
        message={confirmationData.message}
        confirmButtonText={confirmationData.confirmText}
        confirmButtonVariant={confirmationData.variant}
        type={confirmationData.variant === 'danger' ? 'danger' : 'warning'}
      />
    </div>
  );
}