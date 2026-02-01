import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = "advanced_hospital_db"

class Database:
    client: AsyncIOMotorClient = None
    db = None

    def connect(self):
        try:
            self.client = AsyncIOMotorClient(MONGO_URI)
            self.db = self.client[DB_NAME]
            print(f"Connected to MongoDB at {MONGO_URI} (DB: {DB_NAME})")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")

    async def connect_async(self):
        """Async connect + ping to verify server reachability.

        Use this when running inside async code (FastAPI, asyncio apps).
        """
        try:
            self.client = AsyncIOMotorClient(MONGO_URI)
            self.db = self.client[DB_NAME]
            # Ping the server to confirm connectivity
            await self.client.admin.command("ping")
            print(f"SUCCESS: Connected to MongoDB at {MONGO_URI} (DB: {DB_NAME})")
        except Exception as e:
            print(f"FAIL: Could not connect to MongoDB: {e}")
            raise

    async def is_connected_async(self) -> bool:
        """Return True if ping succeeds, False otherwise."""
        if not self.client:
            return False
        try:
            await self.client.admin.command("ping")
            return True
        except Exception:
            return False

    def close(self):
        if self.client:
            self.client.close()
            print("MongoDB connection closed.")

    # Collections
    def get_users_collection(self): return self.db["users"] # For Auth
    def get_patients_collection(self): return self.db["patients"]
    def get_doctors_collection(self): return self.db["doctors"]
    def get_inventory_collection(self): return self.db["inventory"]
    def get_beds_collection(self): return self.db["beds"]
    def get_appointments_collection(self): return self.db["appointments"]

db = Database()
