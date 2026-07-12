import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';

export const ApiStatusChecker: React.FC = () => {
  const { connected } = useStudioStore();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [healthStatus, setHealthStatus] = useState<'ok' | 'error' | 'checking'>('ok');

  const checkHealth = async () => {
    setIsChecking(true);
    setHealthStatus('checking');
    setLastCheck(new Date());

    try {
      const response = await fetch('http://127.0.0.1:8001/api/health');
      if (response.ok) {
        setHealthStatus('ok');
      } else {
        setHealthStatus('error');
      }
    } catch (error) {
      setHealthStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check health on mount and every 30 seconds
    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (healthStatus) {
      case 'ok': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'checking': return 'text-yellow-500';
      default: return 'text-studio-text-dim';
    }
  };

  const getStatusText = () => {
    switch (healthStatus) {
      case 'ok': return 'Connected';
      case 'error': return 'Connection Error';
      case 'checking': return 'Checking...';
      default: return 'Disconnected';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded text-[10px] font-bold ${getStatusColor()}`}>
      {isChecking && <Activity size={10} className="animate-spin" />}
      {!isChecking && (
        connected ? (
          <Wifi size={10} />
        ) : (
          <WifiOff size={10} />
        )
      )}
      <span>{getStatusText()}</span>
      {lastCheck && (
        <span className="opacity-60">
          {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};
