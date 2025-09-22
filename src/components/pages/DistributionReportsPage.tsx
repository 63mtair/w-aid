import React, { useState } from 'react';
import { BarChart3, Download, Calendar, Filter, TrendingUp, Users, Package, CheckCircle, Clock, AlertTriangle, Star, Award, MapPin, Activity, PieChart, LineChart, Truck, Search, Plus, Eye, Edit, Building2, FileText, RefreshCw, X } from 'lucide-react';
import { 
  mockTasks, 
  mockBeneficiaries, 
  mockPackages, 
  mockCouriers, 
  mockDistributionBatches,
  mockOrganizations,
  calculateStats,
  getBatchById,
  getTasksByBatch,
  calculateBatchStatistics,
  type DistributionBatch,
  type Task,
  type Beneficiary
} from '../../data/mockData';
import { Button, Card, Input, Badge, Modal } from '../ui';

export default function DistributionReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [selectedRegion, setSelectedRegion] = useState('all');
  
  // Distribution Batches states
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState<DistributionBatch | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);

  const stats = calculateStats();

  const tabs = [
    { id: 'overview', name: 'نظرة عامة', icon: BarChart3 },
    { id: 'batches', name: 'دفعات التوزيع', icon: Package },
    { id: 'performance', name: 'تقارير الأداء', icon: TrendingUp },
    { id: 'geographical', name: 'التوزيع الجغرافي', icon: MapPin }
  ];

  const reportTypes = [
    { id: 'overview', name: 'نظرة عامة', icon: BarChart3 },
    { id: 'delivery', name: 'تقرير التسليم', icon: CheckCircle },
    { id: 'performance', name: 'تقرير الأداء', icon: TrendingUp },
    { id: 'beneficiaries', name: 'تقرير المستفيدين', icon: Users },
    { id: 'geographical', name: 'التوزيع الجغرافي', icon: MapPin },
  ];

  const regions = [
    { id: 'all', name: 'جميع المناطق', count: 1502 },
    { id: 'north', name: 'شمال غزة', count: 387 },
    { id: 'gaza', name: 'مدينة غزة', count: 456 },
    { id: 'middle', name: 'الوسط', count: 234 },
    { id: 'khan-younis', name: 'خان يونس', count: 298 },
    { id: 'rafah', name: 'رفح', count: 127 }
  ];

  const topCouriers = [
    { name: 'خالد أحمد', delivered: 247, successRate: 98.5, rating: 4.9 },
    { name: 'محمد سعيد', delivered: 234, successRate: 96.2, rating: 4.8 },
    { name: 'أحمد علي', delivered: 189, successRate: 94.8, rating: 4.7 },
    { name: 'يوسف حسام', delivered: 156, successRate: 93.1, rating: 4.6 },
    { name: 'سامي محمد', delivered: 134, successRate: 91.5, rating: 4.5 }
  ];

  const packageTypeDistribution = [
    { type: 'طرود غذائية', count: 987, percentage: 65, color: 'bg-orange-500' },
    { type: 'طرود طبية', count: 304, percentage: 20, color: 'bg-red-500' },
    { type: 'ملابس', count: 152, percentage: 10, color: 'bg-purple-500' },
    { type: 'بطانيات', count: 76, percentage: 5, color: 'bg-blue-500' }
  ];

  const monthlyTrends = [
    { month: 'يناير', delivered: 1247, failed: 45, pending: 89 },
    { month: 'فبراير', delivered: 1356, failed: 32, pending: 67 },
    { month: 'مارس', delivered: 1489, failed: 28, pending: 78 },
    { month: 'أبريل', delivered: 1567, failed: 23, pending: 56 },
    { month: 'مايو', delivered: 1634, failed: 19, pending: 45 }
  ];

  // Filter distribution batches
  const filteredBatches = mockDistributionBatches.filter(batch => {
    const matchesSearch = batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrganization = organizationFilter === 'all' || batch.organizationId === organizationFilter;
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    
    return matchesSearch && matchesOrganization && matchesStatus;
  });

  const handleViewBatchDetails = (batch: DistributionBatch) => {
    setSelectedBatch(batch);
    setShowBatchDetails(true);
  };

  const handleCreateNewBatch = () => {
    setShowBatchModal(true);
  };

  const handleExportReport = () => {
    let reportData;
    
    if (activeTab === 'batches') {
      // Export distribution batches report
      reportData = {
        type: 'distribution_batches',
        generatedAt: new Date().toISOString(),
        totalBatches: filteredBatches.length,
        batches: filteredBatches.map(batch => {
          const batchStats = calculateBatchStatistics(batch.id);
          const organization = mockOrganizations.find(org => org.id === batch.organizationId);
          return {
            name: batch.name,
            organization: organization?.name || 'غير محدد',
            createdAt: batch.createdAt,
            status: batch.status,
            totalTasks: batchStats.totalTasks,
            deliveredTasks: batchStats.deliveredTasks,
            failedTasks: batchStats.failedTasks,
            deliveryRate: batchStats.deliveryRate
          };
        })
      };
    } else {
      // Export general report
      reportData = {
        type: reportType,
        dateRange,
        region: selectedRegion,
        generatedAt: new Date().toISOString(),
        stats,
        details: {
          totalTasks: mockTasks.length,
          completedTasks: mockTasks.filter(t => t.status === 'delivered').length,
          pendingTasks: mockTasks.filter(t => t.status === 'pending').length,
          failedTasks: mockTasks.filter(t => t.status === 'failed').length,
          topCouriers,
          packageDistribution: packageTypeDistribution,
          monthlyTrends
        }
      };
    }
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_${activeTab === 'batches' ? 'دفعات_التوزيع' : 'التوزيع'}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert(`تم تصدير ${activeTab === 'batches' ? 'تقرير دفعات التوزيع' : 'التقرير'} بنجاح`);
  };

  const getRegionData = (regionId: string) => {
    return regions.find(r => r.id === regionId) || regions[0];
  };

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 space-x-reverse">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 space-x-reverse px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
          <Button 
            variant="success" 
            icon={Download} 
            iconPosition="right"
            onClick={handleExportReport}
          >
            تصدير التقرير
          </Button>
        </div>
      </Card>

      {/* Distribution Batches Tab */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <div className="grid md:grid-cols-4 gap-4">
              <Input
                type="text"
                icon={Search}
                iconPosition="right"
                placeholder="البحث في دفعات التوزيع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المؤسسة</label>
                <select
                  value={organizationFilter}
                  onChange={(e) => setOrganizationFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">جميع المؤسسات</option>
                  {mockOrganizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
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
                  <option value="active">نشطة</option>
                  <option value="completed">مكتملة</option>
                  <option value="paused">متوقفة</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="primary"
                  icon={Plus}
                  iconPosition="right"
                  onClick={handleCreateNewBatch}
                  className="w-full"
                >
                  إضافة دفعة جديدة
                </Button>
              </div>
            </div>
          </Card>

          {/* Batches Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-blue-50">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-xl mb-2">
                  <Package className="w-6 h-6 text-blue-600 mx-auto" />
                </div>
                <p className="text-sm text-blue-600">إجمالي الدفعات</p>
                <p className="text-2xl font-bold text-blue-900">{mockDistributionBatches.length}</p>
              </div>
            </Card>

            <Card className="bg-green-50">
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-xl mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                </div>
                <p className="text-sm text-green-600">دفعات نشطة</p>
                <p className="text-2xl font-bold text-green-900">
                  {mockDistributionBatches.filter(b => b.status === 'active').length}
                </p>
              </div>
            </Card>

            <Card className="bg-purple-50">
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-xl mb-2">
                  <Activity className="w-6 h-6 text-purple-600 mx-auto" />
                </div>
                <p className="text-sm text-purple-600">إجمالي المهام</p>
                <p className="text-2xl font-bold text-purple-900">
                  {mockDistributionBatches.reduce((sum, batch) => sum + calculateBatchStatistics(batch.id).totalTasks, 0)}
                </p>
              </div>
            </Card>

            <Card className="bg-orange-50">
              <div className="text-center">
                <div className="bg-orange-100 p-3 rounded-xl mb-2">
                  <TrendingUp className="w-6 h-6 text-orange-600 mx-auto" />
                </div>
                <p className="text-sm text-orange-600">متوسط نسبة التسليم</p>
                <p className="text-2xl font-bold text-orange-900">
                  {mockDistributionBatches.length > 0 
                    ? Math.round(mockDistributionBatches.reduce((sum, batch) => sum + calculateBatchStatistics(batch.id).deliveryRate, 0) / mockDistributionBatches.length)
                    : 0}%
                </p>
              </div>
            </Card>
          </div>

          {/* Distribution Batches List */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">دفعات التوزيع ({filteredBatches.length})</h3>
              <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">البيانات الوهمية</span>
              </div>
            </div>
            
            <div className="grid gap-4">
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => {
                  const batchStats = calculateBatchStatistics(batch.id);
                  const organization = mockOrganizations.find(org => org.id === batch.organizationId);
                  
                  return (
                    <Card key={batch.id} className="hover:border-blue-300 transition-colors cursor-pointer" onClick={() => handleViewBatchDetails(batch)}>
                      <div className="grid md:grid-cols-4 gap-6 items-center">
                        {/* Batch Info */}
                        <div className="md:col-span-2">
                          <div className="flex items-center space-x-3 space-x-reverse mb-2">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{batch.name}</h4>
                              <div className="flex items-center space-x-2 space-x-reverse mt-1">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{organization?.name || 'غير محدد'}</span>
                              </div>
                            </div>
                          </div>
                          {batch.description && (
                            <p className="text-sm text-gray-600 mt-2">{batch.description}</p>
                          )}
                          <div className="flex items-center space-x-4 space-x-reverse mt-3 text-xs text-gray-500">
                            <span>تاريخ الإنشاء: {new Date(batch.createdAt).toLocaleDateString('ar-SA')}</span>
                            <span>•</span>
                            <span>بواسطة: {batch.createdBy}</span>
                          </div>
                        </div>

                        {/* Statistics */}
                        <div>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <p className="text-lg font-bold text-blue-600">{batchStats.totalTasks}</p>
                              <p className="text-xs text-gray-600">إجمالي المهام</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-green-600">{batchStats.deliveredTasks}</p>
                              <p className="text-xs text-gray-600">تم التسليم</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-red-600">{batchStats.failedTasks}</p>
                              <p className="text-xs text-gray-600">فشل</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-orange-600">{batchStats.pendingTasks}</p>
                              <p className="text-xs text-gray-600">معلق</p>
                            </div>
                          </div>
                        </div>

                        {/* Performance */}
                        <div className="text-center">
                          <div className="mb-2">
                            <Badge 
                              variant={
                                batch.status === 'active' ? 'info' :
                                batch.status === 'completed' ? 'success' : 'warning'
                              }
                              size="sm"
                            >
                              {batch.status === 'active' ? 'نشطة' :
                               batch.status === 'completed' ? 'مكتملة' : 'متوقفة'}
                            </Badge>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{batchStats.deliveryRate}%</p>
                            <p className="text-xs text-gray-600">نسبة التسليم</p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${batchStats.deliveryRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <Card className="p-12">
                  <div className="text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">
                      {searchTerm || organizationFilter !== 'all' || statusFilter !== 'all' 
                        ? 'لا توجد دفعات مطابقة للفلاتر' 
                        : 'لا توجد دفعات توزيع'}
                    </p>
                    <p className="text-sm mt-2">
                      {searchTerm || organizationFilter !== 'all' || statusFilter !== 'all'
                        ? 'جرب تعديل الفلاتر أو مصطلح البحث'
                        : 'ابدأ بإنشاء دفعة توزيع جديدة من صفحة المهام الجماعية'}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Overview Tab (existing content) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Report Controls */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">إعدادات التقرير</h3>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع التقرير</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {reportTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفترة الزمنية</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="today">اليوم</option>
                  <option value="week">هذا الأسبوع</option>
                  <option value="month">هذا الشهر</option>
                  <option value="quarter">هذا الربع</option>
                  <option value="year">هذا العام</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تصفية إضافية</label>
                <button className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Filter className="w-4 h-4 ml-2" />
                  فلاتر متقدمة
                </button>
              </div>
            </div>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">معدل التسليم</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.deliveryRate}%</p>
                  <p className="text-green-600 text-sm mt-2 flex items-center">
                    <TrendingUp className="w-4 h-4 ml-1" />
                    +5% من الشهر الماضي
                  </p>
                </div>
                <div className="bg-green-100 p-4 rounded-2xl">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">متوسط وقت التسليم</p>
                  <p className="text-3xl font-bold text-gray-900">2.3</p>
                  <p className="text-blue-600 text-sm mt-2">ساعة</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-2xl">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">رضا المستفيدين</p>
                  <p className="text-3xl font-bold text-gray-900">4.7</p>
                  <p className="text-yellow-600 text-sm mt-2 flex items-center">
                    <Star className="w-4 h-4 ml-1" />
                    من 5 نجوم
                  </p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-2xl">
                  <Award className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">التكلفة لكل طرد</p>
                  <p className="text-3xl font-bold text-gray-900">45</p>
                  <p className="text-purple-600 text-sm mt-2">شيكل</p>
                </div>
                <div className="bg-purple-100 p-4 rounded-2xl">
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Existing charts content */}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-8">
        {/* Monthly Trends Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <LineChart className="w-6 h-6 ml-2 text-blue-600" />
              اتجاهات التسليم الشهرية
            </h3>
            <div className="text-sm text-gray-600">آخر 5 أشهر</div>
          </div>
          
          <div className="space-y-4">
            {monthlyTrends.map((month, index) => {
              const total = month.delivered + month.failed + month.pending;
              const successRate = ((month.delivered / total) * 100).toFixed(1);
              
              return (
                <div key={month.month} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{month.month}</span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{month.delivered}</span>
                      <span className="text-sm text-gray-600 mr-1">طرد</span>
                      <div className="text-xs text-green-600">{successRate}% نجاح</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="flex h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${(month.delivered / total) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-blue-500" 
                        style={{ width: `${(month.pending / total) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${(month.failed / total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>تم التسليم: {month.delivered}</span>
                    <span>معلق: {month.pending}</span>
                    <span>فشل: {month.failed}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Package Types Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <PieChart className="w-6 h-6 ml-2 text-purple-600" />
              توزيع أنواع الطرود
            </h3>
            <div className="text-sm text-gray-600">إجمالي: {packageTypeDistribution.reduce((sum, item) => sum + item.count, 0)}</div>
          </div>
          
          <div className="space-y-4">
            {packageTypeDistribution.map((item, index) => (
              <div key={item.type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <span className="font-medium text-gray-900">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{item.count}</span>
                    <div className="text-sm text-gray-600">{item.percentage}%</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
          </div>
        </div>
      )}

      {/* Geographical Tab */}
      {activeTab === 'geographical' && (
        <div className="space-y-6">
          {/* Regional Performance */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <MapPin className="w-6 h-6 ml-2 text-green-600" />
                الأداء حسب المناطق
              </h3>
              <div className="text-sm text-gray-600">إجمالي الطرود الموزعة</div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regions.filter(r => r.id !== 'all').map((region) => {
                const successRate = 75 + Math.random() * 20; // Mock success rate
                const avgTime = 2 + Math.random() * 2; // Mock average time
                
                return (
                  <div key={region.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{region.name}</h4>
                      <span className="text-lg font-bold text-blue-600">{region.count}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">معدل النجاح:</span>
                        <span className={"font-medium " + (successRate > 80 ? 'text-green-600' : successRate > 60 ? 'text-yellow-600' : 'text-red-600')}>
                          {successRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={"h-2 rounded-full " + (successRate > 80 ? 'bg-green-500' : successRate > 60 ? 'bg-yellow-500' : 'bg-red-500')}
                          style={{ width: `${successRate}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">متوسط الوقت:</span>
                        <span className="font-medium text-gray-900">{avgTime.toFixed(1)} ساعة</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Couriers */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Award className="w-6 h-6 ml-2 text-yellow-600" />
              أفضل المندوبين
            </h3>
            <div className="text-sm text-gray-600">هذا الشهر</div>
          </div>
          
          <div className="space-y-4">
            {topCouriers.map((courier, index) => (
              <div key={courier.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
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
                    <p className="text-sm text-gray-600">{courier.delivered} طرد موزع</p>
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
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Activity className="w-6 h-6 ml-2 text-purple-600" />
              رؤى الأداء
            </h3>
          </div>
          
          <div className="space-y-6">
            {/* Strengths */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                نقاط القوة
              </h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-green-700 bg-green-50 p-2 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span>معدل تسليم عالي في منطقة خان يونس (75%)</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-green-700 bg-green-50 p-2 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span>تحسن في أوقات التسليم بنسبة 15%</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-green-700 bg-green-50 p-2 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span>رضا عالي من المستفيدين (4.7/5)</span>
                </div>
              </div>
            </div>
            
            {/* Areas for Improvement */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 ml-2 text-orange-600" />
                نقاط التحسين
              </h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-orange-700 bg-orange-50 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  <span>تحسين التوصيل في منطقة رفح (40%)</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-orange-700 bg-orange-50 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  <span>تقليل حالات فشل التسليم</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-sm text-orange-700 bg-orange-50 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  <span>تحديث قاعدة بيانات العناوين</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <BarChart3 className="w-6 h-6 ml-2 text-blue-600" />
          إحصائيات مفصلة
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-6 rounded-xl border border-green-200">
            <h4 className="font-medium text-green-800 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 ml-2" />
              الطرود المسلمة بنجاح
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700">مواد غذائية:</span>
                <span className="font-medium text-green-900">987 طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">ملابس:</span>
                <span className="font-medium text-green-900">152 طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">أدوية:</span>
                <span className="font-medium text-green-900">304 طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">بطانيات:</span>
                <span className="font-medium text-green-900">76 طرد</span>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-4 flex items-center">
              <Clock className="w-5 h-5 ml-2" />
              الطرود المعلقة
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-yellow-700">في الانتظار:</span>
                <span className="font-medium text-yellow-900">89 طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">قيد التوصيل:</span>
                <span className="font-medium text-yellow-900">45 طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">تم إعادة الجدولة:</span>
                <span className="font-medium text-yellow-900">23 طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">قيد التحضير:</span>
                <span className="font-medium text-yellow-900">67 طرد</span>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-6 rounded-xl border border-red-200">
            <h4 className="font-medium text-red-800 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 ml-2" />
              المشاكل والتحديات
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-red-700">فشل التسليم:</span>
                <span className="font-medium text-red-900">12 طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">عناوين خاطئة:</span>
                <span className="font-medium text-red-900">8 طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">عدم توفر المستفيد:</span>
                <span className="font-medium text-red-900">4 طرد</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">مشاكل أمنية:</span>
                <span className="font-medium text-red-900">2 طرد</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time-based Analysis */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Clock className="w-6 h-6 ml-2 text-blue-600" />
          تحليل الأوقات والكفاءة
        </h3>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 p-4 rounded-xl mb-3">
              <Clock className="w-8 h-8 text-blue-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">متوسط وقت التحضير</h4>
            <p className="text-2xl font-bold text-blue-600">1.2</p>
            <p className="text-sm text-gray-600">ساعة</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 p-4 rounded-xl mb-3">
              <Truck className="w-8 h-8 text-green-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">متوسط وقت التوصيل</h4>
            <p className="text-2xl font-bold text-green-600">2.3</p>
            <p className="text-sm text-gray-600">ساعة</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 p-4 rounded-xl mb-3">
              <Activity className="w-8 h-8 text-purple-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">أفضل وقت للتوصيل</h4>
            <p className="text-2xl font-bold text-purple-600">10-14</p>
            <p className="text-sm text-gray-600">صباحاً</p>
          </div>
          
          <div className="text-center">
            <div className="bg-orange-100 p-4 rounded-xl mb-3">
              <Calendar className="w-8 h-8 text-orange-600 mx-auto" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">أفضل يوم للتوصيل</h4>
            <p className="text-2xl font-bold text-orange-600">الأحد</p>
            <p className="text-sm text-gray-600">أعلى معدل نجاح</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-6 h-6 ml-2 text-blue-600" />
          توصيات لتحسين الأداء
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-blue-800">توصيات فورية:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>زيادة عدد المندوبين في منطقة رفح لتحسين معدل التسليم</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>تحديث قاعدة بيانات العناوين لتقليل حالات العناوين الخاطئة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>تدريب المندوبين على التعامل مع الحالات الصعبة</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-green-800">توصيات طويلة المدى:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>تطوير تطبيق جوال للمندوبين لتحسين التتبع</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>إنشاء نظام تقييم المستفيدين للخدمة</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>تطوير شراكات مع مؤسسات محلية لتحسين التغطية</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Batch Details Modal */}
      {showBatchDetails && selectedBatch && (
        <Modal
          isOpen={showBatchDetails}
          onClose={() => {
            setShowBatchDetails(false);
            setSelectedBatch(null);
          }}
          title={`تفاصيل دفعة التوزيع: ${selectedBatch.name}`}
          size="xl"
        >
          <BatchDetailsView batch={selectedBatch} />
        </Modal>
      )}

      {/* Create New Batch Modal */}
      {showBatchModal && (
        <Modal
          isOpen={showBatchModal}
          onClose={() => setShowBatchModal(false)}
          title="إنشاء دفعة توزيع جديدة"
          size="md"
        >
          <div className="p-6 text-center">
            <div className="bg-blue-100 p-6 rounded-xl mb-6">
              <Plus className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">إنشاء دفعة توزيع جديدة</h4>
              <p className="text-gray-600">يُنصح بإنشاء دفعات التوزيع من خلال صفحة المهام الجماعية</p>
            </div>
            
            <div className="space-y-4 text-sm text-gray-600 mb-6">
              <p>لإنشاء دفعة توزيع جديدة بشكل صحيح:</p>
              <ol className="text-right space-y-2">
                <li>1. انتقل إلى صفحة "المهام الجماعية"</li>
                <li>2. حدد المستفيدين والطرود</li>
                <li>3. أنشئ دفعة توزيع جديدة أو اختر موجودة</li>
                <li>4. ستظهر الدفعة هنا تلقائياً للمتابعة</li>
              </ol>
            </div>

            <div className="flex space-x-3 space-x-reverse justify-center">
              <Button variant="secondary" onClick={() => setShowBatchModal(false)}>
                إغلاق
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  alert('سيتم توجيهك إلى صفحة المهام الجماعية لإنشاء دفعة جديدة');
                  setShowBatchModal(false);
                }}
              >
                انتقل إلى المهام الجماعية
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Component for displaying batch details
interface BatchDetailsViewProps {
  batch: DistributionBatch;
}

function BatchDetailsView({ batch }: BatchDetailsViewProps) {
  const [detailsTab, setDetailsTab] = useState('overview');
  const [searchBeneficiaries, setSearchBeneficiaries] = useState('');
  const [statusFilterDetails, setStatusFilterDetails] = useState('all');
  
  const batchStats = calculateBatchStatistics(batch.id);
  const batchTasks = getTasksByBatch(batch.id);
  const organization = mockOrganizations.find(org => org.id === batch.organizationId);
  
  // Get beneficiaries for this batch
  const batchBeneficiaries = batchTasks.map(task => {
    const beneficiary = mockBeneficiaries.find(b => b.id === task.beneficiaryId);
    return beneficiary ? { ...beneficiary, taskStatus: task.status, taskId: task.id } : null;
  }).filter(Boolean);
  
  // Filter beneficiaries based on search and status
  const filteredBeneficiaries = batchBeneficiaries.filter(beneficiary => {
    if (!beneficiary) return false;
    
    const matchesSearch = beneficiary.name.toLowerCase().includes(searchBeneficiaries.toLowerCase()) ||
                         beneficiary.nationalId.includes(searchBeneficiaries);
    
    const matchesStatus = statusFilterDetails === 'all' || beneficiary.taskStatus === statusFilterDetails;
    
    return matchesSearch && matchesStatus;
  });
  
  const detailsTabs = [
    { id: 'overview', name: 'نظرة عامة', icon: BarChart3 },
    { id: 'beneficiaries', name: 'المستفيدين', icon: Users },
    { id: 'tasks', name: 'المهام', icon: Activity },
    { id: 'analysis', name: 'تحليل الأداء', icon: TrendingUp }
  ];

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'assigned': return 'معين';
      case 'in_progress': return 'قيد التنفيذ';
      case 'delivered': return 'تم التسليم';
      case 'failed': return 'فشل';
      case 'rescheduled': return 'معاد جدولته';
      default: return 'غير محدد';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Batch Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-center space-x-4 space-x-reverse mb-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{batch.name}</h3>
            <div className="flex items-center space-x-2 space-x-reverse mt-1">
              <Building2 className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{organization?.name || 'غير محدد'}</span>
            </div>
          </div>
        </div>
        
        {batch.description && (
          <p className="text-gray-700 mb-4">{batch.description}</p>
        )}
        
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">إجمالي المهام</p>
            <p className="text-2xl font-bold text-blue-600">{batchStats.totalTasks}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">تم التسليم</p>
            <p className="text-2xl font-bold text-green-600">{batchStats.deliveredTasks}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">فشل التسليم</p>
            <p className="text-2xl font-bold text-red-600">{batchStats.failedTasks}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">نسبة التسليم</p>
            <p className="text-2xl font-bold text-purple-600">{batchStats.deliveryRate}%</p>
          </div>
        </div>
      </div>

      {/* Details Tabs */}
      <Card>
        <div className="flex space-x-1 space-x-reverse mb-6">
          {detailsTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = detailsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDetailsTab(tab.id)}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {detailsTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Chart */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-4">توزيع حالات التسليم</h4>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">{batchStats.deliveredTasks}</span>
                  </div>
                  <p className="text-sm text-gray-600">تم التسليم</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">{batchStats.failedTasks}</span>
                  </div>
                  <p className="text-sm text-gray-600">فشل</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">{batchStats.pendingTasks}</span>
                  </div>
                  <p className="text-sm text-gray-600">معلق</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">{batchStats.deliveryRate}%</span>
                  </div>
                  <p className="text-sm text-gray-600">نسبة النجاح</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Beneficiaries Tab */}
        {detailsTab === 'beneficiaries' && (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="text"
                icon={Search}
                iconPosition="right"
                placeholder="البحث في المستفيدين..."
                value={searchBeneficiaries}
                onChange={(e) => setSearchBeneficiaries(e.target.value)}
              />
              <div>
                <select
                  value={statusFilterDetails}
                  onChange={(e) => setStatusFilterDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="delivered">تم التسليم</option>
                  <option value="failed">فشل التسليم</option>
                  <option value="pending">في الانتظار</option>
                  <option value="in_progress">قيد التنفيذ</option>
                </select>
              </div>
            </div>

            {/* Beneficiaries List */}
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستفيد</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الهوية</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنطقة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">حالة التسليم</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBeneficiaries.map((beneficiary: any) => (
                    <tr key={beneficiary.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-1 rounded-lg ml-3">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{beneficiary.name}</div>
                            <div className="text-sm text-gray-500">{beneficiary.detailedAddress?.city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.nationalId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {beneficiary.detailedAddress?.district}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={
                            beneficiary.taskStatus === 'delivered' ? 'success' :
                            beneficiary.taskStatus === 'failed' ? 'error' :
                            beneficiary.taskStatus === 'in_progress' ? 'warning' : 'info'
                          }
                          size="sm"
                        >
                          {getTaskStatusText(beneficiary.taskStatus)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2 space-x-reverse">
                          {beneficiary.taskStatus === 'failed' && (
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => {
                                if (confirm(`هل تريد الاتصال بـ ${beneficiary.name} على الرقم ${beneficiary.phone}؟`)) {
                                  window.open(`tel:${beneficiary.phone}`);
                                }
                              }}
                            >
                              اتصال
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => alert(`عرض تفاصيل ${beneficiary.name}`)}
                          >
                            عرض
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {detailsTab === 'tasks' && (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المهمة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستفيد</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المندوب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإنشاء</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batchTasks.map((task) => {
                    const beneficiary = mockBeneficiaries.find(b => b.id === task.beneficiaryId);
                    const courier = task.courierId ? mockCouriers.find(c => c.id === task.courierId) : null;
                    
                    return (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{task.id.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {beneficiary?.name || 'غير محدد'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {courier?.name || 'غير معين'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={
                              task.status === 'delivered' ? 'success' :
                              task.status === 'failed' ? 'error' :
                              task.status === 'in_progress' ? 'warning' : 'info'
                            }
                            size="sm"
                          >
                            {getTaskStatusText(task.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(task.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {detailsTab === 'analysis' && (
          <div className="space-y-6">
            {/* Failure Analysis */}
            <div className="bg-red-50 p-6 rounded-xl border border-red-200">
              <h4 className="font-semibold text-red-800 mb-4">تحليل أسباب الفشل</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">عناوين خاطئة</p>
                  <p className="text-xl font-bold text-red-600">
                    {Math.floor(batchStats.failedTasks * 0.4)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">المستفيد غير موجود</p>
                  <p className="text-xl font-bold text-red-600">
                    {Math.floor(batchStats.failedTasks * 0.3)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">أسباب أخرى</p>
                  <p className="text-xl font-bold text-red-600">
                    {Math.floor(batchStats.failedTasks * 0.3)}
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-4">رؤى الأداء</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>نسبة التسليم الحالية: {batchStats.deliveryRate}%</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>متوسط وقت التسليم: 2.5 ساعة</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>عدد المندوبين المشاركين: {new Set(batchTasks.filter(t => t.courierId).map(t => t.courierId)).size}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}