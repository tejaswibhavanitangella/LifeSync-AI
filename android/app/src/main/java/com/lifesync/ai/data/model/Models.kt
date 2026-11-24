package com.lifesync.ai.data.model

import com.google.gson.annotations.SerializedName

data class Task(
    @SerializedName("_id") val id: String? = null,
    @SerializedName("title") val title: String,
    @SerializedName("priority") val priority: String = "Medium",
    @SerializedName("deadline") val deadline: String? = null,
    @SerializedName("status") val status: String = "Pending",
    @SerializedName("created_at") val createdAt: String? = null
)

data class CreateTaskRequest(
    @SerializedName("title") val title: String,
    @SerializedName("priority") val priority: String = "Medium",
    @SerializedName("deadline") val deadline: String? = null
)

data class UpdateTaskRequest(
    @SerializedName("status") val status: String? = null,
    @SerializedName("title") val title: String? = null,
    @SerializedName("priority") val priority: String? = null,
    @SerializedName("deadline") val deadline: String? = null
)

data class Expense(
    @SerializedName("_id") val id: String? = null,
    @SerializedName("amount") val amount: Double,
    @SerializedName("category") val category: String,
    @SerializedName("description") val description: String,
    @SerializedName("date") val date: String,
    @SerializedName("created_at") val createdAt: String? = null
)

data class CreateExpenseRequest(
    @SerializedName("amount") val amount: Double,
    @SerializedName("category") val category: String,
    @SerializedName("description") val description: String,
    @SerializedName("date") val date: String? = null
)

data class Reminder(
    @SerializedName("_id") val id: String? = null,
    @SerializedName("title") val title: String,
    @SerializedName("reminder_date") val reminderDate: String,
    @SerializedName("status") val status: String = "Pending",
    @SerializedName("created_at") val createdAt: String? = null
)

data class CreateReminderRequest(
    @SerializedName("title") val title: String,
    @SerializedName("reminder_date") val reminderDate: String
)

data class BudgetUpdateRequest(
    @SerializedName("monthly_limit") val monthlyLimit: Double
)

data class DashboardStats(
    @SerializedName("pending_tasks") val pendingTasks: Int = 0,
    @SerializedName("total_tasks") val totalTasks: Int = 0,
    @SerializedName("total_expenses") val totalExpenses: Double = 0.0,
    @SerializedName("budget") val budget: Double = 8000.0,
    @SerializedName("remaining_budget") val remainingBudget: Double = 8000.0,
    @SerializedName("streak_days") val streakDays: Int = 5,
    @SerializedName("storage_mode") val storageMode: String = "Ready"
)

data class AssistantChatRequest(
    @SerializedName("message") val message: String
)

data class AssistantProposal(
    @SerializedName("action") val action: String,
    @SerializedName("title") val title: String? = null,
    @SerializedName("amount") val amount: Double? = null,
    @SerializedName("category") val category: String? = null,
    @SerializedName("deadline") val deadline: String? = null,
    @SerializedName("priority") val priority: String? = null,
    @SerializedName("response") val response: String = ""
)

data class AssistantChatResponse(
    @SerializedName("proposal") val proposal: AssistantProposal,
    @SerializedName("requires_confirmation") val requiresConfirmation: Boolean = false
)

data class ApiResponse(
    @SerializedName("message") val message: String? = null,
    @SerializedName("error") val error: String? = null
)

data class HealthResponse(
    @SerializedName("status") val status: String = "ok",
    @SerializedName("mode") val mode: String = "online"
)
