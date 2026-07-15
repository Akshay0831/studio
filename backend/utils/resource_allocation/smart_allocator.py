"""
Smart Resource Allocation System for Unified Editing Studio
Implements intelligent resource distribution, load balancing, and capacity management.
"""
import asyncio
import time
import threading
import logging
import json
import numpy as np
from typing import Dict, Any, List, Optional, Callable, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import psutil
import heapq
from collections import defaultdict, deque

logger = logging.getLogger("studio.backend.resource_allocation")

@dataclass
class ResourceRequirement:
    """Resource requirement specification"""
    cpu_cores: float = 0.0
    memory_gb: float = 0.0
    gpu_memory_gb: float = 0.0
    storage_gb: float = 0.0
    network_bandwidth_mbps: float = 0.0
    priority: int = 1  # 1-10, 1 being highest priority
    
@dataclass
class ResourceCapacity:
    """Resource capacity specification"""
    cpu_cores: float = 0.0
    memory_gb: float = 0.0
    gpu_memory_gb: float = 0.0
    storage_gb: float = 0.0
    network_bandwidth_mbps: float = 0.0
    available: bool = True
    
@dataclass
class ResourceAllocation:
    """Resource allocation result"""
    task_id: str
    allocated_resources: ResourceRequirement
    node_id: str
    allocated_at: float
    estimated_duration: float = 0.0
    actual_duration: float = 0.0
    cost: float = 0.0
    energy_consumption: float = 0.0

class ResourceNode:
    """Individual resource node (server/container/VM)"""
    
    def __init__(self, node_id: str, capacity: ResourceCapacity, location: str = "default"):
        self.node_id = node_id
        self.capacity = capacity
        self.location = location
        self.current_load = ResourceRequirement()
        self.allocations = []
        self.performance_metrics = deque(maxlen=100)
        self.health_status = "healthy"
        self.last_heartbeat = time.time()
        self.energy_efficiency = 1.0
        self.cost_efficiency = 1.0
        
    def can_allocate(self, requirement: ResourceRequirement) -> bool:
        """Check if node can allocate the required resources"""
        return (
            self.capacity.cpu_cores >= self.current_load.cpu_cores + requirement.cpu_cores and
            self.capacity.memory_gb >= self.current_load.memory_gb + requirement.memory_gb and
            self.capacity.gpu_memory_gb >= self.current_load.gpu_memory_gb + requirement.gpu_memory_gb and
            self.capacity.storage_gb >= self.current_load.storage_gb + requirement.storage_gb and
            self.capacity.network_bandwidth_mbps >= self.current_load.network_bandwidth_mbps + requirement.network_bandwidth_mbps and
            self.health_status == "healthy"
        )
    
    def allocate_resources(self, task_id: str, requirement: ResourceRequirement, duration: float) -> bool:
        """Allocate resources to a task"""
        if self.can_allocate(requirement):
            self.current_load.cpu_cores += requirement.cpu_cores
            self.current_load.memory_gb += requirement.memory_gb
            self.current_load.gpu_memory_gb += requirement.gpu_memory_gb
            self.current_load.storage_gb += requirement.storage_gb
            self.current_load.network_bandwidth_mbps += requirement.network_bandwidth_mbps
            
            allocation = ResourceAllocation(
                task_id=task_id,
                allocated_resources=requirement,
                node_id=self.node_id,
                allocated_at=time.time(),
                estimated_duration=duration
            )
            
            self.allocations.append(allocation)
            return True
        
        return False
    
    def release_resources(self, task_id: str) -> bool:
        """Release resources from a task"""
        for allocation in self.allocations:
            if allocation.task_id == task_id:
                # Subtract resources
                self.current_load.cpu_cores -= allocation.allocated_resources.cpu_cores
                self.current_load.memory_gb -= allocation.allocated_resources.memory_gb
                self.current_load.gpu_memory_gb -= allocation.allocated_resources.gpu_memory_gb
                self.current_load.storage_gb -= allocation.allocated_resources.storage_gb
                self.current_load.network_bandwidth_mbps -= allocation.allocated_resources.network_bandwidth_mbps
                
                # Record actual duration
                allocation.actual_duration = time.time() - allocation.allocated_at
                
                # Remove allocation
                self.allocations.remove(allocation)
                return True
        
        return False
    
    def get_utilization(self) -> float:
        """Get current utilization percentage"""
        total_capacity = (
            self.capacity.cpu_cores +
            self.capacity.memory_gb +
            self.capacity.gpu_memory_gb +
            self.capacity.storage_gb +
            self.capacity.network_bandwidth_mbps
        )
        
        if total_capacity == 0:
            return 0.0
        
        total_used = (
            self.current_load.cpu_cores +
            self.current_load.memory_gb +
            self.current_load.gpu_memory_gb +
            self.current_load.storage_gb +
            self.current_load.network_bandwidth_mbps
        )
        
        return (total_used / total_capacity) * 100
    
    def get_efficiency_score(self) -> float:
        """Calculate efficiency score (0-1, where 1 is best)"""
        utilization = self.get_utilization()
        
        # Optimal utilization is around 70-80%
        optimal_utilization = 75.0
        utilization_score = 1.0 - abs(utilization - optimal_utilization) / 100.0
        utilization_score = max(0.0, min(1.0, utilization_score))
        
        # Health score (healthy nodes get full score)
        health_score = 1.0 if self.health_status == "healthy" else 0.0
        
        # Energy efficiency
        energy_score = self.energy_efficiency
        
        # Cost efficiency
        cost_score = self.cost_efficiency
        
        # Weighted average
        return (
            0.4 * utilization_score +
            0.3 * health_score +
            0.2 * energy_score +
            0.1 * cost_score
        )

