"""Payment and entitlement schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class RankProductRead(BaseModel):
    id: uuid.UUID
    rank_code: str
    display_name: str
    price_bdt: Decimal
    duration_days: int | None
    description: str | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class PaymentSubmitRequest(BaseModel):
    rank_code: str
    mc_username: str = Field(min_length=3, max_length=16)
    bkash_txid: str = Field(min_length=8, max_length=64)
    amount_bdt: Decimal = Field(gt=0)
    screenshot_url: str | None = Field(None, max_length=512)


class PaymentRequestRead(BaseModel):
    id: uuid.UUID
    rank_product: RankProductRead
    mc_username: str
    mc_uuid: uuid.UUID | None
    bkash_txid: str
    amount_bdt: Decimal
    screenshot_url: str | None
    status: str
    rejection_reason: str | None
    created_at: datetime
    processed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class PaymentApprovalRequest(BaseModel):
    pass  # Empty body, uses Idempotency-Key header


class PaymentRejectionRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


class EntitlementRead(BaseModel):
    id: uuid.UUID
    mc_uuid: uuid.UUID
    mc_username: str
    rank_code: str
    luckperms_group: str
    granted_at: datetime
    expires_at: datetime | None
    is_active: bool
    revoked_at: datetime | None

    model_config = ConfigDict(from_attributes=True)