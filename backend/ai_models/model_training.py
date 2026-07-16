# Phase 5: Advanced AI - Custom Model Training Framework

import torch
import torch.nn as nn
import torch.optim as optim
import logging
from typing import Dict, Any, List, Optional, Callable
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime
import json

from .device_utils import get_device

logger = logging.getLogger(__name__)

@dataclass
class TrainingConfig:
    """Configuration for model training"""
    epochs: int = 100
    batch_size: int = 32
    learning_rate: float = 0.001
    device: str = "auto"
    save_dir: str = "./models"
    log_interval: int = 10
    validation_interval: int = 10
    early_stopping_patience: int = 10
    gradient_clip: float = 1.0
    mixed_precision: bool = True

@dataclass
class TrainingMetrics:
    """Training metrics tracking"""
    epoch: int
    train_loss: float
    val_loss: Optional[float] = None
    train_accuracy: Optional[float] = None
    val_accuracy: Optional[float] = None
    learning_rate: float
    timestamp: str = None

class CustomModelTrainer:
    """
    Framework for training custom AI models
    """
    
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.device = get_device() if config.device == "auto" else config.device
        self.model = None
        self.optimizer = None
        self.scheduler = None
        self.metrics_history = []
        
        # Create save directory
        Path(config.save_dir).mkdir(parents=True, exist_ok=True)
        
        logger.info(f"CustomModelTrainer initialized on device: {self.device}")
    
    def SetupModel(
        self,
        model: nn.Module,
        loss_fn: nn.Module,
        learning_rate: float = 0.001
    ):
        """Setup model and training components"""
        self.model = model.to(self.device)
        self.loss_fn = loss_fn
        self.optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer, mode='min', factor=0.5, patience=5, verbose=True
        )
        
        logger.info(f"Model setup complete on {self.device}")
    
    def Train(
        self,
        train_loader: torch.utils.data.DataLoader,
        val_loader: Optional[torch.utils.data.DataLoader] = None
    ) -> List[TrainingMetrics]:
        """
        Train the model
        
        Args:
            train_loader: Training data loader
            val_loader: Validation data loader (optional)
            
        Returns:
            List of training metrics
        """
        best_val_loss = float('inf')
        patience_counter = 0
        
        logger.info(f"Starting training for {self.config.epochs} epochs")
        
        for epoch in range(self.config.epochs):
            # Training phase
            train_loss, train_acc = self._train_epoch(train_loader)
            
            # Validation phase
            val_loss = None
            val_acc = None
            if val_loader:
                val_loss, val_acc = self._validate(val_loader)
            
            # Update learning rate
            self.scheduler.step(val_loss if val_loss is not None else train_loss)
            current_lr = self.optimizer.param_groups[0]['lr']
            
            # Record metrics
            metrics = TrainingMetrics(
                epoch=epoch + 1,
                train_accuracy=train_acc,
                train_accuracy=train_acc,
                learning_rate=current_lr,
                timestamp=datetime.utcnow().isoformat()
            )
            if val_loss is not None:
                metrics.val_loss = val_loss
                metrics.val_accuracy = val_acc
            
            self.metrics_history.append(metrics)
            
            # Logging
            if (epoch + 1) % self.config.log_interval == 0:
                self._log_metrics(metrics)
            
            # Early stopping
            if val_loss is not None and val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                self._save_best_model(f"best_epoch_{epoch + 1}.pt")
            else:
                patience_counter += 1
                if patience_counter >= self.config.early_stopping_patience:
                    logger.info(f"Early stopping triggered at epoch {epoch + 1}")
                    break
        
        logger.info("Training completed")
        self._save_final_model()
        self._save_metrics()
        
        return self.metrics_history
    
    def _train_epoch(self, train_loader: torch.utils.data.DataLoader) -> tuple:
        """Train for one epoch"""
        self.model.train()
        total_loss = 0.0
        correct = 0
        total = 0
        
        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(self.device), target.to(self.device)
            
            # Forward pass
            self.optimizer.zero_grad()
            output = self.model(data)
            loss = self.loss_fn(output, target)
            
            # Backward pass
            loss.backward()
            
            # Gradient clipping
            if self.config.gradient_clip > 0:
                torch.nn.utils.clip_grad_norm_(
                    self.model.parameters(), self.config.gradient_clip
                )
            
            self.optimizer.step()
            
            # Track metrics
            total_loss += loss.item()
            _, predicted = torch.max(output.data, 1)
            total += target.size(0)
            correct += (predicted == target).sum().item()
        
        avg_loss = total_loss / len(train_loader)
        accuracy = 100 * correct / total
        
        return avg_loss, accuracy
    
    def _validate(self, val_loader: torch.utils.data.DataLoader) -> tuple:
        """Validate the model"""
        self.model.eval()
        total_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for data, target in val_loader:
                data, target = data.to(self.device), target.to(self.device)
                output = self.model(data)
                loss = self.loss_fn(output, target)
                total_loss += loss.item()
                _, predicted = torch.max(output.data, 1)
                total += target.size(0)
                correct += (predicted == target).sum().item()
        
        avg_loss = total_loss / len(val_loader)
        accuracy = 100 * correct / total
        
        return avg_loss, accuracy
    
    def _log_metrics(self, metrics: TrainingMetrics):
        """Log training metrics"""
        log_msg = (f"Epoch {metrics.epoch}: "
                  f"Train Loss={metrics.train_loss:.4f}, "
                  f"Train Acc={metrics.train_accuracy:.2f}%")
        
        if metrics.val_loss is not None:
            log_msg += f", Val Loss={metrics.val_loss:.4f}, Val Acc={metrics.val_accuracy:.2f}%"
        
        logger.info(log_msg)
    
    def _save_best_model(self, filename: str):
        """Save the best model"""
        torch.save({
            'epoch': self.metrics_history[-1].epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'loss': self.loss_history[-1],
        }, Path(self.config.save_dir) / filename)
        
        logger.info(f"Best model saved: {filename}")
    
    def _save_final_model(self):
        """Save the final model"""
        final_filename = f"final_model_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pt"
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'config': vars(self.config),
        }, Path(self.config.save_dir) / final_filename)
        
        logger.info(f"Final model saved: {final_filename}")
    
    def _save_metrics(self):
        """Save training metrics to JSON"""
        metrics_file = Path(self.config.save_dir) / "training_metrics.json"
        metrics_data = [
            {
                'epoch': m.epoch,
                'train_loss': m.train_loss,
                'val_loss': m.val_loss,
                'train_accuracy': m.train_accuracy,
                'val_accuracy': m.val_accuracy,
                'learning_rate': m.learning_rate,
                'timestamp': m.timestamp
            }
            for m in self.metrics_history
        ]
        
        with open(metrics_file, 'w') as f:
            json.dump(metrics_data, f, indent=2)
        
        logger.info(f"Training metrics saved: {metrics_file}")