class LoadBalancingStrategy:
    """Base class for load balancing strategies"""
    
    def select_node(self, requirement: ResourceRequirement, nodes: List[ResourceNode]) -> Optional[ResourceNode]:
        """Select the best node for the requirement"""
        raise NotImplementedError

class RoundRobinStrategy(LoadBalancingStrategy):
    """Round-robin load balancing"""
    
    def __init__(self):
        self.current_index = 0
    
    def select_node(self, requirement: ResourceRequirement, nodes: List[ResourceNode]) -> Optional[ResourceNode]:
        available_nodes = [node for node in nodes if node.can_allocate(requirement)]
        
        if not available_nodes:
            return None
        
        selected = available_nodes[self.current_index % len(available_nodes)]
        self.current_index += 1
        return selected

class LeastLoadedStrategy(LoadBalancingStrategy):
    """Least loaded node selection"""
    
    def select_node(self, requirement: ResourceRequirement, nodes: List[ResourceNode]) -> Optional[ResourceNode]:
        available_nodes = [node for node in nodes if node.can_allocate(requirement)]
        
        if not available_nodes:
            return None
        
        return min(available_nodes, key=lambda x: x.get_utilization())

class EfficientStrategy(LoadBalancingStrategy):
    """Most efficient node selection"""
    
    def select_node(self, requirement: ResourceRequirement, nodes: List[ResourceNode]) -> Optional[ResourceNode]:
        available_nodes = [node for node in nodes if node.can_allocate(requirement)]
        
        if not available_nodes:
            return None
        
        return max(available_nodes, key=lambda x: x.get_efficiency_score())

class CostOptimizedStrategy(LoadBalancingStrategy):
    """Cost-optimized node selection"""
    
    def select_node(self, requirement: ResourceRequirement, nodes: List[ResourceNode]) -> Optional[ResourceNode]:
        available_nodes = [node for node in nodes if node.can_allocate(requirement)]
        
        if not available_nodes:
            return None
        
        return max(available_nodes, key=lambda x: x.cost_efficiency)

