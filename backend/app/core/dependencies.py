from fastapi import Query


class PaginationParams:
    """Reusable pagination dependency injected into any list endpoint."""

    def __init__(
        self,
        skip: int = Query(default=0, ge=0, description="Records to skip"),
        limit: int = Query(default=100, ge=1, le=1000, description="Max records to return"),
    ) -> None:
        self.skip = skip
        self.limit = limit
