package com.lifesync.ai.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lifesync.ai.data.model.Task
import com.lifesync.ai.data.repository.LifeSyncRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TasksUiState(
    val isLoading: Boolean = false,
    val tasks: List<Task> = emptyList(),
    val searchQuery: String = "",
    val activeFilter: String = "All",
    val errorMessage: String? = null,
    val userMessage: String? = null
)

class TasksViewModel(
    private val repository: LifeSyncRepository = LifeSyncRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(TasksUiState())
    val uiState: StateFlow<TasksUiState> = _uiState.asStateFlow()

    init {
        loadTasks()
    }

    fun loadTasks() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = repository.getTasks()
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    tasks = result.getOrNull() ?: emptyList()
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to load tasks"
                )
            }
        }
    }

    fun setSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
    }

    fun setActiveFilter(filter: String) {
        _uiState.value = _uiState.value.copy(activeFilter = filter)
    }

    fun toggleTask(task: Task) {
        val targetStatus = if (task.status == "Completed") "Pending" else "Completed"
        val taskId = task.id ?: return

        viewModelScope.launch {
            val result = repository.toggleTaskStatus(taskId, targetStatus)
            if (result.isSuccess) {
                val updatedTasks = _uiState.value.tasks.map {
                    if (it.id == taskId) it.copy(status = targetStatus) else it
                }
                _uiState.value = _uiState.value.copy(tasks = updatedTasks)
            } else {
                _uiState.value = _uiState.value.copy(errorMessage = "Could not update task status")
            }
        }
    }

    fun addTask(title: String, priority: String, deadline: String?) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = repository.createTask(title, priority, deadline)
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    userMessage = "Task created successfully!",
                    isLoading = false
                )
                loadTasks()
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to create task"
                )
            }
        }
    }

    fun deleteTask(taskId: String) {
        viewModelScope.launch {
            val result = repository.deleteTask(taskId)
            if (result.isSuccess) {
                val updated = _uiState.value.tasks.filterNot { it.id == taskId }
                _uiState.value = _uiState.value.copy(tasks = updated, userMessage = "Task deleted")
            } else {
                _uiState.value = _uiState.value.copy(errorMessage = "Failed to delete task")
            }
        }
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(userMessage = null, errorMessage = null)
    }
}
