"""Shop API routes for products, cart, and orders."""

from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db_session
from app.db.models.user import User
from app.db.models.shop import Product, CartItem, Order, OrderItem, OrderStatus, PaymentMethod

router = APIRouter(prefix="/api/shop", tags=["shop"])


# Products
@router.get("/products")
async def list_products(session: AsyncSession = Depends(get_db_session)) -> list[dict]:
    """Get all active products."""
    stmt = select(Product).where(Product.is_active.is_(True)).order_by(Product.display_order, Product.created_at)
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
            "total_coins": product.coins + product.bonus_coins,
            "image_url": product.image_url,
        }
        for product in products
    ]


# Cart
@router.get("/cart")
async def get_cart(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """Get user's cart."""
    stmt = (
        select(CartItem, Product)
        .join(Product)
        .where(CartItem.user_id == user.id)
        .order_by(CartItem.created_at)
    )
    result = await session.execute(stmt)
    cart_data = result.all()
    
    items = []
    total = 0
    
    for cart_item, product in cart_data:
        item_total = product.price_bdt * cart_item.quantity
        total += item_total
        
        items.append({
            "id": str(cart_item.id),
            "product": {
                "id": str(product.id),
                "name": product.name,
                "price_bdt": product.price_bdt,
                "coins": product.coins,
                "bonus_coins": product.bonus_coins,
                "image_url": product.image_url,
            },
            "quantity": cart_item.quantity,
            "total": item_total,
        })
    
    return {
        "items": items,
        "total": total,
        "count": len(items),
    }


@router.post("/cart/add")
async def add_to_cart(
    payload: dict,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """Add product to cart."""
    product_id = uuid.UUID(payload["product_id"])
    quantity = payload.get("quantity", 1)
    
    # Check if product exists
    product = await session.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if item already in cart
    stmt = select(CartItem).where(
        CartItem.user_id == user.id,
        CartItem.product_id == product_id
    )
    result = await session.execute(stmt)
    existing_item = result.scalar_one_or_none()
    
    if existing_item:
        existing_item.quantity += quantity
    else:
        cart_item = CartItem(
            user_id=user.id,
            product_id=product_id,
            quantity=quantity
        )
        session.add(cart_item)
    
    await session.commit()
    return {"message": "Added to cart"}


@router.put("/cart/{item_id}")
async def update_cart_item(
    item_id: uuid.UUID,
    payload: dict,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """Update cart item quantity."""
    quantity = payload["quantity"]
    
    stmt = select(CartItem).where(
        CartItem.id == item_id,
        CartItem.user_id == user.id
    )
    result = await session.execute(stmt)
    cart_item = result.scalar_one_or_none()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    if quantity <= 0:
        await session.delete(cart_item)
    else:
        cart_item.quantity = quantity
    
    await session.commit()
    return {"message": "Cart updated"}


@router.delete("/cart/{item_id}")
async def remove_from_cart(
    item_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """Remove item from cart."""
    stmt = select(CartItem).where(
        CartItem.id == item_id,
        CartItem.user_id == user.id
    )
    result = await session.execute(stmt)
    cart_item = result.scalar_one_or_none()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    await session.delete(cart_item)
    await session.commit()
    return {"message": "Item removed"}


# Orders
@router.post("/checkout")
async def checkout(
    payload: dict,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """Create order from cart."""
    minecraft_username = payload["minecraft_username"]
    payment_method = payload["payment_method"]
    transaction_id = payload["transaction_id"]
    
    # Validate payment method
    if payment_method not in [PaymentMethod.BKASH.value, PaymentMethod.NAGAD.value]:
        raise HTTPException(status_code=400, detail="Invalid payment method")
    
    # Get cart items
    stmt = (
        select(CartItem, Product)
        .join(Product)
        .where(CartItem.user_id == user.id)
    )
    result = await session.execute(stmt)
    cart_data = result.all()
    
    if not cart_data:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total
    total_amount = sum(product.price_bdt * cart_item.quantity for cart_item, product in cart_data)
    
    # Generate order number
    order_number = f"AMZ{secrets.token_hex(4).upper()}"
    
    # Create order
    order = Order(
        user_id=user.id,
        order_number=order_number,
        total_amount=total_amount,
        payment_method=payment_method,
        transaction_id=transaction_id,
        minecraft_username=minecraft_username,
        status=OrderStatus.PENDING.value,
    )
    session.add(order)
    await session.flush()  # Get order ID
    
    # Create order items
    for cart_item, product in cart_data:
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=cart_item.quantity,
            unit_price=product.price_bdt,
            coins=product.coins + product.bonus_coins,
        )
        session.add(order_item)
    
    # Clear cart
    for cart_item, _ in cart_data:
        await session.delete(cart_item)
    
    await session.commit()
    
    return {
        "order_id": str(order.id),
        "order_number": order_number,
        "total_amount": total_amount,
        "message": "Order created successfully"
    }


@router.get("/orders")
async def get_orders(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> list[dict]:
    """Get user's orders."""
    stmt = (
        select(Order)
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
    )
    result = await session.execute(stmt)
    orders = result.scalars().all()
    
    return [
        {
            "id": str(order.id),
            "order_number": order.order_number,
            "total_amount": order.total_amount,
            "payment_method": order.payment_method,
            "minecraft_username": order.minecraft_username,
            "status": order.status,
            "created_at": order.created_at.isoformat(),
        }
        for order in orders
    ]


@router.get("/orders/{order_id}")
async def get_order_detail(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> dict:
    """Get order details."""
    stmt = select(Order).where(
        Order.id == order_id,
        Order.user_id == user.id
    )
    result = await session.execute(stmt)
    order = result.scalar_one_or_none()
    
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
        "total_amount": order.total_amount,
        "payment_method": order.payment_method,
        "transaction_id": order.transaction_id,
        "minecraft_username": order.minecraft_username,
        "status": order.status,
        "items": items,
        "created_at": order.created_at.isoformat(),
    }