from typing import Any, Optional

import httpx
from fastapi import HTTPException, status

from ..core.config import settings


class InventoryClient:
    def __init__(self) -> None:
        self._base_url = settings.INVENTORY_SERVICE_URL.rstrip("/")

    async def get_book(self, book_id: str) -> dict[str, Any]:
        headers: dict[str, str] = {}
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(f"{self._base_url}/api/v1/books/{book_id}", headers=headers)
        if r.status_code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        if r.status_code >= 400:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Inventory service error")
        return r.json()

    async def decrement_stock(self, book_id: str, quantity: int, user_id: str, role: str) -> None:
        headers: dict[str, str] = {"Content-Type": "application/json", "X-User-Id": user_id, "X-User-Role": role}
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{self._base_url}/api/v1/books/{book_id}/decrement-stock",
                headers=headers,
                json={"quantity": quantity},
            )
        if r.status_code == 400:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")
        if r.status_code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        if r.status_code >= 400:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Inventory service error")
