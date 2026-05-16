"""Database setup for the application.

This module defines the SQLAlchemy ``engine``, a ``SessionLocal``
factory for creating request-scoped sessions, and the declarative
``Base`` class used by model definitions.

For production use you should replace the hard-coded
``SQLALCHEMY_DATABASE_URL`` with a value from environment variables or
a configuration file to avoid committing secrets to source control.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Define your connection string
# Format: postgresql://[user]:[password]@[host]:[port]/[database_name]
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:123456@localhost:5432/microloan_db"

# 2. Create the Engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. Create the Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Create the Base class for your models to inherit from
Base = declarative_base()