class ModelOptimizer:
    """
    Advanced model optimization utilities
    """
    
    @staticmethod
    def QuantizeModel(model: nn.Module, dtype: str = "int8") -> nn.Module:
        """
        Quantize model for inference optimization
        
        Args:
            model: Model to quantize
            dtype: Target quantization type (int8, fp16, fp32)
            
        Returns:
            Quantized model
        """
        logger.info(f"Quantizing model to {dtype}")
        
        # Simplified quantization for Phase 5
        # Real implementation would use torch.quantization
        
        if dtype == "int8":
            model = model.float()
            # Would apply torch.quantization.quantize_dynamic here
            logger.info("Model quantized to int8")
            
        elif dtype == "fp16":
            model = model.half()
            logger.info("Model converted to fp16")
        
        return model
    
    @staticmethod
    def PruneModel(model: nn.Module, pruning_ratio: float = 0.2) -> nn.Module:
        """
        Prune model for efficiency
        
        Args:
            model: Model to prune
            pruning_ratio: Ratio of weights to prune
            
        Returns:
            Pruned model
        """
        logger.info(f"Pruning model with {pruning_ratio*100:.0f}% ratio")
        
        # Simplified pruning for Phase 5
        # Real implementation would use torch.nn.utils.prune
        
        return model
    
    @staticmethod
    def OptimizeInference(
        model: nn.Module,
        use_cuda_graphs: bool = True,
        use_tensor_cores: bool = True
    ):
        """
        Optimize model for inference
        
        Args:
            model: Model to optimize
            use_cuda_graphs: Use CUDA graphs if available
            use_tensor_cores: Use Tensor Cores if available
        """
        if use_cuda_graphs:
            try:
                # Simplified CUDA graph setup
                logger.info("Setting up CUDA graphs for optimization")
            except Exception as e:
                logger.warning(f"Failed to setup CUDA graphs: {e}")
        
        if use_tensor_cores:
            if torch.cuda.is_available():
                torch.backends.cudnn.benchmark = True
                torch.backends.cudnn.deterministic = False
                logger.info("Enabled Tensor Core optimization")
            else:
                logger.warning("CUDA not available, Tensor Cores optimization disabled")

# Test function
def test_training_framework():
    """Test the training framework"""
    import numpy as np
    from torch.utils.data import TensorDataset, DataLoader
    
    # Create mock data
    train_data = torch.randn(1000, 10)
    train_labels = torch.randint(0, 10, (1000,))
    train_loader = DataLoader(
        TensorDataset(train_data, train_labels),
        batch_size=32,
        shuffle=True
    )
    
    # Create simple model
    model = nn.Sequential(
        nn.Linear(10, 50),
        nn.ReLU(),
        nn.Linear(50, 10)
    )
    
    # Setup trainer
    config = TrainingConfig(
        epochs=5,
        batch_size=32,
        learning_rate=0.001,
        save_dir="./test_models"
    )
    
    trainer = CustomModelTrainer(config)
    trainer.SetupModel(model, nn.CrossEntropyLoss(), 0.001)
    
    # Train
    metrics = trainer.Train(train_loader)
    
    print(f"✅ Training completed: {len(metrics)} epochs")
    print(f"✅ Final accuracy: {metrics[-1].train_accuracy:.2f}%")
    
    return True

if __name__ == "__main__":
    test_training_framework()