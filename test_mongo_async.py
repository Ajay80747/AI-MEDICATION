import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("MONGO_DB", "advanced_hospital_db")

async def test_connect():
    client = None
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        await client.admin.command("ping")
        print(f"SUCCESS: Connected to MongoDB at {MONGO_URI} (DB: {DB_NAME})")
    except Exception as e:
        print("FAIL: Could not connect to MongoDB.")
        print("Error:", e)
    finally:
        try:
            if client:
                client.close()
        except Exception:
            pass

if __name__ == "__main__":
    asyncio.run(test_connect())
