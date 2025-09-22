import { useState, useEffect, useMemo } from 'react';
import { type Beneficiary, mockBeneficiaries } from '../data/mockData';
import { useErrorLogger } from '../utils/errorLogger';

interface UseBeneficiariesOptions {
  organizationId?: string;
  familyId?: string;
  searchTerm?: string;
  statusFilter?: string;
  identityStatusFilter?: string;
  advancedFilters?: {
    governorate?: string;
    city?: string;
    district?: string;
    familyStatus?: string;
    familySize?: string;
    ageGroup?: string;
    economicLevel?: string;
    displacementStatus?: string;
    profession?: string;
    healthStatus?: string;
    medicalCondition?: string;
  };
}

export const useBeneficiaries = (options: UseBeneficiariesOptions = {}) => {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logInfo, logError } = useErrorLogger();

  // جلب البيانات
  useEffect(() => {
    const fetchBeneficiaries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 300));
        
        let filteredData = [...mockBeneficiaries];
        
        // فلترة حسب المؤسسة
        if (options.organizationId) {
          filteredData = filteredData.filter(b => b.organizationId === options.organizationId);
        }
        
        // فلترة حسب العائلة
        if (options.familyId) {
          filteredData = filteredData.filter(b => b.familyId === options.familyId);
        }
        
        setBeneficiaries(filteredData);
        logInfo(`تم تحميل ${filteredData.length} مستفيد`, 'useBeneficiaries');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'خطأ في تحميل المستفيدين';
        setError(errorMessage);
        logError(new Error(errorMessage), 'useBeneficiaries');
      } finally {
        setLoading(false);
      }
    };

    fetchBeneficiaries();
  }, [options.organizationId, options.familyId, logInfo, logError]);

  // فلترة البيانات بناءً على البحث والفلاتر
  const filteredBeneficiaries = useMemo(() => {
    let filtered = [...beneficiaries];

    // فلترة البحث
    if (options.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(searchLower) ||
        b.nationalId.includes(options.searchTerm!) ||
        b.phone.includes(options.searchTerm!)
      );
    }

    // فلترة الحالة
    if (options.statusFilter && options.statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === options.statusFilter);
    }

    // فلترة حالة الهوية
    if (options.identityStatusFilter && options.identityStatusFilter !== 'all') {
      filtered = filtered.filter(b => b.identityStatus === options.identityStatusFilter);
    }

    // الفلاتر المتقدمة
    if (options.advancedFilters) {
      const filters = options.advancedFilters;

      // فلترة جغرافية
      if (filters.governorate) {
        filtered = filtered.filter(b => b.detailedAddress.governorate === filters.governorate);
      }
      if (filters.city) {
        filtered = filtered.filter(b => b.detailedAddress.city === filters.city);
      }
      if (filters.district) {
        filtered = filtered.filter(b => b.detailedAddress.district === filters.district);
      }

      // فلترة الحالة العائلية
      if (filters.familyStatus) {
        switch (filters.familyStatus) {
          case 'head_of_family':
            filtered = filtered.filter(b => b.isHeadOfFamily);
            break;
          case 'spouse':
            filtered = filtered.filter(b => b.spouseId && !b.isHeadOfFamily);
            break;
          case 'child':
            filtered = filtered.filter(b => b.parentId);
            break;
          case 'orphan_guardian':
            filtered = filtered.filter(b => b.childrenIds && b.childrenIds.length > 0 && b.maritalStatus === 'widowed');
            break;
          case 'family_with_orphans':
            filtered = filtered.filter(b => b.childrenIds && b.childrenIds.length > 0);
            break;
          case 'elderly':
            filtered = filtered.filter(b => {
              const age = new Date().getFullYear() - new Date(b.dateOfBirth).getFullYear();
              return age >= 60;
            });
            break;
          case 'disabled':
            filtered = filtered.filter(b => b.medicalConditions && b.medicalConditions.length > 0);
            break;
        }
      }

      // فلترة حجم الأسرة
      if (filters.familySize) {
        switch (filters.familySize) {
          case 'small':
            filtered = filtered.filter(b => b.membersCount >= 1 && b.membersCount <= 3);
            break;
          case 'medium':
            filtered = filtered.filter(b => b.membersCount >= 4 && b.membersCount <= 7);
            break;
          case 'large':
            filtered = filtered.filter(b => b.membersCount >= 8);
            break;
        }
      }

      // فلترة الفئة العمرية
      if (filters.ageGroup) {
        filtered = filtered.filter(b => {
          const age = new Date().getFullYear() - new Date(b.dateOfBirth).getFullYear();
          switch (filters.ageGroup) {
            case 'child':
              return age < 18;
            case 'adult':
              return age >= 18 && age < 60;
            case 'elderly':
              return age >= 60;
            default:
              return true;
          }
        });
      }

      // فلترة المستوى الاقتصادي
      if (filters.economicLevel) {
        filtered = filtered.filter(b => b.economicLevel === filters.economicLevel);
      }

      // فلترة المهنة
      if (filters.profession) {
        filtered = filtered.filter(b => 
          b.profession.toLowerCase().includes(filters.profession!.toLowerCase())
        );
      }

      // فلترة الحالة الصحية
      if (filters.healthStatus) {
        switch (filters.healthStatus) {
          case 'has_medical':
            filtered = filtered.filter(b => b.medicalConditions && b.medicalConditions.length > 0);
            break;
          case 'healthy':
            filtered = filtered.filter(b => !b.medicalConditions || b.medicalConditions.length === 0);
            break;
          default:
            if (filters.healthStatus) {
              filtered = filtered.filter(b => 
                b.medicalConditions && 
                b.medicalConditions.some(condition => 
                  condition.toLowerCase().includes(filters.healthStatus!.toLowerCase())
                )
              );
            }
        }
      }

      // فلترة حالة طبية محددة
      if (filters.medicalCondition) {
        filtered = filtered.filter(b => 
          b.medicalConditions && 
          b.medicalConditions.some(condition => 
            condition.toLowerCase().includes(filters.medicalCondition!.toLowerCase())
          )
        );
      }
    }
    return filtered;
  }, [beneficiaries, options.searchTerm, options.statusFilter, options.identityStatusFilter, options.advancedFilters]);

  // إحصائيات
  const statistics = useMemo(() => {
    return {
      total: beneficiaries.length,
      verified: beneficiaries.filter(b => b.identityStatus === 'verified').length,
      pending: beneficiaries.filter(b => b.identityStatus === 'pending').length,
      rejected: beneficiaries.filter(b => b.identityStatus === 'rejected').length,
      active: beneficiaries.filter(b => b.status === 'active').length,
      suspended: beneficiaries.filter(b => b.status === 'suspended').length
    };
  }, [beneficiaries]);

  // وظائف CRUD (محاكاة)
  const addBeneficiary = async (beneficiaryData: Partial<Beneficiary>) => {
    try {
      setLoading(true);
      
      // محاكاة إضافة مستفيد جديد
      const newBeneficiary: Beneficiary = {
        id: `new-${Date.now()}`,
        name: beneficiaryData.name || '',
        fullName: beneficiaryData.fullName || '',
        nationalId: beneficiaryData.nationalId || '',
        dateOfBirth: beneficiaryData.dateOfBirth || '',
        gender: beneficiaryData.gender || 'male',
        phone: beneficiaryData.phone || '',
        address: beneficiaryData.address || '',
        detailedAddress: beneficiaryData.detailedAddress || {
          governorate: '',
          city: '',
          district: '',
          street: '',
          additionalInfo: ''
        },
        location: beneficiaryData.location || { lat: 31.3469, lng: 34.3029 },
        organizationId: beneficiaryData.organizationId,
        familyId: beneficiaryData.familyId,
        relationToFamily: beneficiaryData.relationToFamily,
        profession: beneficiaryData.profession || '',
        maritalStatus: beneficiaryData.maritalStatus || 'single',
        economicLevel: beneficiaryData.economicLevel || 'poor',
        membersCount: beneficiaryData.membersCount || 1,
        additionalDocuments: beneficiaryData.additionalDocuments || [],
        identityStatus: 'pending',
        identityImageUrl: beneficiaryData.identityImageUrl,
        status: 'active',
        eligibilityStatus: 'under_review',
        lastReceived: new Date().toISOString().split('T')[0],
        totalPackages: 0,
        notes: beneficiaryData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        updatedBy: 'admin'
      };

      setBeneficiaries(prev => [newBeneficiary, ...prev]);
      logInfo(`تم إضافة مستفيد جديد: ${newBeneficiary.name}`, 'useBeneficiaries');
      return newBeneficiary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في إضافة المستفيد';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useBeneficiaries');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBeneficiary = async (id: string, updates: Partial<Beneficiary>) => {
    try {
      setLoading(true);
      
      setBeneficiaries(prev => 
        prev.map(b => 
          b.id === id 
            ? { ...b, ...updates, updatedAt: new Date().toISOString() }
            : b
        )
      );
      
      logInfo(`تم تحديث المستفيد: ${id}`, 'useBeneficiaries');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تحديث المستفيد';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useBeneficiaries');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBeneficiary = async (id: string) => {
    try {
      setLoading(true);
      
      setBeneficiaries(prev => prev.filter(b => b.id !== id));
      logInfo(`تم حذف المستفيد: ${id}`, 'useBeneficiaries');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في حذف المستفيد';
      setError(errorMessage);
      logError(new Error(errorMessage), 'useBeneficiaries');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    // إعادة تحميل البيانات
    setBeneficiaries([...mockBeneficiaries]);
  };

  return {
    beneficiaries: filteredBeneficiaries,
    allBeneficiaries: beneficiaries,
    loading,
    error,
    statistics,
    addBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    refetch
  };
};

// Hook مخصص للحصول على مستفيد واحد
export const useBeneficiary = (id: string) => {
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      const found = mockBeneficiaries.find(b => b.id === id);
      setBeneficiary(found || null);
      setError(found ? null : 'المستفيد غير موجود');
      setLoading(false);
    }
  }, [id]);

  return { beneficiary, loading, error };
};