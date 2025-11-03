"""Main API router composition."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import admin, admin_auth, admin_brand, admin_dashboard, admin_diagnostics, admin_leaderboards, admin_media, admin_payments, admin_rules, admin_users, auth, brand_public, events, payments, public, users, websocket

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(public.router, tags=["public"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(websocket.router, tags=["websocket"])
api_router.include_router(payments.router, prefix="/api/payments", tags=["payments"])
api_router.include_router(admin_leaderboards.router, tags=["admin-leaderboards"])
api_router.include_router(admin_rules.router, tags=["admin-rules"])
api_router.include_router(events.router, tags=["events"])
api_router.include_router(admin_diagnostics.router, tags=["admin-diagnostics"])
api_router.include_router(admin_payments.router, tags=["admin-payments"])
api_router.include_router(admin_media.router, tags=["admin-media"])
api_router.include_router(admin_auth.router, prefix="/admin/auth", tags=["admin-auth"])
api_router.include_router(admin_users.router, prefix="/admin/users", tags=["admin-users"])
api_router.include_router(brand_public.router, prefix="/api", tags=["brand-public"])
api_router.include_router(admin_brand.router, prefix="/admin", tags=["admin-brand"])
api_router.include_router(admin_dashboard.router, tags=["admin-dashboard"])
