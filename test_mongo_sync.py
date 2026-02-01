import os
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

def test_connect():
    client = None
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        print(f"SUCCESS: Connected to MongoDB at {MONGO_URI}")
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
    test_connect()
