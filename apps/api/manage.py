#!/usr/bin/env python3
"""Management CLI for AMZCraft API."""

import asyncio
import getpass
import sys
from typing import Optional

import click
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.core.enums import AdminRole
from app.services.admin_auth import AdminAuthService


async def get_async_session() -> AsyncSession:
    """Get async database session."""
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return async_session()


@click.group()
def cli():
    """AMZCraft API management commands."""
    pass


@cli.command("create-admin")
@click.option("--email", prompt=True, help="Admin email address")
@click.option("--role", type=click.Choice(["ADMIN", "SUPER_ADMIN"]), default="ADMIN", help="Admin role")
def create_admin(email: str, role: str):
    """Create a new admin user."""
    
    async def _create_admin():
        password = getpass.getpass("Password: ")
        confirm_password = getpass.getpass("Confirm password: ")
        
        if password != confirm_password:
            click.echo("Passwords do not match!", err=True)
            sys.exit(1)
        
        if len(password) < 8:
            click.echo("Password must be at least 8 characters long!", err=True)
            sys.exit(1)
        
        session = await get_async_session()
        settings = get_settings()
        
        try:
            auth_service = AdminAuthService(session, settings)
            admin_user = await auth_service.create_admin_user(
                email=email,
                password=password,
                role=AdminRole(role),
            )
            await session.commit()
            
            click.echo(f"✅ Admin user created successfully!")
            click.echo(f"   Email: {admin_user.email}")
            click.echo(f"   Role: {admin_user.role}")
            click.echo(f"   ID: {admin_user.id}")
            
        except Exception as e:
            await session.rollback()
            click.echo(f"❌ Error creating admin user: {e}", err=True)
            sys.exit(1)
        finally:
            await session.close()
    
    asyncio.run(_create_admin())


if __name__ == "__main__":
    cli()