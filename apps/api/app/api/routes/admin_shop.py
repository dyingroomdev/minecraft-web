"""Admin shop management routes."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db_session, require_admin
from app.db.models import AdminUser
from app.db.models.shop import Product, Order, OrderItem, OrderStatus

router = APIRouter(prefix="/admin/shop", tags=["admin-shop"])


# Products Management
@router.get("/products")
async def list_products_admin(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> list[dict]:
    """Get all products for admin."""
    stmt = select(Product).order_by(Product.display_order, Product.created_at)
    result = await session.execute(stmt)
    products = result.scalars().all()
    
    return [
        {
            "id": str(product.id),
            "name": product.name,
            "description": product.description,
            "price_bdt": product.price_bdt,
            "coins": product.coins,
            "bonus_coins": product.bonus_coins,
            "image_url": product.image_url,
            "is_active": product.is_active,
            "display_order": product.display_order,
            "created_at": product.created_at.isoformat(),
        }
        for product in products
    ]


@router.post("/products")
async def create_product(
    payload: dict,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> dict:
    """Create new product."""
    product = Product(
        name=payload["name"],
        description=payload.get("description"),
        price_bdt=payload["price_bdt"],
        coins=payload["coins"],
        bonus_coins=payload.get("bonus_coins", 0),
        image_url=payload.get("image_url"),
        is_active=payload.get("is_active", True),
        display_order=payload.get("display_order", 0),
    )
    session.add(product)
    await session.commit()
    await session.refresh(product)
    
    return {
        "id": str(product.id),
        "name": product.name,
        "message": "Product created successfully"
    }


@router.get("/products/{product_id}")
async def get_product_admin(
    product_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> dict:
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": str(product.id),
        "name": product.name,
        "description": product.description,
        "price_bdt": product.price_bdt,
        "coins": product.coins,
        "bonus_coins": product.bonus_coins,
        "image_url": product.image_url,
        "is_active": product.is_active,
        "display_order": product.display_order,
        "created_at": product.created_at.isoformat(),
    }


@router.put("/products/{product_id}")
async def update_product(
    product_id: uuid.UUID,
    payload: dict,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> dict:
    """Update product."""
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for field, value in payload.items():
        if hasattr(product, field):
            setattr(product, field, value)
    
    await session.commit()
    return {"message": "Product updated successfully"}


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> dict:
    """Delete product."""
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await session.delete(product)
    await session.commit()
    return {"message": "Product deleted successfully"}


# Orders Management
@router.get("/orders")
async def list_orders_admin(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> list[dict]:
    """Get all orders for admin."""
    stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).order_by(Order.created_at.desc())
    result = await session.execute(stmt)
    orders = result.scalars().all()
    
    return [
        {
            "id": str(order.id),
            "order_number": order.order_number,
            "user_id": str(order.user_id),
            "total_amount": order.total_amount,
            "payment_method": order.payment_method,
            "transaction_id": order.transaction_id,
            "minecraft_username": order.minecraft_username,
            "status": order.status,
            "items": [
                {
                    "product_name": item.product.name if item.product else "Deleted product",
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "coins": item.coins,
                }
                for item in order.items
            ],
            "created_at": order.created_at.isoformat(),
        }
        for order in orders
    ]


@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: uuid.UUID,
    payload: dict,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> dict:
    """Update order status."""
    order = await session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    new_status = payload["status"]
    if new_status not in [s.value for s in OrderStatus]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    order.status = new_status
    if new_status == OrderStatus.COMPLETED.value:
        order.completed_at = datetime.now(timezone.utc)
    
    await session.commit()
    return {"message": f"Order status updated to {new_status}"}


@router.get("/orders/{order_id}")
async def get_order_admin(
    order_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> dict:
    """Get order details for admin."""
    order = await session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get order items
    stmt = (
        select(OrderItem, Product)
        .join(Product)
        .where(OrderItem.order_id == order.id)
    )
    result = await session.execute(stmt)
    items_data = result.all()
    
    items = [
        {
            "product_name": product.name,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "coins": item.coins,
            "total": item.unit_price * item.quantity,
        }
        for item, product in items_data
    ]
    
    return {
        "id": str(order.id),
        "order_number": order.order_number,
        "user_id": str(order.user_id),
        "total_amount": order.total_amount,
        "payment_method": order.payment_method,
        "transaction_id": order.transaction_id,
        "minecraft_username": order.minecraft_username,
        "status": order.status,
        "notes": order.notes,
        "items": items,
        "created_at": order.created_at.isoformat(),
        "completed_at": order.completed_at.isoformat() if order.completed_at else None,
    }


@router.post("/orders/{order_id}/verify-payment")
async def verify_payment(
    order_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> dict:
    """Verify payment for an order."""
    order = await session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = OrderStatus.PAID.value
    await session.commit()
    
    return {"message": "Payment verified successfully"}


@router.post("/orders/{order_id}/invoice")
async def generate_invoice(
    order_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> dict:
    """Generate invoice for an order."""
    # Placeholder for invoice generation
    return {"message": "Invoice generation not implemented yet"}


@router.get("/analytics")
async def get_sales_analytics(
    period: int = 30,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> dict:
    """Get sales analytics data."""
    from datetime import timedelta
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=period)
    previous_start = start_date - timedelta(days=period)
    
    # Total revenue
    revenue_stmt = (
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(
            Order.created_at >= start_date,
            Order.status == OrderStatus.COMPLETED.value
        )
    )
    revenue_result = await session.execute(revenue_stmt)
    total_revenue = float(revenue_result.scalar())
    
    # Total orders
    orders_stmt = (
        select(func.count(Order.id))
        .where(Order.created_at >= start_date)
    )
    orders_result = await session.execute(orders_stmt)
    total_orders = orders_result.scalar()
    
    # Total products
    products_stmt = (
        select(func.count(Product.id))
        .where(Product.is_active == True)
    )
    products_result = await session.execute(products_stmt)
    total_products = products_result.scalar()
    
    # Total customers
    customers_stmt = (
        select(func.count(func.distinct(Order.user_id)))
        .where(Order.created_at >= start_date)
    )
    customers_result = await session.execute(customers_stmt)
    total_customers = customers_result.scalar()
    
    previous_revenue = float(
        await session.scalar(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.created_at >= previous_start,
                Order.created_at < start_date,
                Order.status == OrderStatus.COMPLETED.value,
            )
        )
        or 0
    )
    previous_orders = int(
        await session.scalar(
            select(func.count(Order.id)).where(
                Order.created_at >= previous_start,
                Order.created_at < start_date,
            )
        )
        or 0
    )

    # Recent orders
    recent_orders_stmt = (
        select(Order)
        .order_by(Order.created_at.desc())
        .limit(5)
    )
    recent_orders_result = await session.execute(recent_orders_stmt)
    recent_orders = recent_orders_result.scalars().all()

    top_products_result = await session.execute(
        select(
            Product.name,
            func.coalesce(func.sum(OrderItem.quantity), 0).label("sales"),
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0).label("revenue"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            Order.created_at >= start_date,
            Order.status == OrderStatus.COMPLETED.value,
        )
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    )

    completed_orders_result = await session.execute(
        select(Order).where(
            Order.created_at >= start_date,
            Order.status == OrderStatus.COMPLETED.value,
        ).order_by(Order.created_at)
    )
    monthly_totals: dict[str, float] = {}
    for order in completed_orders_result.scalars():
        month = order.created_at.strftime("%b %Y")
        monthly_totals[month] = monthly_totals.get(month, 0) + float(order.total_amount)

    def percent_change(current: float, previous: float) -> float:
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return ((current - previous) / previous) * 100
    
    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_products": total_products,
        "total_customers": total_customers,
        "revenue_change": percent_change(total_revenue, previous_revenue),
        "orders_change": percent_change(float(total_orders), float(previous_orders)),
        "top_products": [
            {"name": name, "sales": int(sales), "revenue": float(revenue)}
            for name, sales, revenue in top_products_result.all()
        ],
        "recent_orders": [
            {
                "id": str(order.id),
                "total_amount": float(order.total_amount),
                "status": order.status,
                "created_at": order.created_at.isoformat()
            }
            for order in recent_orders
        ],
        "monthly_revenue": [
            {"month": month, "revenue": revenue}
            for month, revenue in monthly_totals.items()
        ],
    }
