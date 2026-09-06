import logging
from typing import Optional, List, Dict, Any
from app.config import settings
from app.gemini.prompts import SYSTEM_INSTRUCTION

logger = logging.getLogger("livingcity.gemini")

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY.strip()
        self.model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
        self._client = None
        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info("Google GenAI client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI client: {e}")

    def is_configured(self) -> bool:
        return bool(self.api_key and self._client is not None)

    async def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.is_configured():
            logger.info("Gemini API key not configured; returning structured fallback explanation.")
            return (
                "[AI Decision Support Notice]: Google Gemini explanation service is temporarily unconfigured or unavailable. "
                "All numerical observations, derived flood risk indicators, and scikit-learn machine learning predictions "
                "above are calculated deterministically by the Living City engine and remain fully active."
            )

        try:
            sys_inst = system_prompt or SYSTEM_INSTRUCTION
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={
                    "system_instruction": sys_inst,
                    "temperature": 0.2, # low temperature for factual municipal reasoning
                }
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini API invocation error: {e}")
            return (
                f"[AI Assistant Notice]: Real-time AI explanation temporarily unavailable ({type(e).__name__}). "
                "Backend telemetry and ML predictions continue running without interruption."
            )

gemini_service = GeminiService()
