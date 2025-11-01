"""Admin rules management with drag-sort functionality."""

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user, get_db_session
from app.db.models import Rule, User
from app.schemas.content import RuleRead

router = APIRouter(prefix="/admin/rules")


class RuleOrderUpdate(BaseModel):
    rule_id: uuid.UUID
    display_order: int


class BulkRuleOrderUpdate(BaseModel):
    updates: List[RuleOrderUpdate]


@router.patch("/reorder")
async def reorder_rules(
    order_data: BulkRuleOrderUpdate,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> dict:
    """Reorder rules with drag-sort, keeping pinned rules at top."""
    
    # Get all rules to validate and separate pinned from regular
    stmt = select(Rule)
    result = await session.execute(stmt)
    all_rules = {rule.id: rule for rule in result.scalars().all()}
    
    # Separate pinned and regular rules
    pinned_rules = [rule for rule in all_rules.values() if rule.is_pinned]
    regular_rule_ids = {rule.id for rule in all_rules.values() if not rule.is_pinned}
    
    # Validate that we're only reordering regular rules
    for update in order_data.updates:
        if update.rule_id not in all_rules:
            raise HTTPException(status_code=404, detail=f"Rule {update.rule_id} not found")
        
        if update.rule_id not in regular_rule_ids:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot reorder pinned rule {update.rule_id}"
            )
    
    # Update display orders for regular rules
    # Pinned rules keep their current order (should be negative or 0)
    for update in order_data.updates:
        stmt = (
            update(Rule)
            .where(Rule.id == update.rule_id)
            .values(display_order=update.display_order)
        )
        await session.execute(stmt)
    
    await session.commit()
    
    return {
        "message": "Rules reordered successfully",
        "updated_count": len(order_data.updates),
        "pinned_rules_count": len(pinned_rules)
    }


@router.get("/", response_model=List[RuleRead])
async def list_rules_admin(
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> List[Rule]:
    """List all rules for admin management (including drafts)."""
    stmt = select(Rule).order_by(
        Rule.is_pinned.desc(),  # Pinned first
        Rule.display_order,     # Then by display order
        Rule.created_at         # Then by creation date
    )
    result = await session.execute(stmt)
    return result.scalars().all()