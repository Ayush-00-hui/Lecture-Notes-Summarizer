from typing import Optional
from backend.app.core.config import settings
from backend.app.providers.base import LLMProvider
from backend.app.providers.gemini_provider import GeminiProvider
from backend.app.providers.offline_provider import OfflineProvider

class ProviderFactory:
    @staticmethod
    def get_provider(api_key: Optional[str] = None, force_offline: bool = False) -> LLMProvider:
        """
        Returns GeminiProvider if API key is provided/configured and not forcing offline,
        otherwise falls back seamlessly to OfflineProvider.
        """
        effective_key = api_key or settings.GEMINI_API_KEY
        if not force_offline and effective_key and len(effective_key.strip()) > 5:
            try:
                gemini = GeminiProvider(api_key=effective_key)
                if gemini.is_available():
                    return gemini
            except Exception:
                pass
                
        return OfflineProvider()

    @staticmethod
    def is_gemini_active(api_key: Optional[str] = None) -> bool:
        effective_key = api_key or settings.GEMINI_API_KEY
        return bool(effective_key and len(effective_key.strip()) > 5)
