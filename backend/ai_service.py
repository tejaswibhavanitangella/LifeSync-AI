import json
import os
import re
from datetime import date, datetime, timedelta

def _parse_relative_date(text: str) -> str | None:
    lower = text.lower()
    today = date.today()
    if "day after tomorrow" in lower:
        return (today + timedelta(days=2)).isoformat()
    if "tomorrow" in lower:
        return (today + timedelta(days=1)).isoformat()
    if "today" in lower or "tonight" in lower:
        return today.isoformat()
    
    # "in X days"
    m_in_days = re.search(r"in\s+(\d+)\s+days?", lower)
    if m_in_days:
        days = int(m_in_days.group(1))
        return (today + timedelta(days=days)).isoformat()

    # Day of week (e.g., "next monday", "on friday")
    days_of_week = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for i, day_name in enumerate(days_of_week):
        if day_name in lower:
            current_dow = today.weekday()
            diff = (i - current_dow) % 7
            if diff <= 0:
                diff += 7
            return (today + timedelta(days=diff)).isoformat()

    # Standard YYYY-MM-DD pattern
    m_date = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text)
    if m_date:
        return m_date.group(1)

    return None

def _detect_category(text: str) -> str:
    lower = text.lower()
    if any(k in lower for k in ["food", "lunch", "dinner", "breakfast", "coffee", "tea", "snack", "pizza", "burger", "grocery", "groceries", "restaurant", "cafe", "meal"]):
        return "Food"
    if any(k in lower for k in ["travel", "uber", "ola", "cab", "taxi", "bus", "train", "metro", "flight", "petrol", "diesel", "fuel", "ticket"]):
        return "Travel"
    if any(k in lower for k in ["book", "course", "udemy", "tuition", "exam", "study", "education", "school", "college"]):
        return "Education"
    if any(k in lower for k in ["bill", "electricity", "water", "wifi", "internet", "recharge", "rent", "utility", "gas", "subscription", "netflix"]):
        return "Bills"
    if any(k in lower for k in ["shopping", "clothes", "shirt", "shoes", "amazon", "flipkart", "mall", "electronics", "gadget"]):
        return "Shopping"
    if any(k in lower for k in ["doctor", "medicine", "pharmacy", "health", "hospital", "gym", "workout", "fitness"]):
        return "Health"
    return "Other"

def _detect_priority(text: str) -> str:
    lower = text.lower()
    if any(k in lower for k in ["urgent", "critical", "asap", "high priority", "important", "emergency", "must do", "vital"]):
        return "High"
    if any(k in lower for k in ["low priority", "whenever", "minor", "someday", "low"]):
        return "Low"
    return "Medium"

