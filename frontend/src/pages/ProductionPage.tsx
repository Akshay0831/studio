import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/hooks/useTranslation';
import ProductionDashboard from '../components/ProductionDashboard';
import { useAuth } from '../contexts/AuthContext';

const ProductionPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isProductionMode, setIsProductionMode] = useState(false);

  useEffect(() => {
    // Check if user has production access
    if (user?.role === 'admin' || user?.role === 'production') {
      setIsProductionMode(true);
    }
  }, [user]);

  if (!isProductionMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('production.accessDenied')}
          </h2>
          <p className="text-gray-600">
            {t('production.contactAdmin')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <ProductionDashboard />
      </div>
    </div>
  );
};

export default ProductionPage;