import asyncio
import logging
import time
import json
import os
import psutil
import threading
from typing import Dict, Any, List, Optional, Callable
from pathlib import Path
from utils.base_service import BaseStudioService
from utils.telemetry import trace_performance
from config import settings

logger = logging.getLogger("studio.backend.scaling")

class ScalingService(BaseStudioService):
    def __init__(self):
        super().__init__("scaling")
        self.scaling_config = {
            "horizontal": {
                "enabled": True,
                "min_instances": 1,
                "max_instances": 4,
                "target_cpu_usage": 70,  # Target CPU usage percentage
                "target_memory_usage": 80,  # Target memory usage percentage
                "scale_up_threshold": 85,  # Scale up when CPU > 85%
                "scale_down_threshold": 40,  # Scale down when CPU < 40%
                "cooldown_period": 300,  # 5 minutes between scaling events
                "health_check_interval": 30,  # 30 seconds
                "instance_timeout": 60  # 60 seconds to respond to health check
            },
            "vertical": {
                "enabled": True,
                "auto_tune": True,
                "max_cpu_cores": psutil.cpu_count() or 4,
                "max_memory_gb": psutil.virtual_memory().total // (1024**3),
                "target_cpu_utilization": 75,
                "optimization_interval": 600,  # 10 minutes
                "memory_threshold_high": 90,  # Scale up memory usage > 90%
                "memory_threshold_low": 30   # Scale down memory usage < 30%
            },
            "load_balancer": {
                "enabled": True,
                "algorithm": "round_robin",  # round_robin, least_connections, weighted_round_robin
                "health_check": {
                    "enabled": True,
                    "interval": 10,  # 10 seconds
                    "timeout": 5,    # 5 seconds
                    "path": "/health",
                    "expected_status": 200
                },
                "session_affinity": False
            },
            "caching": {
                "enabled": True,
                "max_size_gb": 4,
                "ttl": 3600,  # 1 hour
                "eviction_policy": "lru",  # lru, lfu, fifo
                "compression": True
            }
        }
        
        self.instances = {}  # Active instances
        self.instance_health = {}  # Health status of instances
        self.scaling_metrics = {}  # Performance metrics
        self.last_scaling_event = 0
        self.optimization_running = False
        
        # Initialize monitoring
        self._start_monitoring()

    def _start_monitoring(self):
        """Start background monitoring for scaling."""
        monitoring_thread = threading.Thread(target=self._monitoring_loop_sync, daemon=True)
        monitoring_thread.start()
        
        # Start optimization loop for vertical scaling
        optimization_thread = threading.Thread(target=self._optimization_loop, daemon=True)
        optimization_thread.start()

    def _monitoring_loop_sync(self):
        """Background monitoring loop for horizontal scaling."""
        while True:
            try:
                if self.scaling_config["horizontal"]["enabled"]:
                    asyncio.run(self._check_horizontal_scaling())
                
                if self.scaling_config["load_balancer"]["enabled"]:
                    asyncio.run(self._update_load_balancer())
                
                time.sleep(self.scaling_config["check_interval"])
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(5)  # Wait before retrying

    async def _monitoring_loop(self):
        """Background monitoring loop for horizontal scaling."""
        while True:
            try:
                if self.scaling_config["horizontal"]["enabled"]:
                    await self._check_horizontal_scaling()
                
                if self.scaling_config["load_balancer"]["enabled"]:
                    await self._update_load_balancer()
                
                # Update metrics
                await self._update_metrics()
                
                time.sleep(self.scaling_config["horizontal"]["health_check_interval"])
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(60)  # Wait 1 minute before retrying

    def _optimization_loop(self):
        """Background optimization loop for vertical scaling."""
        while True:
            try:
                if self.scaling_config["vertical"]["enabled"] and self.scaling_config["vertical"]["auto_tune"]:
                    asyncio.run(self._optimize_vertical_scaling())
                
                time.sleep(self.scaling_config["vertical"]["optimization_interval"])
                
            except Exception as e:
                logger.error(f"Error in optimization loop: {e}")
                time.sleep(60)  # Wait 1 minute before retrying

    async def _check_horizontal_scaling(self):
        """Check if horizontal scaling is needed."""
        current_time = time.time()
        
        # Check cooldown period
        if current_time - self.last_scaling_event < self.scaling_config["horizontal"]["cooldown_period"]:
            return
        
        # Get system metrics
        cpu_usage = psutil.cpu_percent(interval=1)
        memory_usage = psutil.virtual_memory().percent
        
        # Determine scaling action
        scale_action = await self._determine_scale_action(cpu_usage, memory_usage)
        
        if scale_action:
            await self._execute_scaling_action(scale_action)

    async def _determine_scale_action(self, cpu_usage: float, memory_usage: float) -> Optional[str]:
        """Determine if scaling is needed and what action to take."""
        horizontal_config = self.scaling_config["horizontal"]
        active_instances = len([i for i in self.instances.values() if i.get("active", False)])
        
        # Check if we need to scale up
        if (cpu_usage > horizontal_config["scale_up_threshold"] or 
            memory_usage > horizontal_config["scale_up_threshold"]) and \
           active_instances < horizontal_config["max_instances"]:
            return "scale_up"
        
        # Check if we need to scale down
        elif (cpu_usage < horizontal_config["scale_down_threshold"] and 
              memory_usage < horizontal_config["scale_down_threshold"]) and \
             active_instances > horizontal_config["min_instances"]:
            return "scale_down"
        
        return None

    async def _execute_scaling_action(self, action: str):
        """Execute scaling action."""
        try:
            if action == "scale_up":
                await self._scale_up()
                logger.info("Executed scale up action")
            elif action == "scale_down":
                await self._scale_down()
                logger.info("Executed scale down action")
            
            self.last_scaling_event = time.time()
            
        except Exception as e:
            logger.error(f"Failed to execute scaling action {action}: {e}")

    async def _scale_up(self):
        """Scale up by adding a new instance."""
        instance_id = f"instance_{int(time.time())}"
        
        try:
            # Create new instance configuration
            instance_config = {
                "id": instance_id,
                "created_at": time.time(),
                "cpu_cores": self.scaling_config["vertical"]["max_cpu_cores"] // 2,
                "memory_gb": self.scaling_config["vertical"]["max_memory_gb"] // 2,
                "status": "starting",
                "active": False,
                "health_check_passed": False,
                "request_count": 0,
                "error_count": 0
            }
            
            # Start the instance (this would be actual process spawning in real implementation)
            self.instances[instance_id] = instance_config
            
            # Mark as active after startup
            await asyncio.sleep(5)  # Simulate startup time
            instance_config["status"] = "active"
            instance_config["active"] = True
            
            logger.info(f"Started new instance: {instance_id}")
            
        except Exception as e:
            logger.error(f"Failed to scale up: {e}")
            if instance_id in self.instances:
                del self.instances[instance_id]

    async def _scale_down(self):
        """Scale down by removing an instance."""
        try:
            # Find least busy instance
            instance_to_remove = await self._select_instance_for_removal()
            
            if instance_to_remove:
                instance_config = self.instances[instance_to_remove]
                instance_config["status"] = "terminating"
                instance_config["active"] = False
                
                # Terminate the instance (this would be actual process termination in real implementation)
                await asyncio.sleep(3)  # Simulate termination time
                
                del self.instances[instance_to_remove]
                logger.info(f"Terminated instance: {instance_to_remove}")
                
        except Exception as e:
            logger.error(f"Failed to scale down: {e}")

    async def _select_instance_for_removal(self) -> Optional[str]:
        """Select an instance for removal based on various criteria."""
        active_instances = [i for i in self.instances.values() if i.get("active", False)]
        
        if not active_instances:
            return None
        
        # Sort by request count (remove least busy)
        active_instances.sort(key=lambda x: x.get("request_count", 0))
        
        return active_instances[0]["id"]

    async def _update_load_balancer(self):
        """Update load balancer configuration."""
        active_instances = [i for i in self.instances.values() if i.get("active", False)]
        
        # Update instance health
        for instance_id, instance_config in self.instances.items():
            if instance_config.get("active", False):
                await self._check_instance_health(instance_id)

    async def _check_instance_health(self, instance_id: str):
        """Check health of a specific instance."""
        try:
            # This would be an actual HTTP health check in real implementation
            # For now, we'll simulate it
            healthy = True  # Simulate health check
            
            self.instance_health[instance_id] = {
                "healthy": healthy,
                "last_check": time.time(),
                "response_time": 0.1  # Simulate response time
            }
            
        except Exception as e:
            logger.error(f"Health check failed for instance {instance_id}: {e}")
            self.instance_health[instance_id] = {
                "healthy": False,
                "last_check": time.time(),
                "response_time": None
            }

    async def _update_metrics(self):
        """Update scaling metrics."""
        try:
            self.scaling_metrics = {
                "timestamp": time.time(),
                "system": {
                    "cpu_usage": psutil.cpu_percent(interval=1),
                    "memory_usage": psutil.virtual_memory().percent,
                    "disk_usage": psutil.disk_usage('/').percent,
                    "network_connections": len(psutil.net_connections())
                },
                "instances": {
                    "active": len([i for i in self.instances.values() if i.get("active", False)]),
                    "total": len(self.instances),
                    "healthy": len([h for h in self.instance_health.values() if h.get("healthy", False)]),
                    "average_response_time": sum(h.get("response_time", 0) for h in self.instance_health.values()) / max(len(self.instance_health), 1)
                },
                "scaling": {
                    "last_event": self.last_scaling_event,
                    "cooldown_remaining": max(0, self.scaling_config["horizontal"]["cooldown_period"] - (time.time() - self.last_scaling_event)),
                    "config": self.scaling_config
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to update metrics: {e}")

    async def _optimize_vertical_scaling(self):
        """Optimize vertical scaling (resource allocation)."""
        try:
            # Get current resource usage
            cpu_usage = psutil.cpu_percent(interval=1)
            memory_usage = psutil.virtual_memory().percent
            
            # Get current configuration
            current_config = self.scaling_config["vertical"]
            
            # Adjust CPU allocation
            if cpu_usage > current_config["memory_threshold_high"] and current_config["max_cpu_cores"] < 16:
                current_config["max_cpu_cores"] += 1
                logger.info(f"Increased CPU cores to {current_config['max_cpu_cores']}")
            
            elif cpu_usage < current_config["memory_threshold_low"] and current_config["max_cpu_cores"] > 1:
                current_config["max_cpu_cores"] -= 1
                logger.info(f"Decreased CPU cores to {current_config['max_cpu_cores']}")
            
            # Adjust memory allocation
            if memory_usage > current_config["memory_threshold_high"] and current_config["max_memory_gb"] < 16:
                current_config["max_memory_gb"] += 1
                logger.info(f"Increased memory to {current_config['max_memory_gb']}GB")
            
            elif memory_usage < current_config["memory_threshold_low"] and current_config["max_memory_gb"] > 1:
                current_config["max_memory_gb"] -= 1
                logger.info(f"Decreased memory to {current_config['max_memory_gb']}GB")
            
        except Exception as e:
            logger.error(f"Failed to optimize vertical scaling: {e}")

    @trace_performance("get_scaling_status")
    def get_scaling_status(self) -> Dict[str, Any]:
        """Get current scaling status and metrics."""
        return {
            "horizontal": {
                "enabled": self.scaling_config["horizontal"]["enabled"],
                "current_instances": len([i for i in self.instances.values() if i.get("active", False)]),
                "min_instances": self.scaling_config["horizontal"]["min_instances"],
                "max_instances": self.scaling_config["horizontal"]["max_instances"],
                "target_cpu_usage": self.scaling_config["horizontal"]["target_cpu_usage"],
                "target_memory_usage": self.scaling_config["horizontal"]["target_memory_usage"]
            },
            "vertical": {
                "enabled": self.scaling_config["vertical"]["enabled"],
                "auto_tune": self.scaling_config["vertical"]["auto_tune"],
                "max_cpu_cores": self.scaling_config["vertical"]["max_cpu_cores"],
                "max_memory_gb": self.scaling_config["vertical"]["max_memory_gb"],
                "target_cpu_utilization": self.scaling_config["vertical"]["target_cpu_utilization"]
            },
            "load_balancer": {
                "enabled": self.scaling_config["load_balancer"]["enabled"],
                "algorithm": self.scaling_config["load_balancer"]["algorithm"],
                "healthy_instances": len([h for h in self.instance_health.values() if h.get("healthy", False)]),
                "total_instances": len(self.instance_health)
            },
            "caching": {
                "enabled": self.scaling_config["caching"]["enabled"],
                "max_size_gb": self.scaling_config["caching"]["max_size_gb"],
                "eviction_policy": self.scaling_config["caching"]["eviction_policy"]
            },
            "metrics": self.scaling_metrics,
            "instances": self.instances,
            "instance_health": self.instance_health
        }

    def update_scaling_config(self, config: Dict[str, Any]):
        """Update scaling configuration."""
        self.scaling_config.update(config)
        logger.info("Scaling configuration updated")

    def get_scaling_recommendations(self) -> List[Dict[str, Any]]:
        """Get scaling recommendations based on current state."""
        recommendations = []
        
        if not self.scaling_metrics:
            return recommendations
        
        metrics = self.scaling_metrics
        system_metrics = metrics.get("system", {})
        instances_metrics = metrics.get("instances", {})
        
        # Check if scaling is needed
        cpu_usage = system_metrics.get("cpu_usage", 0)
        memory_usage = system_metrics.get("memory_usage", 0)
        active_instances = instances_metrics.get("active", 0)
        
        horizontal_config = self.scaling_config["horizontal"]
        
        # CPU-based recommendations
        if cpu_usage > horizontal_config["scale_up_threshold"] and active_instances < horizontal_config["max_instances"]:
            recommendations.append({
                "type": "horizontal",
                "action": "scale_up",
                "reason": f"High CPU usage ({cpu_usage}%) exceeds threshold ({horizontal_config['scale_up_threshold']}%)",
                "priority": "high"
            })
        
        elif cpu_usage < horizontal_config["scale_down_threshold"] and active_instances > horizontal_config["min_instances"]:
            recommendations.append({
                "type": "horizontal", 
                "action": "scale_down",
                "reason": f"Low CPU usage ({cpu_usage}%) below threshold ({horizontal_config['scale_down_threshold']}%)",
                "priority": "medium"
            })
        
        # Memory-based recommendations
        if memory_usage > horizontal_config["scale_up_threshold"] and active_instances < horizontal_config["max_instances"]:
            recommendations.append({
                "type": "horizontal",
                "action": "scale_up", 
                "reason": f"High memory usage ({memory_usage}%) exceeds threshold ({horizontal_config['scale_up_threshold']}%)",
                "priority": "high"
            })
        
        elif memory_usage < horizontal_config["scale_down_threshold"] and active_instances > horizontal_config["min_instances"]:
            recommendations.append({
                "type": "horizontal",
                "action": "scale_down",
                "reason": f"Low memory usage ({memory_usage}%) below threshold ({horizontal_config['scale_down_threshold']}%)", 
                "priority": "medium"
            })
        
        # Instance health recommendations
        healthy_instances = instances_metrics.get("healthy", 0)
        total_instances = instances_metrics.get("total", 0)
        
        if healthy_instances < total_instances and total_instances > 0:
            unhealthy_ratio = 1 - (healthy_instances / total_instances)
            if unhealthy_ratio > 0.5:
                recommendations.append({
                    "type": "maintenance",
                    "action": "repair_instances",
                    "reason": f"High ratio of unhealthy instances ({unhealthy_ratio:.1%})",
                    "priority": "high"
                })
        
        return recommendations

    async def manual_scale_up(self, count: int = 1):
        """Manually scale up by specified number of instances."""
        try:
            horizontal_config = self.scaling_config["horizontal"]
            active_instances = len([i for i in self.instances.values() if i.get("active", False)])
            max_possible = min(count, horizontal_config["max_instances"] - active_instances)
            
            if max_possible <= 0:
                return {
                    "success": False,
                    "message": "Cannot scale up: maximum instances reached"
                }
            
            for _ in range(max_possible):
                await self._scale_up()
            
            return {
                "success": True,
                "message": f"Scaled up by {max_possible} instances",
                "active_instances": len([i for i in self.instances.values() if i.get("active", False)])
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to scale up: {str(e)}"
            }

    async def manual_scale_down(self, count: int = 1):
        """Manually scale down by specified number of instances."""
        try:
            horizontal_config = self.scaling_config["horizontal"]
            active_instances = len([i for i in self.instances.values() if i.get("active", False)])
            max_possible = min(count, active_instances - horizontal_config["min_instances"])
            
            if max_possible <= 0:
                return {
                    "success": False,
                    "message": "Cannot scale down: minimum instances reached"
                }
            
            for _ in range(max_possible):
                await self._scale_down()
            
            return {
                "success": True,
                "message": f"Scaled down by {max_possible} instances",
                "active_instances": len([i for i in self.instances.values() if i.get("active", False)])
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to scale down: {str(e)}"
            }

# Global scaling service instance
scaling_service = ScalingService()