class SmartResourceAllocator:
    """Intelligent resource allocation system"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {
            "default_strategy": "efficient",
            "strategies": {
                "round_robin": RoundRobinStrategy(),
                "least_loaded": LeastLoadedStrategy(),
                "efficient": EfficientStrategy(),
                "cost_optimized": CostOptimizedStrategy()
            },
            "overcommit_ratio": 1.2,  # Allow 20% overcommitment
            "auto_scaling_enabled": True,
            "prediction_enabled": True,
            "optimization_interval": 60,  # seconds
            "prediction_window": 300,  # seconds (5 minutes)
            "energy_threshold": 0.8,  # Energy efficiency threshold
            "cost_threshold": 0.7   # Cost efficiency threshold
        }
        
        self.nodes = {}
        self.allocations = {}
        self.strategy = self.config["strategies"][self.config["default_strategy"]]
        self.current_strategy = self.config["default_strategy"]
        
        # Prediction system
        self.prediction_model = None
        self.training_data = deque(maxlen=1000)
        
        # Monitoring
        self.monitoring_task = None
        self.optimization_task = None
        self.is_running = False
        
        # Performance metrics
        self.metrics = {
            "total_allocations": 0,
            "successful_allocations": 0,
            "failed_allocations": 0,
            "average_allocation_time": 0.0,
            "system_efficiency": 0.0,
            "energy_efficiency": 0.0,
            "cost_efficiency": 0.0
        }
        
    def start(self):
        """Start the resource allocator"""
        self.is_running = True
        
        # Start monitoring task
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        
        # Start optimization task
        self.optimization_task = asyncio.create_task(self._optimization_loop())
        
        logger.info("Smart resource allocator started")
        
    def stop(self):
        """Stop the resource allocator"""
        self.is_running = False
        
        if self.monitoring_task:
            self.monitoring_task.cancel()
            
        if self.optimization_task:
            self.optimization_task.cancel()
            
        logger.info("Smart resource allocator stopped")
    
    def add_node(self, node: ResourceNode):
        """Add a resource node"""
        self.nodes[node.node_id] = node
        logger.info(f"Added resource node {node.node_id}")
    
    def remove_node(self, node_id: str):
        """Remove a resource node"""
        if node_id in self.nodes:
            # Release all allocations from this node
            node = self.nodes[node_id]
            for allocation in node.allocations:
                if allocation.task_id in self.allocations:
                    del self.allocations[allocation.task_id]
            
            del self.nodes[node_id]
            logger.info(f"Removed resource node {node_id}")
    
    def set_strategy(self, strategy_name: str):
        """Set the load balancing strategy"""
        if strategy_name in self.config["strategies"]:
            self.strategy = self.config["strategies"][strategy_name]
            self.current_strategy = strategy_name
            logger.info(f"Set load balancing strategy to {strategy_name}")
        else:
            raise ValueError(f"Unknown strategy: {strategy_name}")
    
    async def allocate_resources(self, task_id: str, requirement: ResourceRequirement, 
                              duration: float, priority: int = 1) -> Optional[str]:
        """Allocate resources for a task"""
        start_time = time.time()
        
        try:
            # Select best node
            selected_node = self.strategy.select_node(requirement, list(self.nodes.values()))
            
            if selected_node:
                # Allocate resources
                if selected_node.allocate_resources(task_id, requirement, duration):
                    # Track allocation
                    allocation = ResourceAllocation(
                        task_id=task_id,
                        allocated_resources=requirement,
                        node_id=selected_node.node_id,
                        allocated_at=time.time(),
                        estimated_duration=duration
                    )
                    
                    self.allocations[task_id] = allocation
                    
                    # Update metrics
                    self.metrics["total_allocations"] += 1
                    self.metrics["successful_allocations"] += 1
                    
                    allocation_time = time.time() - start_time
                    self._update_average_allocation_time(allocation_time)
                    
                    logger.info(f"Allocated resources for task {task_id} to node {selected_node.node_id}")
                    return selected_node.node_id
                else:
                    # Allocation failed
                    await self._handle_allocation_failure(task_id, requirement)
            else:
                # No available nodes
                await self._handle_allocation_failure(task_id, requirement)
            
        except Exception as e:
            logger.error(f"Error allocating resources for task {task_id}: {e}")
            await self._handle_allocation_failure(task_id, requirement)
        
        return None
    
    async def release_resources(self, task_id: str) -> bool:
        """Release resources for a task"""
        if task_id in self.allocations:
            allocation = self.allocations[task_id]
            
            if allocation.node_id in self.nodes:
                node = self.nodes[allocation.node_id]
                node.release_resources(task_id)
                
                # Update metrics
                self.metrics["total_allocations"] += 1
                
                # Calculate actual duration
                allocation.actual_duration = time.time() - allocation.allocated_at
                
                # Store for training
                self.training_data.append({
                    "requirement": {
                        "cpu": allocation.allocated_resources.cpu_cores,
                        "memory": allocation.allocated_resources.memory_gb,
                        "gpu_memory": allocation.allocated_resources.gpu_memory_gb,
                        "storage": allocation.allocated_resources.storage_gb,
                        "network": allocation.allocated_resources.network_bandwidth_mbps
                    },
                    "duration": allocation.actual_duration,
                    "node_efficiency": node.get_efficiency_score(),
                    "timestamp": time.time()
                })
                
                del self.allocations[task_id]
                logger.info(f"Released resources for task {task_id}")
                return True
        
        return False
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get current system status"""
        total_nodes = len(self.nodes)
        healthy_nodes = len([n for n in self.nodes.values() if n.health_status == "healthy"])
        
        total_capacity = ResourceRequirement()
        total_used = ResourceRequirement()
        
        for node in self.nodes.values():
            total_capacity.cpu_cores += node.capacity.cpu_cores
            total_capacity.memory_gb += node.capacity.memory_gb
            total_capacity.gpu_memory_gb += node.capacity.gpu_memory_gb
            total_capacity.storage_gb += node.capacity.storage_gb
            total_capacity.network_bandwidth_mbps += node.capacity.network_bandwidth_mbps
            
            total_used.cpu_cores += node.current_load.cpu_cores
            total_used.memory_gb += node.current_load.memory_gb
            total_used.gpu_memory_gb += node.current_load.gpu_memory_gb
            total_used.storage_gb += node.current_load.storage_gb
            total_used.network_bandwidth_mbps += node.current_load.network_bandwidth_mbps
        
        return {
            "total_nodes": total_nodes,
            "healthy_nodes": healthy_nodes,
            "unhealthy_nodes": total_nodes - healthy_nodes,
            "total_capacity": {
                "cpu_cores": total_capacity.cpu_cores,
                "memory_gb": total_capacity.memory_gb,
                "gpu_memory_gb": total_capacity.gpu_memory_gb,
                "storage_gb": total_capacity.storage_gb,
                "network_bandwidth_mbps": total_capacity.network_bandwidth_mbps
            },
            "total_used": {
                "cpu_cores": total_used.cpu_cores,
                "memory_gb": total_used.memory_gb,
                "gpu_memory_gb": total_used.gpu_memory_gb,
                "storage_gb": total_used.storage_gb,
                "network_bandwidth_mbps": total_used.network_bandwidth_mbps
            },
            "utilization_percentage": (
                (sum(total_used.__dict__.values()) / sum(total_capacity.__dict__.values())) * 100
                if sum(total_capacity.__dict__.values()) > 0 else 0
            ),
            "active_allocations": len(self.allocations),
            "current_strategy": self.current_strategy,
            "metrics": self.metrics,
            "nodes": {
                node_id: {
                    "utilization": node.get_utilization(),
                    "efficiency": node.get_efficiency_score(),
                    "health": node.health_status,
                    "allocations": len(node.allocations)
                }
                for node_id, node in self.nodes.items()
            }
        }
    
    async def _monitoring_loop(self):
        """Background monitoring loop"""
        while self.is_running:
            try:
                # Monitor node health and performance
                for node in self.nodes.values():
                    await self._monitor_node(node)
                
                # Update system metrics
                self._update_system_metrics()
                
                await asyncio.sleep(30)  # Run every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(60)
    
    async def _monitor_node(self, node: ResourceNode):
        """Monitor individual node health and performance"""
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory_percent = psutil.virtual_memory().percent
            
            # Update node performance metrics
            node.performance_metrics.append({
                "timestamp": time.time(),
                "cpu_percent": cpu_percent,
                "memory_percent": memory_percent,
                "utilization": node.get_utilization()
            })
            
            # Check health
            if cpu_percent > 95 or memory_percent > 95:
                node.health_status = "unhealthy"
                logger.warning(f"Node {node.node_id} is unhealthy (CPU: {cpu_percent}%, Memory: {memory_percent}%)")
            else:
                node.health_status = "healthy"
                
        except Exception as e:
            logger.error(f"Error monitoring node {node.node_id}: {e}")
            node.health_status = "unhealthy"
    
    async def _optimization_loop(self):
        """Background optimization loop"""
        while self.is_running:
            try:
                # Optimize resource allocation
                await self._optimize_allocations()
                
                # Predict future resource needs
                if self.config["prediction_enabled"]:
                    await self._predict_resource_needs()
                
                await asyncio.sleep(self.config["optimization_interval"])
                
            except Exception as e:
                logger.error(f"Error in optimization loop: {e}")
                await asyncio.sleep(120)
    
    async def _optimize_allocations(self):
        """Optimize current resource allocations"""
        # Check for inefficient allocations
        for allocation in self.allocations.values():
            node = self.nodes.get(allocation.node_id)
            if node:
                efficiency = node.get_efficiency_score()
                
                # Reallocate if efficiency is too low
                if efficiency < self.config["energy_threshold"]:
                    await self._reallocate_task(allocation.task_id)
    
    async def _predict_resource_needs(self):
        """Predict future resource needs"""
        if len(self.training_data) < 10:
            return
        
        # Simple linear regression for prediction
        recent_data = list(self.training_data)[-50:]  # Last 50 allocations
        
        # Calculate average resource usage trends
        cpu_trend = np.mean([d["requirement"]["cpu"] for d in recent_data])
        memory_trend = np.mean([d["requirement"]["memory"] for d in recent_data])
        
        logger.info(f"Predicted resource needs - CPU: {cpu_trend:.2f} cores, Memory: {memory_trend:.2f} GB")
    
    async def _reallocate_task(self, task_id: str):
        """Reallocate a task to a more efficient node"""
        if task_id in self.allocations:
            allocation = self.allocations[task_id]
            old_node_id = allocation.node_id
            
            # Release from old node
            if old_node_id in self.nodes:
                self.nodes[old_node_id].release_resources(task_id)
            
            # Try to reallocate
            requirement = allocation.allocated_resources
            new_node_id = await self.allocate_resources(task_id, requirement, allocation.estimated_duration)
            
            if new_node_id:
                logger.info(f"Reallocated task {task_id} from {old_node_id} to {new_node_id}")
            else:
                logger.warning(f"Failed to reallocate task {task_id}")
                # Put it back
                if old_node_id in self.nodes:
                    self.nodes[old_node_id].allocate_resources(task_id, requirement, allocation.estimated_duration)
    
    async def _handle_allocation_failure(self, task_id: str, requirement: ResourceRequirement):
        """Handle allocation failure"""
        self.metrics["total_allocations"] += 1
        self.metrics["failed_allocations"] += 1
        
        # Check if we need to add more nodes
        if self.config["auto_scaling_enabled"]:
            await self._check_auto_scaling(requirement)
        
        logger.warning(f"Failed to allocate resources for task {task_id}")
    
    async def _check_auto_scaling(self, requirement: ResourceRequirement):
        """Check if auto-scaling is needed"""
        # Calculate total capacity vs current usage
        total_capacity = sum(node.capacity.cpu_cores for node in self.nodes.values())
        total_used = sum(node.current_load.cpu_cores for node in self.nodes.values())
        
        # If capacity is exceeded by more than overcommit ratio, scale up
        if total_used > total_capacity * self.config["overcommit_ratio"]:
            logger.info("Auto-scaling triggered - consider adding more nodes")
    
    def _update_system_metrics(self):
        """Update system-wide metrics"""
        if self.nodes:
            # Calculate efficiency scores
            efficiency_scores = [node.get_efficiency_score() for node in self.nodes.values()]
            self.metrics["system_efficiency"] = np.mean(efficiency_scores)
            
            # Calculate energy efficiency (average)
            energy_scores = [node.energy_efficiency for node in self.nodes.values()]
            self.metrics["energy_efficiency"] = np.mean(energy_scores)
            
            # Calculate cost efficiency (average)
            cost_scores = [node.cost_efficiency for node in self.nodes.values()]
            self.metrics["cost_efficiency"] = np.mean(cost_scores)
    
    def _update_average_allocation_time(self, allocation_time: float):
        """Update average allocation time"""
        if self.metrics["total_allocations"] == 1:
            self.metrics["average_allocation_time"] = allocation_time
        else:
            # Exponential moving average
            alpha = 0.1
            self.metrics["average_allocation_time"] = (
                alpha * allocation_time + 
                (1 - alpha) * self.metrics["average_allocation_time"]
            )

# Global resource allocator instance
resource_allocator = SmartResourceAllocator()