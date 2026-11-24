package com.lifesync.ai.data.repository

import com.lifesync.ai.data.api.NetworkClient
import com.lifesync.ai.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class LifeSyncRepository {

    private val api get() = NetworkClient.apiService

    suspend fun getHealth(): Result<HealthResponse> = withContext(Dispatchers.IO) {
        try {
            val response = api.getHealth()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(response.errorBody()?.string() ?: "Health check failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getDashboardStats(): Result<DashboardStats> = withContext(Dispatchers.IO) {
        try {
            val response = api.getDashboardStats()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch dashboard stats"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Tasks
    suspend fun getTasks(): Result<List<Task>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getTasks()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch tasks"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createTask(title: String, priority: String, deadline: String?): Result<Task> = withContext(Dispatchers.IO) {
        try {
            val response = api.createTask(CreateTaskRequest(title, priority, deadline))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create task"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleTaskStatus(id: String, newStatus: String): Result<Task> = withContext(Dispatchers.IO) {
        try {
            val response = api.updateTask(id, UpdateTaskRequest(status = newStatus))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to update task"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteTask(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.deleteTask(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete task"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Expenses
    suspend fun getExpenses(): Result<List<Expense>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getExpenses()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch expenses"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createExpense(amount: Double, category: String, description: String, date: String? = null): Result<Expense> = withContext(Dispatchers.IO) {
        try {
            val response = api.createExpense(CreateExpenseRequest(amount, category, description, date))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to log expense"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteExpense(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.deleteExpense(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete expense"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateBudget(limit: Double): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.updateBudget(BudgetUpdateRequest(limit))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to update budget"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Reminders
    suspend fun getReminders(): Result<List<Reminder>> = withContext(Dispatchers.IO) {
        try {
            val response = api.getReminders()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch reminders"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createReminder(title: String, date: String): Result<Reminder> = withContext(Dispatchers.IO) {
        try {
            val response = api.createReminder(CreateReminderRequest(title, date))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create reminder"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteReminder(id: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = api.deleteReminder(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete reminder"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // AI Assistant
    suspend fun chatWithAssistant(message: String): Result<AssistantChatResponse> = withContext(Dispatchers.IO) {
        try {
            val response = api.sendAssistantChat(AssistantChatRequest(message))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Assistant request failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun executeAssistantProposal(proposal: AssistantProposal): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = api.executeAssistantProposal(proposal)
            if (response.isSuccessful) {
                Result.success(response.body()?.message ?: "Action completed")
            } else {
                Result.failure(Exception("Failed to execute proposal"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Seed & Reset
    suspend fun seedDemoData(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = api.seedDemoData()
            if (response.isSuccessful) {
                Result.success(response.body()?.message ?: "Demo data loaded")
            } else {
                Result.failure(Exception("Failed to seed demo data"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resetWorkspace(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val response = api.resetWorkspace()
            if (response.isSuccessful) {
                Result.success(response.body()?.message ?: "Workspace reset")
            } else {
                Result.failure(Exception("Failed to reset workspace"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
