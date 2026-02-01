import asyncio
import requests
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "advanced_hospital_db"
API_URL = "http://localhost:8001/api/health"

async def check_mongo_direct():
    print(f"Testing direct MongoDB connection to {MONGO_URI}...")
    try:
        client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        # Force a connection
        await client.admin.command('ping')
        print("✅ Direct MongoDB connection successful!")
        
        # Check database existence
        dbs = await client.list_database_names()
        if DB_NAME in dbs:
            print(f"✅ Database '{DB_NAME}' exists.")
            db = client[DB_NAME]
            cols = await db.list_collection_names()
            print(f"   Collections found: {cols}")
            
            # Check beds
            if "beds" in cols:
                count = await db["beds"].count_documents({})
                print(f"   Beds count: {count}")
        else:
            print(f"⚠️ Database '{DB_NAME}' does not exist yet (will be created on first write).")
            
    except Exception as e:
        print(f"❌ Direct MongoDB connection failed: {e}")

def check_api_health():
    print(f"\nTesting API Health Endpoint at {API_URL}...")
    try:
        response = requests.get(API_URL)
        if response.status_code == 200:
            print(f"✅ API Health Check passed: {response.json()}")
        else:
            print(f"❌ API Health Check failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Could not reach API: {e}")

async def main():
    await check_mongo_direct()
    check_api_health()

if __name__ == "__main__":
    asyncio.run(main())
