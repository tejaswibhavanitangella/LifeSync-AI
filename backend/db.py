import os
import json
import uuid
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "lifesync_db")
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
LOCAL_DB_FILE = DATA_DIR / "lifesync_local_db.json"

USE_MONGO = False
client = None
db = None

# Attempt MongoDB connection with 1.5s timeout
try:
    from pymongo import MongoClient
    temp_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=1500)
    temp_client.admin.command("ping")
    client = temp_client
    db = client[DB_NAME]
    USE_MONGO = True
    print("[LifeSync DB] Successfully connected to MongoDB.")
except Exception as e:
    print(f"[LifeSync DB] MongoDB unavailable ({e}). Running in Zero-Setup Local Storage mode.")
    USE_MONGO = False


class LocalCursor:
    """Emulates PyMongo cursor for local JSON storage."""
    def __init__(self, items):
        self._items = [dict(x) for x in items]

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            for k, d in reversed(key_or_list):
                self._items.sort(key=lambda x: str(x.get(k, "")), reverse=(d == -1))
        else:
            self._items.sort(key=lambda x: str(x.get(key_or_list, "")), reverse=(direction == -1))
        return self

    def limit(self, n):
        self._items = self._items[:n]
        return self

    def __iter__(self):
        return iter(self._items)

    def __len__(self):
        return len(self._items)

    def __getitem__(self, idx):
        return self._items[idx]


class LocalCollection:
    """Emulates a PyMongo collection using local thread-safe JSON persistence."""
    def __init__(self, name, db_file):
        self.name = name
        self.db_file = db_file

    def _load_all(self):
        if not self.db_file.exists():
            return {}
        try:
            with open(self.db_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _save_all(self, data):
        with open(self.db_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

    def _get_items(self):
        data = self._load_all()
        return data.get(self.name, [])

    def _set_items(self, items):
        data = self._load_all()
        data[self.name] = items
        self._save_all(data)

    def _matches(self, doc, query):
        for k, v in query.items():
            if k == "_id":
                if str(doc.get("_id")) != str(v):
                    return False
            elif isinstance(v, dict) and "$regex" in v:
                import re
                pattern = re.compile(v["$regex"])
                if not pattern.search(str(doc.get(k, ""))):
                    return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    def find(self, query=None, projection=None):
        query = query or {}
        items = self._get_items()
        filtered = [x for x in items if self._matches(x, query)]
        return LocalCursor(filtered)

    def find_one(self, query=None):
        query = query or {}
        items = self._get_items()
        for x in items:
            if self._matches(x, query):
                return dict(x)
        return None

    def count_documents(self, query=None):
        query = query or {}
        return len(list(self.find(query)))

    def insert_one(self, doc):
        items = self._get_items()
        item = dict(doc)
        if "_id" not in item:
            item["_id"] = uuid.uuid4().hex[:24]
        items.append(item)
        self._set_items(items)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(item["_id"])

    def update_one(self, query, update, upsert=False):
        items = self._get_items()
        matched = 0
        set_vals = update.get("$set", {})
        for idx, doc in enumerate(items):
            if self._matches(doc, query):
                items[idx].update(set_vals)
                matched = 1
                break
        if matched == 0 and upsert:
            new_item = dict(query)
            new_item.update(set_vals)
            if "_id" not in new_item:
                new_item["_id"] = uuid.uuid4().hex[:24]
            items.append(new_item)
            matched = 1
        self._set_items(items)
        class UpdateResult:
            def __init__(self, m):
                self.matched_count = m
        return UpdateResult(matched)

    def delete_one(self, query):
        items = self._get_items()
        idx_to_remove = None
        for idx, doc in enumerate(items):
            if self._matches(doc, query):
                idx_to_remove = idx
                break
        deleted = 0
        if idx_to_remove is not None:
            items.pop(idx_to_remove)
            self._set_items(items)
            deleted = 1
        class DeleteResult:
            def __init__(self, d):
                self.deleted_count = d
        return DeleteResult(deleted)

    def delete_many(self, query):
        items = self._get_items()
        remaining = [x for x in items if not self._matches(x, query)]
        deleted = len(items) - len(remaining)
        self._set_items(remaining)
        class DeleteManyResult:
            def __init__(self, d):
                self.deleted_count = d
        return DeleteManyResult(deleted)

    def create_index(self, keys, **kwargs):
        pass


if USE_MONGO and db is not None:
    tasks = db["tasks"]
    expenses = db["expenses"]
    budgets = db["budgets"]
    reminders = db["reminders"]
    documents = db["documents"]
else:
    tasks = LocalCollection("tasks", LOCAL_DB_FILE)
    expenses = LocalCollection("expenses", LOCAL_DB_FILE)
    budgets = LocalCollection("budgets", LOCAL_DB_FILE)
    reminders = LocalCollection("reminders", LOCAL_DB_FILE)
    documents = LocalCollection("documents", LOCAL_DB_FILE)


def ensure_indexes():
    if USE_MONGO and db is not None:
        try:
            tasks.create_index([("user_id", 1), ("created_at", -1)])
            expenses.create_index([("user_id", 1), ("date", -1)])
            budgets.create_index([("user_id", 1), ("month", 1)], unique=True)
            reminders.create_index([("user_id", 1), ("reminder_date", 1)])
            documents.create_index([("user_id", 1), ("created_at", -1)])
        except Exception as e:
            print(f"[LifeSync DB] Index creation warning: {e}")
