package com.lifesync.ai.data.api

import com.lifesync.ai.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface LifeSyncApiService {

    @GET("api/health")
    suspend fun getHealth(): Response<HealthResponse>

    @GET("api/dashboard")
    suspend fun getDashboardStats(): Response<DashboardStats>

    // Tasks
    @GET("api/tasks")
    suspend fun getTasks(): Response<List<Task>>

    @POST("api/tasks")
    suspend fun createTask(@Body request: CreateTaskRequest): Response<Task>

    @PATCH("api/tasks/{id}")
    suspend fun updateTask(
        @Path("id") id: String,
        @Body request: UpdateTaskRequest
    ): Response<Task>

    @DELETE("api/tasks/{id}")
    suspend fun deleteTask(@Path("id") id: String): Response<ApiResponse>

    // Expenses
    @GET("api/expenses")
    suspend fun getExpenses(): Response<List<Expense>>

    @POST("api/expenses")
    suspend fun createExpense(@Body request: CreateExpenseRequest): Response<Expense>

    @DELETE("api/expenses/{id}")
    suspend fun deleteExpense(@Path("id") id: String): Response<ApiResponse>

    @POST("api/budget")
    suspend fun updateBudget(@Body request: BudgetUpdateRequest): Response<ApiResponse>

    // Reminders
    @GET("api/reminders")
    suspend fun getReminders(): Response<List<Reminder>>

    @POST("api/reminders")
    suspend fun createReminder(@Body request: CreateReminderRequest): Response<Reminder>

    @DELETE("api/reminders/{id}")
    suspend fun deleteReminder(@Path("id") id: String): Response<ApiResponse>

    // Demo Seed & Reset
    @POST("api/seed")
    suspend fun seedDemoData(): Response<ApiResponse>

    @POST("api/reset")
    suspend fun resetWorkspace(): Response<ApiResponse>

    // AI Assistant
    @POST("api/assistant/chat")
    suspend fun sendAssistantChat(@Body request: AssistantChatRequest): Response<AssistantChatResponse>

    @POST("api/assistant/execute")
    suspend fun executeAssistantProposal(@Body proposal: AssistantProposal): Response<ApiResponse>
}
