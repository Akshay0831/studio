import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  Clock, 
  HardDrive, 
  FileArchive,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Database
} from 'lucide-react';
import { useTranslation } from '../i18n/hooks/useTranslation';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface Backup {
  backup_id: string;
  backup_name: string;
  type: string;
  description: string;
  timestamp: number;
  created_at: string;
  size: number;
  files: Array<{
    path: string;
    size: number;
    modified: number;
  }>;
  backup_path: string;
  success: boolean;
  error?: string;
  exists: boolean;
  file_size: number;
}

interface BackupStats {
  total_backups: number;
  total_size_bytes: number;
  total_size_mb: number;
  project_backups: number;
  full_backups: number;
  oldest_backup: Backup | null;
  newest_backup: Backup | null;
  backup_directory: string;
  max_backups: number;
  backup_interval_hours: number;
}

const BackupManager: React.FC = () => {
  const { t } = useTranslation();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const [backupsRes, statsRes] = await Promise.all([
        fetch('/api/backup/list'),
        fetch('/api/backup/statistics')
      ]);

      if (backupsRes.ok) {
        const backupsData = await backupsRes.json();
        setBackups(backupsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch backup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (manual: boolean = false, description: string = "") => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manual,
          description: description || (manual ? 'Manual backup' : 'Auto backup')
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await fetchData(); // Refresh the list
          return { success: true, backup_id: result.backup_id };
        }
      }

      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to create backup' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    } finally {
      setIsCreating(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/delete/${backupId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await fetchData(); // Refresh the list
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  };

  const downloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/download/${backupId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${backupId}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to download backup:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getBackupTypeColor = (type: string): string => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-800';
      case 'full': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8" />
        <span className="ml-2">{t('backup.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileArchive className="h-6 w-6" />
          {t('backup.backupManager')}
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t('backup.refresh')}
          </Button>
          <Button 
            onClick={() => createBackup(true, 'Manual backup created from UI')}
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            {isCreating ? <RefreshCw className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {t('backup.createBackup')}
          </Button>
        </div>
      </div>

      {/* Last Update */}
      {lastUpdate && (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t('backup.lastUpdate')}: {lastUpdate.toLocaleString()}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <Card title={t('backup.statistics')}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileArchive className="h-5 w-5" />
                <span className="font-medium">{t('backup.totalBackups')}</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.total_backups}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-5 w-5" />
                <span className="font-medium">{t('backup.totalSize')}</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.total_size_mb} MB</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5" />
                <span className="font-medium">{t('backup.projectBackups')}</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{stats.project_backups}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">{t('backup.backupInterval')}</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.backup_interval_hours}h</div>
            </div>
          </div>
        </Card>
      )}

      {/* Backups List */}
      <Card title={t('backup.backupsList')}>
        {backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileArchive className="h-12 w-12 mx-auto mb-4" />
            {t('backup.noBackups')}
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div 
                key={backup.backup_id} 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getBackupTypeColor(backup.type)}`}>
                      {backup.type}
                    </div>
                    <div>
                      <h3 className="font-medium">{backup.backup_name}</h3>
                      <p className="text-sm text-gray-600">{backup.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {backup.exists ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('backup.created')}</span>
                    <div className="font-medium">{formatDate(backup.timestamp)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('backup.size')}</span>
                    <div className="font-medium">{formatFileSize(backup.file_size)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('backup.files')}</span>
                    <div className="font-medium">{backup.files.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('backup.type')}</span>
                    <div className="font-medium">{backup.type}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="text-sm text-gray-500">
                    {backup.backup_id}
                  </div>
                  <div className="flex items-center gap-2">
                    {backup.exists && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadBackup(backup.backup_id)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {t('backup.download')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBackup(backup)}
                          className="flex items-center gap-2"
                        >
                          <Database className="h-4 w-4" />
                          {t('backup.restore')}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBackup(backup.backup_id)}
                      disabled={!backup.exists}
                      className="flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('backup.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Restore Modal */}
      {selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">{t('backup.restoreBackup')}</h3>
            <p className="text-gray-600 mb-4">
              {t('backup.restoreConfirmation')}: {selectedBackup.backup_name} ({selectedBackup.type})
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedBackup(null)}>
                {t('backup.cancel')}
              </Button>
              <Button 
                onClick={() => {
                  // Handle restore logic here
                  setSelectedBackup(null);
                }}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                {t('backup.restore')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Backup Schedule */}
      {stats && (
        <Card title={t('backup.autoBackupSchedule')}>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">
                  {t('backup.autoBackupNext')}
                </p>
                <p className="text-sm text-blue-600">
                  {t('backup.backupInterval')}: {stats.backup_interval_hours} {t('backup.hours')}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BackupManager;