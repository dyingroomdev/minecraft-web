"""Payment and entitlement schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import StackMode


class RankProductRead(BaseModel):
    id: uuid.UUID
    rank_code: str
    display_name: str
    price_bdt: Decimal
    duration_days: int | None
    lp_group: str | None
    stack_mode: StackMode
    description: str | None
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class RankProductUpdate(BaseModel):
    lp_group: str | None = Field(default=None, max_length=64)
    stack_mode: StackMode = StackMode.SET


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
    platform: str | None
    bkash_txid: str
    amount_bdt: Decimal
    screenshot_url: str | None
    status: str
    rejection_reason: str | None
    created_at: datetime
    processed_at: datetime | None
    fulfilled_at: datetime | None
    fulfillment_status: str | None
    fulfillment_log: str | None

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
