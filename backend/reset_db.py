from app.db.database import engine, Base
from app.db.models import ApplicationRecord # Make sure this matches your actual import path!

print("Dropping old tables...")
Base.metadata.drop_all(bind=engine)

print("Building new tables...")
Base.metadata.create_all(bind=engine)

print("Database reset successfully! You are ready to test.")