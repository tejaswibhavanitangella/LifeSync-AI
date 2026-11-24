package com.lifesync.ai.ui.calendar

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lifesync.ai.data.model.Reminder
import com.lifesync.ai.data.model.Task
import com.lifesync.ai.data.repository.LifeSyncRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class TimelineItem(val date: String) {
    data class TaskDeadline(val task: Task) : TimelineItem(task.deadline ?: "")
    data class ScheduledReminder(val reminder: Reminder) : TimelineItem(reminder.reminderDate)
}

data class CalendarUiState(
    val isLoading: Boolean = false,
    val timelineItems: List<TimelineItem> = emptyList(),
    val reminders: List<Reminder> = emptyList(),
    val errorMessage: String? = null,
    val userMessage: String? = null
)

class CalendarViewModel(
    private val repository: LifeSyncRepository = LifeSyncRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(CalendarUiState())
    val uiState: StateFlow<CalendarUiState> = _uiState.asStateFlow()

    init {
        loadCalendarData()
    }

    fun loadCalendarData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val remindersResult = repository.getReminders()
            val tasksResult = repository.getTasks()

            val reminders = remindersResult.getOrDefault(emptyList())
            val tasks = tasksResult.getOrDefault(emptyList())

            val timeline = mutableListOf<TimelineItem>()
            tasks.filter { !it.deadline.isNullOrBlank() }.forEach {
                timeline.add(TimelineItem.TaskDeadline(it))
            }
            reminders.filter { it.reminderDate.isNotBlank() }.forEach {
                timeline.add(TimelineItem.ScheduledReminder(it))
            }

            timeline.sortBy { it.date }

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                timelineItems = timeline,
                reminders = reminders
            )
        }
    }

    fun addReminder(title: String, date: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = repository.createReminder(title, date)
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(userMessage = "Reminder scheduled!")
                loadCalendarData()
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to schedule reminder"
                )
            }
        }
    }

    fun deleteReminder(id: String) {
        viewModelScope.launch {
            val result = repository.deleteReminder(id)
            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(userMessage = "Reminder removed")
                loadCalendarData()
            } else {
                _uiState.value = _uiState.value.copy(errorMessage = "Failed to remove reminder")
            }
        }
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(userMessage = null, errorMessage = null)
    }
}
