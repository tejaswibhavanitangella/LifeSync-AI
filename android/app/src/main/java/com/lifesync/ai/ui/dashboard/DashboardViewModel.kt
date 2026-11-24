package com.lifesync.ai.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lifesync.ai.data.model.DashboardStats
import com.lifesync.ai.data.model.Expense
import com.lifesync.ai.data.model.Task
import com.lifesync.ai.data.repository.LifeSyncRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val isLoading: Boolean = false,
    val stats: DashboardStats = DashboardStats(),
    val recentTasks: List<Task> = emptyList(),
    val recentExpenses: List<Expense> = emptyList(),
    val errorMessage: String? = null,
    val userMessage: String? = null
)

class DashboardViewModel(
    private val repository: LifeSyncRepository = LifeSyncRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboardData()
    }

    fun loadDashboardData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

            val statsResult = repository.getDashboardStats()
            val tasksResult = repository.getTasks()
            val expensesResult = repository.getExpenses()

            val stats = statsResult.getOrDefault(DashboardStats())
            val tasks = tasksResult.getOrDefault(emptyList()).take(3)
            val expenses = expensesResult.getOrDefault(emptyList()).take(3)

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                stats = stats,
                recentTasks = tasks,
                recentExpenses = expenses,
                errorMessage = statsResult.exceptionOrNull()?.localizedMessage
            )
        }
    }

    fun seedDemoData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = repository.seedDemoData()
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(userMessage = "✨ Demo data loaded successfully!")
                loadDashboardData()
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to seed demo data. Check server connection."
                )
            }
        }
    }

    fun clearUserMessage() {
        _uiState.value = _uiState.value.copy(userMessage = null, errorMessage = null)
    }
}
