import React, { useState } from 'react';
import { Truck, Search, Filter, Plus, Eye, Edit, Phone, MapPin, CheckCircle, Clock, AlertTriangle, Star, Download, RefreshCw, Users, Activity, TrendingUp, BarChart3, Navigation, Calendar, Award, UserCheck, X } from 'lucide-react';
import { 
  mockCouriers, 
  mockTasks, 
  mockBeneficiaries,
  type Courier, 
  type Task 
} from '../../data/mockData';
import { useErrorLogger } from '../../utils/errorLogger';
import { Button, Card, Input, Badge, Modal } from '../ui';
import GazaMap, { type MapPoint } from '../GazaMap';

export default function CouriersManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | 'track'>('add');
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const { logInfo, logError } = useErrorLogger();

  // استخدام البيانات الوهمية مباشرة
  const [couriers, setCouriers] = useState<Courier[]>(mockCouriers);
  const tasks = mockTasks;
  const beneficiaries = mockBeneficiaries;

  const regions = ['شمال غزة', 'مدينة غزة', 'الوسط', 'خان يونس', 'رفح'];

  // فلترة المندوبين
  const filteredCouriers = couriers.filter(courier => {
    const matchesSearch = courier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courier.phone.includes(searchTerm) ||
                         courier.vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || courier.status === statusFilter;
    const matchesRegion = regionFilter === 'all' || courier.assignedRegion === regionFilter;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  // إحصائيات
  const statistics = {
    total: couriers.length,
    active: couriers.filter(c => c.status === 'active').length,
    busy: couriers.filter(c => c.status === 'busy').length,
    offline: couriers.filter(c => c.status === 'offline').length,
    avgRating: couriers.reduce((sum, c) => sum + c.rating, 0) / couriers.length,
    totalDeliveries: couriers.reduce((sum, c) => sum + c.totalDeliveries, 0)
  };

  // إنشاء نقاط الخريطة للمندوبين
  const mapPoints: MapPoint[] = couriers
    .filter(courier => courier.currentLocation && courier.status !== 'offline')
    .map(courier => ({
      id: courier.id,
      lat: courier.currentLocation!.lat,
      lng: courier.currentLocation!.lng,
      status: courier.status === 'active' ? 'pending' : 
              courier.status === 'busy' ? 'rescheduled' : 'delivered',
      title: courier.name,
      description: `${courier.vehicleInfo} - تقييم: ${courier.rating}`,
      data: {
        id: courier.id,
        name: courier.name,
        phone: courier.phone,
        nationalId: courier.id,
        dateOfBirth: '',
        gender: 'male' as const,
        address: courier.assignedRegion,
        detailedAddress: {
          governorate: courier.assignedRegion,
          city: courier.assignedRegion,
          district: '',
          street: '',
          additionalInfo: ''
        },
        location: courier.currentLocation!,
        profession: 'مندوب توزيع',
        maritalStatus: 'single' as const,
        economicLevel: 'moderate' as const,
        membersCount: 1,
        additionalDocuments: [],
        identityStatus: 'verified' as const,
        status: 'active' as const,
        eligibilityStatus: 'eligible' as const,
        lastReceived: new Date().toISOString().split('T')[0],
        totalPackages: courier.totalDeliveries,
        notes: `مندوب توزيع - ${courier.vehicleInfo}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        updatedBy: 'admin'
      }
    }));

  const handleAddNew = () => {
    setModalType('add');
    setSelectedCourier(null);
    setShowModal(true);
  };

  const handleEdit = (courier: Courier) => {
    setModalType('edit');
    setSelectedCourier(courier);
    setShowModal(true);
  };

  const handleView = (courier: Courier) => {
    setModalType('view');
    setSelectedCourier(courier);
    setShowModal(true);
  };

  const handleTrack = (courier: Courier) => {
    setModalType('track');
    setSelectedCourier(courier);
    setShowModal(true);
  };

  const handleCall = (phone: string) => {
    if (confirm(`هل تريد الاتصال بالرقم ${phone}؟`)) {
      window.open(`tel:${phone}`);
    }
  };

  const handleUpdateStatus = (courierId: string, newStatus: Courier['status']) => {
    setCouriers(prev => 
      prev.map(courier => 
        courier.id === courierId 
          ? { ...courier, status: newStatus }
          : courier
      )
    );
    
    setNotification({ 
      message: `تم تحديث حالة المندوب إلى "${getStatusText(newStatus)}"`, 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 3000);
    logInfo(`تم تحديث حالة المندوب: ${courierId}`, 'CouriersManagementPage');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'متاح';
      case 'busy': return 'مشغول';
      case 'offline': return 'غير متصل';
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

  const handleExportCouriers = () => {
    const exportData = {
      date: new Date().toISOString(),
      totalCouriers: couriers.length,
      filteredCouriers: filteredCouriers.length,
      statistics,
      couriers: filteredCouriers.map(courier => ({
        name: courier.name,
        phone: courier.phone,
        vehicle: courier.vehicleInfo,
        region: courier.assignedRegion,
        status: getStatusText(courier.status),
        rating: courier.rating,
        totalDeliveries: courier.totalDeliveries,
        successRate: courier.successRate
      }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_المندوبين_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setNotification({ message: 'تم تصدير تقرير المندوبين بنجاح', type: 'success' });
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
            البيانات الوهمية محملة - {couriers.length} مندوب ({statistics.active} متاح)
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
            onClick={handleExportCouriers}
          >
            تصدير المندوبين
          </Button>
          <Button 
            variant="primary" 
            icon={Plus} 
            iconPosition="right"
            onClick={handleAddNew}
          >
            إضافة مندوب جديد
          </Button>
          <Button 
            variant="secondary" 
            icon={RefreshCw} 
            iconPosition="right"
            onClick={() => {
              setCouriers([...mockCouriers]);
              setNotification({ message: 'تم تحديث بيانات المندوبين', type: 'success' });
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
            placeholder="البحث في المندوبين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">حالة المندوب</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">متاح</option>
              <option value="busy">مشغول</option>
              <option value="offline">غير متصل</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة المعينة</label>
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

          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRegionFilter('all');
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
              <Truck className="w-6 h-6 text-blue-600 mx-auto" />
            </div>
            <p className="text-sm text-blue-600">إجمالي المندوبين</p>
            <p className="text-2xl font-bold text-blue-900">{statistics.total}</p>
          </div>
        </Card>

        <Card className="bg-green-50">
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-xl mb-2">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
            </div>
            <p className="text-sm text-green-600">متاحين</p>
            <p className="text-2xl font-bold text-green-900">{statistics.active}</p>
          </div>
        </Card>

        <Card className="bg-orange-50">
          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-xl mb-2">
              <Clock className="w-6 h-6 text-orange-600 mx-auto" />
            </div>
            <p className="text-sm text-orange-600">مشغولين</p>
            <p className="text-2xl font-bold text-orange-900">{statistics.busy}</p>
          </div>
        </Card>

        <Card className="bg-purple-50">
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-xl mb-2">
              <Star className="w-6 h-6 text-purple-600 mx-auto" />
            </div>
            <p className="text-sm text-purple-600">متوسط التقييم</p>
            <p className="text-2xl font-bold text-purple-900">{statistics.avgRating.toFixed(1)}</p>
          </div>
        </Card>
      </div>

      {/* Live Tracking Map */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">خريطة المندوبين المباشرة</h3>
            <p className="text-gray-600 text-sm mt-1">تتبع مواقع المندوبين في الوقت الفعلي</p>
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <Button variant="secondary" size="sm">
              تحديث المواقع
            </Button>
          </div>
        </div>

        <GazaMap
          points={mapPoints}
          onPointClick={(data) => {
            const courier = couriers.find(c => c.id === data.id);
            if (courier) {
              handleView(courier);
            }
          }}
          activeFilter={statusFilter}
          className="w-full"
        />

        {/* Map Legend for Couriers */}
        <div className="mt-4 grid md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="font-medium text-green-800">متاحين</span>
            </div>
            <p className="text-lg font-bold text-green-900 mt-1">
              {mapPoints.filter(p => p.status === 'pending').length}
            </p>
          </div>
          
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="font-medium text-orange-800">مشغولين</span>
            </div>
            <p className="text-lg font-bold text-orange-900 mt-1">
              {mapPoints.filter(p => p.status === 'rescheduled').length}
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-4 h-4 rounded-full bg-gray-500"></div>
              <span className="font-medium text-gray-800">غير متصلين</span>
            </div>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {statistics.offline}
            </p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="font-medium text-blue-800">إجمالي التوصيلات</span>
            </div>
            <p className="text-lg font-bold text-blue-900 mt-1">
              {statistics.totalDeliveries}
            </p>
          </div>
        </div>
      </Card>

      {/* Couriers Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">قائمة المندوبين ({filteredCouriers.length})</h3>
            <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">البيانات الوهمية</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المندوب
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المركبة
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المنطقة المعينة
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التقييم
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التوصيلات
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCouriers.length > 0 ? (
                filteredCouriers.map((courier) => (
                  <tr key={courier.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg ml-4">
                          <Truck className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{courier.name}</div>
                          <div className="text-sm text-gray-500">{courier.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {courier.vehicleInfo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{courier.assignedRegion}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          courier.status === 'active' ? 'success' :
                          courier.status === 'busy' ? 'warning' : 'neutral'
                        }
                        size="sm"
                      >
                        {getStatusText(courier.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium text-gray-900">{courier.rating}</span>
                        <span className="text-sm text-gray-500">({courier.reviewsCount} تقييم)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{courier.totalDeliveries}</div>
                        <div className="text-sm text-green-600">{courier.successRate}% نجاح</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 space-x-reverse">
                        <button 
                          onClick={() => handleView(courier)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(courier)}
                          className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors" 
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleCall(courier.phone)}
                          className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-50 transition-colors" 
                          title="اتصال"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleTrack(courier)}
                          className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors" 
                          title="تتبع الموقع"
                        >
                          <Navigation className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">
                        {searchTerm || statusFilter !== 'all' || regionFilter !== 'all' 
                          ? 'لا توجد مندوبين مطابقين للفلاتر' 
                          : 'لا توجد مندوبين'}
                      </p>
                      <p className="text-sm mt-2">
                        {searchTerm || statusFilter !== 'all' || regionFilter !== 'all'
                          ? 'جرب تعديل الفلاتر أو مصطلح البحث'
                          : 'ابدأ بإضافة مندوب جديد'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance Overview */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">أداء المندوبين</h3>
          <div className="space-y-4">
            {filteredCouriers.slice(0, 5).map((courier, index) => (
              <div key={courier.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{courier.name}</p>
                    <p className="text-sm text-gray-600">{courier.totalDeliveries} توصيلة</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 space-x-reverse mb-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-gray-900">{courier.rating}</span>
                  </div>
                  <div className="text-sm text-green-600 font-medium">{courier.successRate}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إحصائيات الأداء</h3>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-green-700">إجمالي التوصيلات</span>
                <span className="text-2xl font-bold text-green-900">{statistics.totalDeliveries}</span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-blue-700">متوسط التقييم</span>
                <span className="text-2xl font-bold text-blue-900">{statistics.avgRating.toFixed(1)}/5</span>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <span className="text-purple-700">المندوبين النشطين</span>
                <span className="text-2xl font-bold text-purple-900">{statistics.active}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal for Courier Operations */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === 'add' ? 'إضافة مندوب جديد' :
            modalType === 'edit' ? 'تعديل بيانات المندوب' :
            modalType === 'track' ? 'تتبع المندوب' :
            'تفاصيل المندوب'
          }
          size="md"
        >
          <div className="p-6">
            {modalType === 'view' && selectedCourier && (
              <div className="space-y-6">
                {/* Courier Details */}
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h4 className="text-lg font-bold text-blue-800 mb-4">تفاصيل المندوب</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">الاسم:</span>
                        <span className="font-medium text-blue-900">{selectedCourier.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">رقم الهاتف:</span>
                        <span className="font-medium text-blue-900">{selectedCourier.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">المركبة:</span>
                        <span className="font-medium text-blue-900">{selectedCourier.vehicleInfo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">المنطقة المعينة:</span>
                        <span className="font-medium text-blue-900">{selectedCourier.assignedRegion}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">الحالة:</span>
                        <Badge 
                          variant={
                            selectedCourier.status === 'active' ? 'success' :
                            selectedCourier.status === 'busy' ? 'warning' : 'neutral'
                          }
                          size="sm"
                        >
                          {getStatusText(selectedCourier.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">التقييم:</span>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-blue-900">{selectedCourier.rating}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">إجمالي التوصيلات:</span>
                        <span className="font-medium text-blue-900">{selectedCourier.totalDeliveries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">معدل النجاح:</span>
                        <span className="font-medium text-green-600">{selectedCourier.successRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Location */}
                {selectedCourier.currentLocation && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <h5 className="font-medium text-green-800 mb-2">الموقع الحالي</h5>
                    <div className="text-sm text-green-700">
                      <p>خط العرض: {selectedCourier.currentLocation.lat}</p>
                      <p>خط الطول: {selectedCourier.currentLocation.lng}</p>
                      <p className="text-xs text-green-600 mt-1">آخر تحديث: منذ 5 دقائق</p>
                    </div>
                  </div>
                )}

                {/* Status Update Actions */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h5 className="font-medium text-gray-800 mb-3">تحديث حالة المندوب</h5>
                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => {
                        handleUpdateStatus(selectedCourier.id, 'active');
                        setShowModal(false);
                      }}
                      disabled={selectedCourier.status === 'active'}
                    >
                      متاح
                    </Button>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => {
                        handleUpdateStatus(selectedCourier.id, 'busy');
                        setShowModal(false);
                      }}
                      disabled={selectedCourier.status === 'busy'}
                    >
                      مشغول
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        handleUpdateStatus(selectedCourier.id, 'offline');
                        setShowModal(false);
                      }}
                      disabled={selectedCourier.status === 'offline'}
                    >
                      غير متصل
                    </Button>
                  </div>
                </div>

                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إغلاق
                  </Button>
                  <Button variant="primary" onClick={() => {
                    setModalType('edit');
                  }}>
                    تعديل البيانات
                  </Button>
                </div>
              </div>
            )}

            {modalType === 'track' && selectedCourier && (
              <div className="space-y-4">
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                  <h4 className="text-lg font-bold text-purple-800 mb-4">تتبع المندوب: {selectedCourier.name}</h4>
                  
                  {selectedCourier.currentLocation ? (
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">الموقع الحالي</h5>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">خط العرض:</span>
                            <span className="font-medium text-gray-900 mr-2">{selectedCourier.currentLocation.lat}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">خط الطول:</span>
                            <span className="font-medium text-gray-900 mr-2">{selectedCourier.currentLocation.lng}</span>
                          </div>
                        </div>
                        <p className="text-xs text-green-600 mt-2">آخر تحديث: منذ 5 دقائق</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">معلومات الرحلة</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">المسافة المقطوعة اليوم:</span>
                            <span className="font-medium text-gray-900">23.5 كم</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">عدد التوصيلات اليوم:</span>
                            <span className="font-medium text-gray-900">8 توصيلات</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">الوقت النشط:</span>
                            <span className="font-medium text-gray-900">6 ساعات 30 دقيقة</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">الموقع غير متاح</p>
                      <p className="text-sm text-gray-500 mt-1">المندوب غير متصل أو لم يشارك موقعه</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="primary" onClick={() => setShowModal(false)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            )}

            {(modalType === 'add' || modalType === 'edit') && (
              <div className="text-center">
                <div className="bg-gray-100 p-8 rounded-2xl mb-6">
                  <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    {modalType === 'add' ? 'إضافة مندوب جديد' : 'تعديل بيانات المندوب'}
                  </h4>
                  <p className="text-gray-600">
                    سيتم تطوير نموذج {modalType === 'add' ? 'إضافة' : 'تعديل'} المندوب هنا
                  </p>
                </div>
                
                <div className="flex space-x-3 space-x-reverse justify-center">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    إلغاء
                  </Button>
                  <Button variant="primary">
                    {modalType === 'add' ? 'إضافة المندوب' : 'حفظ التغييرات'}
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
          <Truck className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">إرشادات إدارة المندوبين</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>يمكن تتبع مواقع المندوبين في الوقت الفعلي على الخريطة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>تحديث حالة المندوب يؤثر على توزيع المهام الجديدة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>التقييمات تساعد في اختيار أفضل المندوبين للمهام الحساسة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>المندوبين غير المتصلين لا يظهرون على الخريطة</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}