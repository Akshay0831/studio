import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

logger = logging.getLogger("studio.backend.utils.inference_strategies")

class InferenceStrategy(ABC):
    @abstractmethod
    async def execute(self, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass

class LocalGPUStrategy(InferenceStrategy):
    def __init__(self, device_type: str):
        self.device_type = device_type

    def is_available(self) -> bool:
        return self.device_type is not None

    async def execute(self, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        return {"backend": "local_gpu", "device": self.device_type, "status": "ready"}

class RemoteAPIStrategy(InferenceStrategy):
    def __init__(self, provider: str, api_key: Optional[str]):
        self.provider = provider
        self.api_key = api_key

    def is_available(self) -> bool:
        return self.api_key is not None

    async def execute(self, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        return {"backend": "remote_api", "provider": self.provider, "status": "ready"}

class CPUStrategy(InferenceStrategy):
    def is_available(self) -> bool:
        return True

    async def execute(self, operation: str, params: Dict[str, Any]) -> Dict[str, Any]:
        return {"backend": "cpu", "device": "cpu", "status": "ready"}
