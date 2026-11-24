package com.lifesync.ai.ui.finance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lifesync.ai.data.model.DashboardStats
import com.lifesync.ai.data.model.Expense
import com.lifesync.ai.data.repository.LifeSyncRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class FinanceUiState(
    val isLoading: Boolean = false,
    val expenses: List<Expense> = emptyList(),
    val stats: DashboardStats = DashboardStats(),
    val selectedCategory: String = "All",
    val errorMessage: String? = null,
    val userMessage: String? = null
)

class FinanceViewModel(
    private val repository: LifeSyncRepository = LifeSyncRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(FinanceUiState())
    val uiState: StateFlow<FinanceUiState> = _uiState.asStateFlow()

    init {
        loadFinanceData()
    }

    fun loadFinanceData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val expensesResult = repository.getExpenses()
            val statsResult = repository.getDashboardStats()

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                expenses = expensesResult.getOrDefault(emptyList()),
                stats = statsResult.getOrDefault(DashboardStats())
            )
        }
    }

    fun setSelectedCategory(category: String) {
        _uiState.value = _uiState.value.copy(selectedCategory = category)
    }

    fun addExpense(amount: Double, category: String, description: String, date: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = repository.createExpense(amount, category, description, date)
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(userMessage = "Logged $description (₹$amount)")
                loadFinanceData()
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to record expense"
                )
            }
        }
    }

    fun deleteExpense(id: String) {
        viewModelScope.launch {
            val result = repository.deleteExpense(id)
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(userMessage = "Expense removed")
                loadFinanceData()
            } else {
                _uiState.value = _uiState.value.copy(errorMessage = "Failed to remove expense")
            }
        }
    }

    fun updateBudgetLimit(limit: Double) {
        viewModelScope.launch {
            val result = repository.updateBudget(limit)
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(userMessage = "Budget updated!")
                loadFinanceData()
            } else {
                _uiState.value = _uiState.value.copy(errorMessage = "Failed to update budget limit")
            }
        }
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(userMessage = null, errorMessage = null)
    }
}
