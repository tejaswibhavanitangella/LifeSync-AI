import os
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

from bson import ObjectId
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

from db import (
    USE_MONGO, client, db, tasks, expenses, budgets,
    reminders, documents, ensure_indexes
)
from ai_service import understand_command

load_dotenv()
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_CONTENT_LENGTH", "5242880"))
CORS(app, resources={r"/api/*": {"origins": "*"}})

USER_ID = os.getenv("DEMO_USER_ID", "demo-user")
UPLOAD_DIR = Path(__file__).parent / os.getenv("UPLOAD_DIR", "uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}

def json_doc(doc):
    d = dict(doc)
    d["_id"] = str(d["_id"])
    for key, value in list(d.items()):
        if isinstance(value, datetime):
            d[key] = value.isoformat()
    return d

def valid_date(value):
    if value in (None, ""):
        return None
    return date.fromisoformat(value).isoformat()

def parse_id(item_id):
    if USE_MONGO:
        try:
            return ObjectId(item_id)
        except Exception:
            return item_id
    return item_id

@app.errorhandler(413)
def too_large(_):
    return jsonify({"error": "File is too large. Maximum size is 5 MB."}), 413

@app.get("/api/health")
def health():
    if USE_MONGO and client:
        try:
            client.admin.command("ping")
            return jsonify({
                "status": "ok",
                "database": "connected",
                "mode": "mongodb",
                "message": "Connected to MongoDB instance"
            })
        except Exception:
            pass
    return jsonify({
        "status": "ok",
        "database": "active",
        "mode": "local_storage",
        "message": "Running with Zero-Setup Local Storage mode"
    })

@app.get("/api/dashboard")
def dashboard():
    month = date.today().strftime("%Y-%m")
    task_count = tasks.count_documents({"user_id": USER_ID})
    pending = tasks.count_documents({"user_id": USER_ID, "status": "Pending"})
    completed = tasks.count_documents({"user_id": USER_ID, "status": "Completed"})
    
    month_expenses = list(expenses.find({"user_id": USER_ID, "date": {"$regex": f"^{month}"}}))
    total_spent = round(sum(float(x.get("amount", 0)) for x in month_expenses), 2)
    
    budget = budgets.find_one({"user_id": USER_ID, "month": month})
    limit = float(budget["monthly_limit"]) if budget else 8000.0
    
    # Calculate productivity score
    total_items = task_count
    productivity_score = round((completed / total_items) * 100) if total_items > 0 else 100
    
    # Category summary
    categories = {}
    for x in month_expenses:
        cat = x.get("category", "Other")
        categories[cat] = round(categories.get(cat, 0) + float(x.get("amount", 0)), 2)

    return jsonify({
        "total_tasks": task_count,
        "pending_tasks": pending,
        "completed_tasks": completed,
        "total_expenses": total_spent,
        "budget": limit,
        "remaining_budget": round(limit - total_spent, 2),
        "productivity_score": productivity_score,
        "streak_days": 5,
        "month": month,
        "storage_mode": "MongoDB" if USE_MONGO else "Local Storage",
        "by_category": categories
    })

@app.post("/api/seed")
def seed_demo_data():
    """Populates realistic, structured demo data for life and finance management."""
    today = date.today()
    month = today.strftime("%Y-%m")
    
    # Clear current user data
    tasks.delete_many({"user_id": USER_ID})
    expenses.delete_many({"user_id": USER_ID})
    reminders.delete_many({"user_id": USER_ID})
    budgets.delete_many({"user_id": USER_ID})

    # Seed monthly budget
    budgets.insert_one({"user_id": USER_ID, "month": month, "monthly_limit": 12000.0})

    # Seed Tasks
    demo_tasks = [
        {"title": "Deliver Q3 Product Strategy Deck", "priority": "High", "deadline": today.isoformat(), "status": "Pending"},
        {"title": "Deploy LifeSync AI service to cloud", "priority": "High", "deadline": (today + timedelta(days=1)).isoformat(), "status": "Pending"},
        {"title": "Prepare weekly sprint walkthrough", "priority": "Medium", "deadline": (today + timedelta(days=1)).isoformat(), "status": "Pending"},
        {"title": "Review monthly budget & team expenses", "priority": "Medium", "deadline": (today + timedelta(days=3)).isoformat(), "status": "Completed"},
        {"title": "Submit quarterly performance review", "priority": "High", "deadline": (today + timedelta(days=2)).isoformat(), "status": "Pending"},
        {"title": "Refactor AI intent classification pipeline", "priority": "Low", "deadline": (today + timedelta(days=4)).isoformat(), "status": "Completed"}
    ]
    for t in demo_tasks:
        tasks.insert_one({
            "user_id": USER_ID,
            "title": t["title"],
            "priority": t["priority"],
            "deadline": t["deadline"],
            "status": t["status"],
            "created_at": datetime.utcnow()
        })

    # Seed Expenses
    demo_expenses = [
        {"amount": 450.00, "category": "Food", "description": "Team lunch at downtown bistro", "date": today.isoformat()},
        {"amount": 1200.00, "category": "Bills", "description": "Cloud GPU & API credits", "date": (today - timedelta(days=2)).isoformat()},
        {"amount": 320.00, "category": "Travel", "description": "Cab ride to client office", "date": (today - timedelta(days=1)).isoformat()},
        {"amount": 799.00, "category": "Education", "description": "System Design & AI masterclass", "date": (today - timedelta(days=5)).isoformat()},
        {"amount": 180.00, "category": "Food", "description": "Evening coffee & snacks", "date": today.isoformat()},
        {"amount": 650.00, "category": "Shopping", "description": "USB-C Display adapter", "date": (today - timedelta(days=4)).isoformat()}
    ]
    for e in demo_expenses:
        expenses.insert_one({
            "user_id": USER_ID,
            "amount": e["amount"],
            "category": e["category"],
            "description": e["description"],
            "date": e["date"],
            "created_at": datetime.utcnow()
        })

    # Seed Reminders
    demo_reminders = [
        {"title": "Product Strategy presentation begins", "reminder_date": today.isoformat(), "status": "Pending"},
        {"title": "Review sprint release candidate", "reminder_date": (today + timedelta(days=1)).isoformat(), "status": "Pending"},
        {"title": "Follow up with team lead regarding feedback", "reminder_date": (today + timedelta(days=2)).isoformat(), "status": "Pending"}
    ]
    for r in demo_reminders:
        reminders.insert_one({
            "user_id": USER_ID,
            "title": r["title"],
            "reminder_date": r["reminder_date"],
            "status": r["status"],
            "created_at": datetime.utcnow()
        })

    return jsonify({"message": "Sample showcase data seeded successfully!"})

@app.post("/api/reset")
def reset_demo_data():
    """Wipes user records for a clean workspace."""
    tasks.delete_many({"user_id": USER_ID})
    expenses.delete_many({"user_id": USER_ID})
    reminders.delete_many({"user_id": USER_ID})
    budgets.delete_many({"user_id": USER_ID})
    return jsonify({"message": "Workspace reset to empty state."})

# --- TASKS ---
@app.get("/api/tasks")
def get_tasks():
    status = request.args.get("status")
    priority = request.args.get("priority")
    query = {"user_id": USER_ID}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    docs = tasks.find(query).sort("created_at", -1)
    return jsonify([json_doc(x) for x in docs])

@app.post("/api/tasks")
def add_task():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    if not title:
        return jsonify({"error": "Task title is required"}), 400
    priority = data.get("priority", "Medium")
    if priority not in {"High", "Medium", "Low"}:
        priority = "Medium"
    try:
        deadline = valid_date(data.get("deadline"))
    except ValueError:
        return jsonify({"error": "Deadline must be YYYY-MM-DD"}), 400
    result = tasks.insert_one({
        "user_id": USER_ID,
        "title": title,
        "priority": priority,
        "deadline": deadline,
        "status": "Pending",
        "created_at": datetime.utcnow()
    })
    return jsonify({"message": "Task created", "id": str(result.inserted_id)}), 201

@app.patch("/api/tasks/<task_id>")
def update_task(task_id):
    data = request.get_json(silent=True) or {}
    allowed = {"title", "priority", "deadline", "status"}
    updates = {k: v for k, v in data.items() if k in allowed}
    if not updates:
        return jsonify({"error": "No valid updates supplied"}), 400
    if "status" in updates and updates["status"] not in {"Pending", "Completed"}:
        return jsonify({"error": "Invalid status"}), 400
    if "priority" in updates and updates["priority"] not in {"High", "Medium", "Low"}:
        return jsonify({"error": "Invalid priority"}), 400
    if "deadline" in updates:
        try:
            updates["deadline"] = valid_date(updates["deadline"])
        except ValueError:
            return jsonify({"error": "Deadline must be YYYY-MM-DD"}), 400
    try:
        result = tasks.update_one({"_id": parse_id(task_id), "user_id": USER_ID}, {"$set": updates})
    except Exception:
        return jsonify({"error": "Invalid task ID"}), 400
    if not result.matched_count:
        return jsonify({"error": "Task not found"}), 404
    return jsonify({"message": "Task updated"})

@app.delete("/api/tasks/<task_id>")
def delete_task(task_id):
    try:
        result = tasks.delete_one({"_id": parse_id(task_id), "user_id": USER_ID})
    except Exception:
        return jsonify({"error": "Invalid task ID"}), 400
    if not result.deleted_count:
        return jsonify({"error": "Task not found"}), 404
    return jsonify({"message": "Task deleted"})

# --- EXPENSES ---
@app.get("/api/expenses")
def get_expenses():
    category = request.args.get("category")
    query = {"user_id": USER_ID}
    if category and category != "All":
        query["category"] = category
    docs = expenses.find(query).sort("date", -1)
    return jsonify([json_doc(x) for x in docs])

@app.post("/api/expenses")
def add_expense():
    data = request.get_json(silent=True) or {}
    try:
        amount = float(data.get("amount", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Amount must be a number"}), 400
    if not 0 < amount <= 10000000:
        return jsonify({"error": "Amount must be greater than zero"}), 400
    try:
        expense_date = valid_date(data.get("date") or date.today().isoformat())
    except ValueError:
        return jsonify({"error": "Date must be YYYY-MM-DD"}), 400
    doc = {
        "user_id": USER_ID,
        "amount": round(amount, 2),
        "category": str(data.get("category", "Other"))[:40],
        "description": str(data.get("description", ""))[:200] or str(data.get("category", "Expense")),
        "date": expense_date,
        "created_at": datetime.utcnow()
    }
    result = expenses.insert_one(doc)
    return jsonify({"message": "Expense added", "id": str(result.inserted_id)}), 201

@app.delete("/api/expenses/<expense_id>")
def delete_expense(expense_id):
    try:
        result = expenses.delete_one({"_id": parse_id(expense_id), "user_id": USER_ID})
    except Exception:
        return jsonify({"error": "Invalid expense ID"}), 400
    if not result.deleted_count:
        return jsonify({"error": "Expense not found"}), 404
    return jsonify({"message": "Expense deleted"})

# --- BUDGET ---
@app.get("/api/budget")
def get_budget():
    month = request.args.get("month", date.today().strftime("%Y-%m"))
    doc = budgets.find_one({"user_id": USER_ID, "month": month})
    return jsonify({"month": month, "monthly_limit": float(doc["monthly_limit"]) if doc else 8000.0})

@app.post("/api/budget")
def set_budget():
    data = request.get_json(silent=True) or {}
    try:
        amount = float(data.get("monthly_limit", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Budget must be a number"}), 400
    if not 0 < amount <= 100000000:
        return jsonify({"error": "Budget must be greater than zero"}), 400
    month = data.get("month", date.today().strftime("%Y-%m"))
    if not isinstance(month, str) or len(month) != 7 or month[4] != "-":
        return jsonify({"error": "Month must be YYYY-MM"}), 400
    budgets.update_one(
        {"user_id": USER_ID, "month": month},
        {"$set": {"monthly_limit": amount}}, upsert=True
    )
    return jsonify({"message": "Budget saved"})

# --- REMINDERS ---
@app.get("/api/reminders")
def get_reminders():
    docs = reminders.find({"user_id": USER_ID}).sort("reminder_date", 1)
    return jsonify([json_doc(x) for x in docs])

@app.post("/api/reminders")
def add_reminder():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    if not title:
        return jsonify({"error": "Reminder title is required"}), 400
    try:
        reminder_date = valid_date(data.get("reminder_date") or data.get("deadline") or date.today().isoformat())
    except ValueError:
        return jsonify({"error": "Reminder date must be YYYY-MM-DD"}), 400
    result = reminders.insert_one({
        "user_id": USER_ID,
        "title": title[:200],
        "reminder_date": reminder_date,
        "status": "Pending",
        "created_at": datetime.utcnow()
    })
    return jsonify({"message": "Reminder created", "id": str(result.inserted_id)}), 201

@app.patch("/api/reminders/<reminder_id>")
def update_reminder(reminder_id):
    data = request.get_json(silent=True) or {}
    updates = {}
    if "status" in data:
        updates["status"] = data["status"]
    if "title" in data:
        updates["title"] = str(data["title"])[:200]
    if "reminder_date" in data:
        try:
            updates["reminder_date"] = valid_date(data["reminder_date"])
        except ValueError:
            return jsonify({"error": "Date must be YYYY-MM-DD"}), 400
    try:
        result = reminders.update_one({"_id": parse_id(reminder_id), "user_id": USER_ID}, {"$set": updates})
    except Exception:
        return jsonify({"error": "Invalid reminder ID"}), 400
    if not result.matched_count:
        return jsonify({"error": "Reminder not found"}), 404
    return jsonify({"message": "Reminder updated"})

@app.delete("/api/reminders/<reminder_id>")
def delete_reminder(reminder_id):
    try:
        result = reminders.delete_one({"_id": parse_id(reminder_id), "user_id": USER_ID})
    except Exception:
        return jsonify({"error": "Invalid reminder ID"}), 400
    if not result.deleted_count:
        return jsonify({"error": "Reminder not found"}), 404
    return jsonify({"message": "Reminder deleted"})

# --- INSIGHTS ---
@app.get("/api/insights")
def insights():
    month = date.today().strftime("%Y-%m")
    expense_rows = list(expenses.find({"user_id": USER_ID, "date": {"$regex": f"^{month}"}}))
    total = round(sum(float(x.get("amount", 0)) for x in expense_rows), 2)
    by_category = {}
    for row in expense_rows:
        category = row.get("category", "Other")
        by_category[category] = round(by_category.get(category, 0) + float(row.get("amount", 0)), 2)
    pending = list(tasks.find({"user_id": USER_ID, "status": "Pending"}).sort("deadline", 1))
    budget = budgets.find_one({"user_id": USER_ID, "month": month})
    limit = float(budget["monthly_limit"]) if budget else 8000.0
    
    # Financial advice recommendation
    usage_pct = (total / max(1, limit)) * 100
    if usage_pct < 50:
        advice = "Excellent financial control! You've utilized less than half of your monthly budget."
    elif usage_pct < 85:
        advice = "Steady spending pace. Review upcoming bills to stay on track."
    else:
        advice = "Caution: You are approaching your monthly spending cap. Curtail non-essential shopping."

    return jsonify({
        "month": month,
        "expense_total": total,
        "monthly_budget": limit,
        "remaining": round(limit - total, 2),
        "usage_pct": round(usage_pct, 1),
        "advice": advice,
        "by_category": by_category,
        "pending_tasks": [{"id": str(x["_id"]), "title": x["title"], "deadline": x.get("deadline"), "priority": x.get("priority", "Medium")} for x in pending],
        "completed_tasks": tasks.count_documents({"user_id": USER_ID, "status": "Completed"})
    })

# --- AI ASSISTANT ---
@app.post("/api/assistant/chat")
def assistant_chat():
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()
    if not message or len(message) > 2000:
        return jsonify({"error": "Message is required (maximum 2000 characters)"}), 400
    
    month = date.today().strftime("%Y-%m")
    rows = list(expenses.find({"user_id": USER_ID, "date": {"$regex": f"^{month}"}}))
    total = round(sum(float(x.get("amount", 0)) for x in rows), 2)
    pending = list(tasks.find({"user_id": USER_ID, "status": "Pending"}).limit(10))
    budget_doc = budgets.find_one({"user_id": USER_ID, "month": month})
    limit = float(budget_doc["monthly_limit"]) if budget_doc else 8000.0

    context = {
        "month_expense_total": total,
        "budget": limit,
        "pending_tasks": [x.get("title") for x in pending]
    }
    try:
        proposal = understand_command(message, context)
    except Exception as e:
        return jsonify({"error": f"AI service error: {str(e)}"}), 502

    action = proposal.get("action")
    if action not in {"create_task", "add_expense", "create_reminder", "general_query"}:
        return jsonify({"error": "Unsupported action returned by assistant"}), 502

    return jsonify({"proposal": proposal, "requires_confirmation": action != "general_query"})

@app.post("/api/assistant/execute")
def assistant_execute():
    data = request.get_json(silent=True) or {}
    action = data.get("action")
    title = str(data.get("title") or "").strip()
    
    if action == "create_task":
        if not title:
            return jsonify({"error": "Task title required"}), 400
        try:
            deadline = valid_date(data.get("deadline"))
        except ValueError:
            return jsonify({"error": "Invalid task date"}), 400
        priority = data.get("priority") or "Medium"
        if priority not in {"High", "Medium", "Low"}:
            priority = "Medium"
        tasks.insert_one({
            "user_id": USER_ID,
            "title": title[:200],
            "deadline": deadline,
            "priority": priority,
            "status": "Pending",
            "created_at": datetime.utcnow()
        })
        return jsonify({"message": f"Task '{title}' created successfully!"})

    if action == "add_expense":
        try:
            amount = float(data.get("amount", 0))
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid amount"}), 400
        if not 0 < amount <= 10000000:
            return jsonify({"error": "Invalid amount"}), 400
        category = str(data.get("category") or "Other")[:40]
        desc = title[:200] or f"{category} expense"
        expenses.insert_one({
            "user_id": USER_ID,
            "amount": round(amount, 2),
            "category": category,
            "description": desc,
            "date": valid_date(data.get("deadline")) or date.today().isoformat(),
            "created_at": datetime.utcnow()
        })
        return jsonify({"message": f"Expense of ₹{amount:,.2f} recorded under {category}!"})

    if action == "create_reminder":
        if not title:
            return jsonify({"error": "Reminder title required"}), 400
        try:
            reminder_date = valid_date(data.get("deadline") or data.get("reminder_date"))
        except ValueError:
            return jsonify({"error": "Reminder date must be YYYY-MM-DD"}), 400
        if not reminder_date:
            reminder_date = (date.today() + timedelta(days=1)).isoformat()
        reminders.insert_one({
            "user_id": USER_ID,
            "title": title[:200],
            "reminder_date": reminder_date,
            "status": "Pending",
            "created_at": datetime.utcnow()
        })
        return jsonify({"message": f"Reminder '{title}' saved for {reminder_date}!"})

    return jsonify({"error": "Unsupported action"}), 400

# --- DOCUMENTS ---
@app.get("/api/documents")
def get_documents():
    docs = documents.find({"user_id": USER_ID}, {"storage_name": 0})
    return jsonify([json_doc(x) for x in docs])

@app.post("/api/documents")
def upload_document():
    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"error": "Choose a file"}), 400
    original = secure_filename(file.filename)
    ext = original.rsplit(".", 1)[-1].lower() if "." in original else ""
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Only PDF, PNG, JPG and JPEG files are allowed"}), 400
    
    storage_name = f"{uuid.uuid4().hex}.{ext}"
    path = UPLOAD_DIR / storage_name
    file.save(path)
    file_size_kb = round(path.stat().st_size / 1024, 1)

    doc = {
        "user_id": USER_ID,
        "filename": original,
        "storage_name": storage_name,
        "category": str(request.form.get("category", "Personal"))[:40],
        "size_kb": file_size_kb,
        "created_at": datetime.utcnow()
    }
    result = documents.insert_one(doc)
    return jsonify({"message": "Document uploaded successfully", "id": str(result.inserted_id)}), 201

@app.post("/api/documents/analyze/<document_id>")
def analyze_document(document_id):
    """Smart AI extraction simulation for receipts/bills/invoices."""
    doc = documents.find_one({"_id": parse_id(document_id), "user_id": USER_ID})
    if not doc:
        return jsonify({"error": "Document not found"}), 404

    filename = doc.get("filename", "").lower()
    cat = doc.get("category", "Personal")

    # Smart heuristics based on filename and category
    amount = 450.0
    category = "Bills"
    extracted_text = "Standard Receipt Document"

    if any(k in filename for k in ["uber", "cab", "travel", "flight", "ticket"]):
        amount = 340.0
        category = "Travel"
        extracted_text = "Travel fare receipt"
    elif any(k in filename for k in ["food", "swiggy", "zomato", "restaurant", "cafe", "coffee"]):
        amount = 520.0
        category = "Food"
        extracted_text = "Dining invoice"
    elif any(k in filename for k in ["cloud", "aws", "hosting", "server", "domain", "github"]):
        amount = 1450.0
        category = "Bills"
        extracted_text = "Tech infrastructure invoice"
    elif any(k in filename for k in ["amazon", "flipkart", "store", "bill"]):
        amount = 899.0
        category = "Shopping"
        extracted_text = "Retail purchase invoice"

    return jsonify({
        "extracted": {
            "document_name": doc.get("filename"),
            "summary": extracted_text,
            "suggested_action": "add_expense",
            "amount": amount,
            "category": category,
            "description": f"Extracted from {doc.get('filename')}"
        }
    })

@app.delete("/api/documents/<document_id>")
def delete_document(document_id):
    try:
        doc = documents.find_one({"_id": parse_id(document_id), "user_id": USER_ID})
        if not doc:
            return jsonify({"error": "Document not found"}), 404
        storage_name = doc.get("storage_name")
        if storage_name:
            file_path = UPLOAD_DIR / storage_name
            if file_path.exists():
                file_path.unlink()
        documents.delete_one({"_id": parse_id(document_id), "user_id": USER_ID})
        return jsonify({"message": "Document deleted successfully"})
    except Exception as e:
        return jsonify({"error": f"Failed to delete: {str(e)}"}), 400

@app.get("/api/documents/<document_id>/download")
def download_document(document_id):
    try:
        doc = documents.find_one({"_id": parse_id(document_id), "user_id": USER_ID})
    except Exception:
        return jsonify({"error": "Invalid document ID"}), 400
    if not doc:
        return jsonify({"error": "Document not found"}), 404
    path = UPLOAD_DIR / doc["storage_name"]
    if not path.exists():
        return jsonify({"error": "Stored file not found"}), 404
    return send_file(path, as_attachment=True, download_name=doc["filename"])

if __name__ == "__main__":
    ensure_indexes()
    print(f"LifeSync AI backend started in {'MongoDB' if USE_MONGO else 'Zero-Setup Local Storage'} mode.")
    app.run(host="127.0.0.1", port=5000, debug=True)
