import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  HardDrive, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from '../i18n/hooks/useTranslation';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface SystemMetrics {
  timestamp: number;
  system: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_connections: number;
  };
  instances: {
    active: number;
    total: number;
    healthy: number;
    average_response_time: number;
  };
  scaling: {
    last_event: number;
    cooldown_remaining: number;
    config: any;
  };
}

interface ScalingConfig {
  horizontal: {
    enabled: boolean;
    current_instances: number;
    min_instances: number;
    max_instances: number;
    target_cpu_usage: number;
    target_memory_usage: number;
  };
  vertical: {
    enabled: boolean;
    auto_tune: boolean;
    max_cpu_cores: number;
    max_memory_gb: number;
    target_cpu_utilization: number;
  };
  load_balancer: {
    enabled: boolean;
    algorithm: string;
    healthy_instances: number;
    total_instances: number;
  };
  caching: {
    enabled: boolean;
    max_size_gb: number;
    eviction_policy: string;
  };
}

interface ScalingRecommendations {
  type: string;
  action: string;
  reason: string;
  priority: string;
}

const ProductionMonitoringDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [config, setConfig] = useState<ScalingConfig | null>(null);
  const [recommendations, setRecommendations] = useState<ScalingRecommendations[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const [metricsRes, configRes, recommendationsRes] = await Promise.all([
        fetch('/api/scaling/status'),
        fetch('/api/scaling/config'),
        fetch('/api/scaling/recommendations')
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData.config);
      }

      if (recommendationsRes.ok) {
        const recData = await recommendationsRes.json();
        setRecommendations(recData.recommendations);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      fetchData(); // Initial fetch
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatNumber = (num: number, decimals: number = 1): string => {
    return num.toFixed(decimals);
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getStatusColor = (value: number, threshold: number): string => {
    if (value < threshold * 0.7) return 'text-green-600';
    if (value < threshold * 0.9) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8" />
        <span className="ml-2">{t('monitoring.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          {t('monitoring.productionDashboard')}
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={toggleAutoRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? t('monitoring.autoRefreshOn') : t('monitoring.autoRefreshOff')}
          </Button>
          <Button 
            onClick={fetchData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t('monitoring.refresh')}
          </Button>
        </div>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t('monitoring.lastUpdate')}: {lastUpdate.toLocaleString()}
        </div>
      )}

      {/* System Metrics */}
      <Card title={t('monitoring.systemMetrics')}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-5 w-5" />
              <span className="font-medium">{t('monitoring.cpuUsage')}</span>
            </div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics?.system?.cpu_usage || 0, 100)}`}>
              {formatNumber(metrics?.system?.cpu_usage || 0)}%
            </div>
            <div className="text-sm text-gray-500">
              Target: {config?.horizontal?.target_cpu_usage}%
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-5 w-5" />
              <span className="font-medium">{t('monitoring.memoryUsage')}</span>
            </div>
            <div className={`text-2xl font-bold ${getStatusColor(metrics?.system?.memory_usage || 0, 100)}`}>
              {formatNumber(metrics?.system?.memory_usage || 0)}%
            </div>
            <div className="text-sm text-gray-500">
              Target: {config?.horizontal?.target_memory_usage}%
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-5 w-5" />
              <span className="font-medium">{t('monitoring.diskUsage')}</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(metrics?.system?.disk_usage || 0)}%
            </div>
            <div className="text-sm text-gray-500">
              Current storage usage
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-5 w-5" />
              <span className="font-medium">{t('monitoring.networkConnections')}</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.system?.network_connections || 0}
            </div>
            <div className="text-sm text-gray-500">
              Active network connections
            </div>
          </div>
        </div>
      </Card>

      {/* Instance Management */}
      <Card title={t('monitoring.instanceManagement')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Server className="h-4 w-4" />
              {t('monitoring.instances')}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t('monitoring.activeInstances')}</span>
                <span className="font-medium">{metrics?.instances?.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('monitoring.totalInstances')}</span>
                <span className="font-medium">{metrics?.instances?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('monitoring.healthyInstances')}</span>
                <span className="font-medium text-green-600">{metrics?.instances?.healthy || 0}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('monitoring.scalingConfig')}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t('monitoring.minInstances')}</span>
                <span className="font-medium">{config?.horizontal?.min_instances || 1}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('monitoring.maxInstances')}</span>
                <span className="font-medium">{config?.horizontal?.max_instances || 4}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('monitoring.horizontalEnabled')}</span>
                <span className="font-medium">
                  {config?.horizontal?.enabled ? 
                    <CheckCircle className="h-4 w-4 text-green-600 inline" /> : 
                    <Clock className="h-4 w-4 text-gray-400 inline" />
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Response Time */}
        {metrics?.instances?.average_response_time !== undefined && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t('monitoring.avgResponseTime')}</span>
              <span className="text-blue-600 font-medium">
                {formatNumber((metrics.instances.average_response_time || 0) * 1000, 1)}ms
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Scaling Recommendations */}
      {recommendations.length > 0 && (
        <Card title={t('monitoring.scalingRecommendations')}>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                    <span className="font-medium">{rec.type}</span>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {rec.action === 'scale_up' && <TrendingUp className="h-4 w-4" />}
                    {rec.action === 'scale_down' && <TrendingDown className="h-4 w-4" />}
                    {rec.action === 'repair_instances' && <AlertTriangle className="h-4 w-4" />}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{rec.reason}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Load Balancer Status */}
      <Card title={t('monitoring.loadBalancer')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">{t('monitoring.algorithm')}</h3>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{config?.load_balancer?.algorithm || 'round_robin'}</span>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">{t('monitoring.healthStatus')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t('monitoring.healthyInstances')}</span>
                <span className="font-medium text-green-600">
                  {config?.load_balancer?.healthy_instances || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('monitoring.totalInstances')}</span>
                <span className="font-medium">{config?.load_balancer?.total_instances || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Cache Status */}
      {config?.caching && (
        <Card title={t('monitoring.cacheStatus')}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">{t('monitoring.enabled')}</div>
              <div className="font-medium">
                {config.caching.enabled ? 
                  <CheckCircle className="h-5 w-5 text-green-600 inline" /> : 
                  <Clock className="h-5 w-5 text-gray-400 inline" />
                }
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">{t('monitoring.maxSize')}</div>
              <div className="font-medium">{config.caching.max_size_gb} GB</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">{t('monitoring.evictionPolicy')}</div>
              <div className="font-medium">{config.caching.eviction_policy}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Cooldown Status */}
      {metrics?.scaling?.cooldown_remaining > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              {t('monitoring.scalingCooldown')}: {formatDuration(metrics.scaling.cooldown_remaining)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionMonitoringDashboard;