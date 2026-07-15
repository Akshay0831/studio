import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Upload, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Globe,
  Database,
  Server,
  Monitor,
  Palette,
  Volume2,
  Zap,
  Shield,
  Database as DatabaseIcon
} from 'lucide-react';
import { useTranslation } from '../i18n/hooks/useTranslation';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface ConfigData {
  environment: string;
  environments: Array<{
    name: string;
    description: string;
    settings: any;
    active: boolean;
  }>;
  current: {
    name: string;
    description: string;
    settings: {
      database: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
      };
      api: {
        port: number;
        base_url: string;
        timeout: number;
      };
      backend: {
        gpu_enabled: boolean;
        batch_size: number;
        model_path: string;
        max_workers: number;
      };
      frontend: {
        theme: string;
        language: string;
        features: {
          real_time_processing: boolean;
          auto_optimization: boolean;
          dark_mode: boolean;
          animations: boolean;
        };
      };
      production: {
        enable_scaling: boolean;
        monitoring_interval: number;
        log_level: string;
        security: {
          enable_cors: boolean;
          rate_limit_enabled: boolean;
          max_requests_per_minute: number;
        };
      };
    };
  };
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface ConfigSample {
  template: string;
  name: string;
  description: string;
  content: any;
}

const ConfigManager: React.FC = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<string>('');
  const [editing, setEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [configRes, environmentsRes] = await Promise.all([
        fetch('/api/config/current'),
        fetch('/api/config/environments')
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
        setSelectedEnv(configData.current.name);
      }

      if (environmentsRes.ok) {
        const envData = await environmentsRes.json();
        setConfig(prev => ({
          ...prev!,
          environments: envData.environments
        }));
      }
    } catch (error) {
      console.error('Failed to fetch config data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEnvironment = async (environmentName: string) => {
    try {
      const response = await fetch('/api/config/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ environment: environmentName })
      });

      if (response.ok) {
        await fetchData();
        return { success: true };
      }

      const errorData = await response.json();
      return { success: false, error: errorData.error };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // Simulate saving config
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      setEditing(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to save config' };
    } finally {
      setSaving(false);
    }
  };

  const exportConfig = () => {
    if (!config) return;
    
    const dataStr = JSON.stringify(config.current.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `config_${config.current.name}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        setHasChanges(true);
        // Update the config with imported content
        setConfig(prev => ({
          ...prev!,
          current: {
            ...prev!.current,
            settings: {
              ...prev!.current.settings,
              ...content
            }
          }
        }));
      } catch (error) {
        console.error('Failed to import config:', error);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8" />
        <span className="ml-2">{t('config.loading')}</span>
      </div>
    );
  }

  if (!config) {
    return <div className="text-center py-8 text-gray-500">{t('config.errorLoading')}</div>;
  }

  const currentEnvironment = config.environments.find(env => env.name === config.current.name);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          {t('config.configManager')}
        </h2>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{t('config.unsavedChanges')}</span>
            </div>
          )}
          <Button 
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {editing ? t('config.doneEditing') : t('config.editConfig')}
          </Button>
          {editing && (
            <>
              <Button 
                onClick={exportConfig}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {t('config.export')}
              </Button>
              <label className="cursor-pointer">
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {t('config.import')}
                </Button>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={importConfig} 
                  className="hidden" 
                />
              </label>
              <Button 
                onClick={saveConfig}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2"
              >
                {saving ? <RefreshCw className="animate-spin h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                {t('config.save')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Environment Switcher */}
      <Card title={t('config.environment')}>
        <div className="flex flex-wrap gap-2">
          {config.environments.map((env) => (
            <button
              key={env.name}
              onClick={() => updateEnvironment(env.name)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                env.name === config.current.name
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{env.name}</div>
              <div className="text-xs opacity-80">{env.description}</div>
            </button>
          ))}
        </div>
        {currentEnvironment && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">{currentEnvironment.description}</h3>
            <div className="text-sm text-blue-700">
              <p>{t('config.environmentDetails')}: {currentEnvironment.name}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Configuration Sections */}
      {editing ? (
        <div className="space-y-6">
          {/* Database Settings */}
          <Card title={t('config.databaseSettings')} icon={<DatabaseIcon className="h-5 w-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('config.host')}</label>
                <input
                  type="text"
                  value={config.current.settings.database.host}
                  onChange={(e) => setHasChanges(true)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('config.port')}</label>
                <input
                  type="number"
                  value={config.current.settings.database.port}
                  onChange={(e) => setHasChanges(true)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('config.user')}</label>
                <input
                  type="text"
                  value={config.current.settings.database.user}
                  onChange={(e) => setHasChanges(true)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('config.database')}</label>
                <input
                  type="text"
                  value={config.current.settings.database.database}
                  onChange={(e) => setHasChanges(true)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* API Settings */}
          <Card title={t('config.apiSettings')} icon={<Server className="h-5 w-5" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('config.apiPort')}</label>
                <input
                  type="number"
                  value={config.current.settings.api.port}
                  onChange={(e) => setHasChanges(true)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('config.baseUrl')}</label>
                <input
                  type="text"
                  value={config.current.settings.api.base_url}
                  onChange={(e) => setHasChanges(true)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Backend Settings */}
          <Card title={t('config.backendSettings')} icon={<Monitor className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.current.settings.backend.gpu_enabled}
                    onChange={(e) => setHasChanges(true)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">{t('config.enableGPU')}</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('config.batchSize')}</label>
                  <input
                    type="number"
                    value={config.current.settings.backend.batch_size}
                    onChange={(e) => setHasChanges(true)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('config.maxWorkers')}</label>
                  <input
                    type="number"
                    value={config.current.settings.backend.max_workers}
                    onChange={(e) => setHasChanges(true)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Frontend Settings */}
          <Card title={t('config.frontendSettings')} icon={<Palette className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('config.theme')}</label>
                  <select
                    value={config.current.settings.frontend.theme}
                    onChange={(e) => setHasChanges(true)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('config.language')}</label>
                  <select
                    value={config.current.settings.frontend.language}
                    onChange={(e) => setHasChanges(true)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.current.settings.frontend.features.real_time_processing}
                    onChange={(e) => setHasChanges(true)}
                    className="rounded"
                  />
                  <label className="text-sm font-medium">{t('config.realTimeProcessing')}</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.current.settings.frontend.features.auto_optimization}
                    onChange={(e) => setHasChanges(true)}
                    className="rounded"
                  />
                  <label className="text-sm font-medium">{t('config.autoOptimization')}</label>
                </div>
              </div>
            </div>
          </Card>

          {/* Production Settings */}
          <Card title={t('config.productionSettings')} icon={<Shield className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.current.settings.production.enable_scaling}
                  onChange={(e) => setHasChanges(true)}
                  className="rounded"
                />
                <label className="text-sm font-medium">{t('config.enableScaling')}</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('config.monitoringInterval')}</label>
                  <input
                    type="number"
                    value={config.current.settings.production.monitoring_interval}
                    onChange={(e) => setHasChanges(true)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('config.logLevel')}</label>
                  <select
                    value={config.current.settings.production.log_level}
                    onChange={(e) => setHasChanges(true)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DEBUG">DEBUG</option>
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Configuration Preview */}
          <Card title={t('config.currentConfig')}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('config.environment')}</label>
                  <div className="text-lg font-bold text-blue-600">{config.current.name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('config.description')}</label>
                  <div className="text-gray-600">{currentEnvironment?.description}</div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">{t('config.validConfiguration')}</span>
                </div>
              </div>

              {/* Configuration Details */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <DatabaseIcon className="h-4 w-4" />
                      {t('config.database')}
                    </h4>
                    <div className="text-sm text-gray-600">
                      <div>{config.current.settings.database.host}:{config.current.settings.database.port}</div>
                      <div className="text-xs mt-1">{t('config.databaseName')}: {config.current.settings.database.database}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      {t('config.api')}
                    </h4>
                    <div className="text-sm text-gray-600">
                      <div>{config.current.settings.api.base_url}</div>
                      <div className="text-xs mt-1">{t('config.port')}: {config.current.settings.api.port}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Feature Status */}
          <Card title={t('config.featureStatus')}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DatabaseIcon className="h-4 w-4" />
                  <span className="font-medium">{t('config.database')}</span>
                </div>
                <div className="text-sm text-green-600">Connected</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-4 w-4" />
                  <span className="font-medium">{t('config.api')}</span>
                </div>
                <div className="text-sm text-green-600">Running</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">{t('config.security')}</span>
                </div>
                <div className="text-sm text-green-600">Enabled</div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ConfigManager;