def _smart_offline_nlp(message: str, context: dict | None = None) -> dict:
    """High accuracy offline heuristic NLP parser for assistant commands."""
    text = message.strip()
    lower = text.lower()
    context = context or {}

    # Extract currency / numbers
    amount_match = re.search(r"(?:₹|rs\.?|\$)\s*(\d+(?:\.\d{1,2})?)", lower)
    if not amount_match:
        # Match standalone number associated with spend/cost
        amount_match = re.search(r"\b(?:for|of|spent|spend|cost|paid|pay)?\s*(\d+(?:\.\d{1,2})?)\s*(?:rs|rupees|inr|bucks)?\b", lower)

    # 1. Expense Detection
    if any(w in lower for w in ["spent", "spend", "paid", "pay", "expense", "cost", "bought", "purchased", "recharge"]):
        amount = None
        if amount_match:
            try:
                amount = float(amount_match.group(1))
            except ValueError:
                pass

        if amount and amount > 0:
            category = _detect_category(lower)
            # Clean title
            clean_title = re.sub(r"(?:spent|spend|paid|pay|bought|purchased|for|of|rs\.?|₹|\$|\d+(?:\.\d{1,2})?|inr|rupees)", "", text, flags=re.I).strip()
            clean_title = clean_title.strip(" ,.-") or f"{category} expense"
            return {
                "action": "add_expense",
                "title": clean_title.capitalize(),
                "amount": amount,
                "category": category,
                "deadline": None,
                "priority": None,
                "response": f"I drafted an expense of ₹{amount:,.2f} for '{clean_title}' under {category}. Please confirm to save it."
            }

    # 2. Reminder Detection
    if any(w in lower for w in ["remind", "reminder", "alarm"]):
        target_date = _parse_relative_date(text) or (date.today() + timedelta(days=1)).isoformat()
        clean_title = re.sub(r"^(please\s+)?(remind me to|remind me|set a reminder to|set a reminder|reminder to|reminder)\s*", "", text, flags=re.I).strip()
        clean_title = re.sub(r"\b(tomorrow|today|day after tomorrow|next week|at \d+|on \w+)\b", "", clean_title, flags=re.I).strip()
        clean_title = clean_title.strip(" ,.-") or "Reminder"
        return {
            "action": "create_reminder",
            "title": clean_title.capitalize(),
            "deadline": target_date,
            "amount": None,
            "category": None,
            "priority": None,
            "response": f"I've set up a reminder: '{clean_title.capitalize()}' scheduled for {target_date}. Please confirm."
        }

    # 3. Task Detection
    if any(w in lower for w in ["task", "todo", "to do", "add", "prepare", "finish", "complete", "schedule", "work on", "submit", "build", "review"]):
        target_date = _parse_relative_date(text)
        priority = _detect_priority(text)
        clean_title = re.sub(r"^(please\s+)?(add a task to|add task to|create a task to|create task to|add a task|add task|todo|to do)\s*", "", text, flags=re.I).strip()
        clean_title = re.sub(r"\b(by tomorrow|tomorrow|today|day after tomorrow|asap|urgent|high priority|low priority)\b", "", clean_title, flags=re.I).strip()
        clean_title = clean_title.strip(" ,.-") or text
        return {
            "action": "create_task",
            "title": clean_title.capitalize(),
            "deadline": target_date,
            "priority": priority,
            "amount": None,
            "category": None,
            "response": f"I prepared a {priority}-priority task: '{clean_title.capitalize()}'" + (f" due on {target_date}." if target_date else ".") + " Please review and confirm."
        }

    # 4. General Queries & Productivity Advice
    expense_total = context.get("month_expense_total", 0)
    pending_tasks = context.get("pending_tasks", [])
    budget = context.get("budget", 5000)
    remaining = budget - expense_total

    if any(w in lower for w in ["budget", "spent", "money", "expense", "financial", "balance", "saving"]):
        pct = round((expense_total / max(1, budget)) * 100)
        return {
            "action": "general_query",
            "title": None,
            "response": f"📊 Financial Overview: You've spent ₹{expense_total:,.2f} of your ₹{budget:,.2f} monthly budget ({pct}% used). You have ₹{remaining:,.2f} remaining. " +
                        ("You're well within budget! Keep it up." if pct < 80 else "You are close to your limit—keep non-essential spending minimal.")
        }

    if any(w in lower for w in ["pending", "tasks", "focus", "today", "what to do", "priority", "schedule"]):
        if pending_tasks:
            task_list = "; ".join(pending_tasks[:5])
            return {
                "action": "general_query",
                "title": None,
                "response": f"🎯 Here are your top pending priorities: {task_list}. Focus on high-priority items first!"
            }
        return {
            "action": "general_query",
            "title": None,
            "response": "🎉 Fantastic news! You have no pending tasks right now. You can relax or add a new goal."
        }

    if any(w in lower for w in ["hi", "hello", "hey", "who are you", "help"]):
        return {
            "action": "general_query",
            "title": None,
            "response": "Hello! I am your LifeSync AI copilot. I help you track tasks, log expenses, manage deadlines, and keep your life organized. Try saying: 'Add high priority task: Deliver Project Pitch tomorrow' or 'Spent 350 on team pizza'!"
        }

    return {
        "action": "general_query",
        "title": None,
        "response": f"I can help automate your workflow. Try: 'Add task: finish slides by tomorrow', 'Spent 250 on lunch', or 'How is my budget this month?'"
    }


def understand_command(message: str, context: dict | None = None) -> dict:
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()

    # Try Gemini if key is provided
    if gemini_key:
        try:
            import urllib.request
            prompt = f"""
You are LifeSync AI, an intelligent personal assistant.
Analyze this user command and return ONLY a valid JSON object with these keys:
"action": one of "create_task", "add_expense", "create_reminder", "general_query"
"title": string or null
"deadline": "YYYY-MM-DD" or null
"priority": "High" or "Medium" or "Low" or null
"amount": number or null
"category": string or null (Food, Travel, Education, Bills, Shopping, Health, Other)
"response": friendly short confirmation or answer

Current Date: {date.today().isoformat()}
User message: {message}
Context: {json.dumps(context or {})}
"""
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=5) as response:
                res_data = json.loads(response.read().decode())
                raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                return json.loads(raw_text)
        except Exception as e:
            print(f"[LifeSync AI] Gemini call fallback to offline parser: {e}")

    # Try OpenAI if key is provided
    if openai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            system_prompt = f"""
You are LifeSync AI, a personal productivity and finance assistant.
Return ONLY a valid JSON object:
{{
  "action": "create_task" | "add_expense" | "create_reminder" | "general_query",
  "title": string or null,
  "deadline": "YYYY-MM-DD" or null,
  "priority": "High" | "Medium" | "Low" | null,
  "amount": number or null,
  "category": "Food" | "Travel" | "Education" | "Bills" | "Shopping" | "Health" | "Other" | null,
  "response": "friendly conversational string"
}}
Today is {date.today().isoformat()}.
Context: {json.dumps(context or {})}
"""
            completion = client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            raw = completion.choices[0].message.content.strip()
            data = json.loads(raw)
            if data.get("action") in {"create_task", "add_expense", "create_reminder", "general_query"}:
                return data
        except Exception as e:
            print(f"[LifeSync AI] OpenAI call fallback to offline parser: {e}")

    # Seamless offline parser
    return _smart_offline_nlp(message, context)
