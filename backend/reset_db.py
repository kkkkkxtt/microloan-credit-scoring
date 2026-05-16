"""Utility script to force-reset the development database.

WARNING: This script irreversibly drops the public schema and recreates
it. Use only in development or with extreme caution.
"""
from app.db.database import engine, Base
from app.db import models
from sqlalchemy import text

print("Force dropping all old tables...")

# Connect to Postgres and force drop everything using CASCADE
with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE;"))
    conn.execute(text("CREATE SCHEMA public;"))
    
    # In newer SQLAlchemy versions, you need to explicitly commit raw SQL
    conn.commit()

print("Creating new tables with updated schema...")
Base.metadata.create_all(bind=engine)

print("Database reset successfully!")