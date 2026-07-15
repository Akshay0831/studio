import React, { useState, useEffect } from 'react';
import ProductionMonitoringDashboard from './ProductionMonitoringDashboard';
import BackupManager from './BackupManager';
import ConfigManager from './ConfigManager';
import { useTranslation } from '../i18n/hooks/useTranslation';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface DashboardTab {
  id: string;
  title: string;
  icon: string;
  component: React.ComponentType<any>;
  description: string;
}

const ProductionDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('monitoring');
  const [loading, setLoading] = useState(true);

  const tabs: DashboardTab[] = [
    {
      id: 'monitoring',
      title: t('production.monitoring'),
      icon: 'monitoring',
      component: ProductionMonitoringDashboard,
      description: t('production.monitoringDescription')
    },
    {
      id: 'backup',
      title: t('production.backup'),
      icon: 'backup',
      component: BackupManager,
      description: t('production.backupDescription')
    },
    {
      id: 'config',
      title: t('production.config'),
      icon: 'config',
      component: ConfigManager,
      description: t('production.configDescription')
    }
  ];

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">{t('production.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('production.productionDashboard')}</h1>
          <p className="text-gray-600 mt-1">{t('production.overview')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            {t('production.reload')}
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <Card title={t('production.systemStatus')}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-800">{t('production.status')}</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">Operational</div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-800">{t('production.instances')}</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">4 Active</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="font-medium text-purple-800">{t('production.backups')}</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">12 Stored</div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="font-medium text-orange-800">{t('production.metrics')}</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-1">Real-time</div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <span>{tab.title}</span>
              {activeTab === tab.id && (
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {ActiveComponent ? <ActiveComponent /> : (
          <div className="text-center py-8 text-gray-500">
            {t('production.selectTab')}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card title={t('production.quickActions')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setActiveTab('monitoring');
            }}
            className="h-16 flex flex-col items-center justify-center"
          >
            <span className="font-medium">{t('production.viewMetrics')}</span>
            <span className="text-xs text-gray-500 mt-1">{t('production.realTime')}</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setActiveTab('backup');
            }}
            className="h-16 flex flex-col items-center justify-center"
          >
            <span className="font-medium">{t('production.manageBackups')}</span>
            <span className="text-xs text-gray-500 mt-1">{t('production.projectBackups')}</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setActiveTab('config');
            }}
            className="h-16 flex flex-col items-center justify-center"
          >
            <span className="font-medium">{t('production.manageConfig')}</span>
            <span className="text-xs text-gray-500 mt-1">{t('production.envSettings')}</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProductionDashboard;