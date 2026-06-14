import time
import uuid
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs every request with method, path, status code, and duration."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()

        logger.info(
            "[%s] --> %s %s",
            request_id,
            request.method,
            request.url.path,
        )

        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        logger.info(
            "[%s] <-- %s %s  status=%s  %.1fms",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )

        response.headers["X-Request-ID"] = request_id
        return response
