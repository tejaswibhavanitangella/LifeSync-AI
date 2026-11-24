package com.lifesync.ai.ui.assistant

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lifesync.ai.data.model.AssistantProposal
import com.lifesync.ai.data.repository.LifeSyncRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ChatMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val sender: String, // "user" or "assistant"
    val text: String,
    val proposal: AssistantProposal? = null
)

data class AssistantUiState(
    val isLoading: Boolean = false,
    val messages: List<ChatMessage> = listOf(
        ChatMessage(
            sender = "assistant",
            text = "👋 Welcome to LifeSync AI! I can help streamline your daily tasks, log expenses, schedule reminders, and answer queries. Try speaking or tapping any quick action below!"
        )
    ),
    val pendingProposal: AssistantProposal? = null,
    val errorMessage: String? = null
)

class AssistantViewModel(
    private val repository: LifeSyncRepository = LifeSyncRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(AssistantUiState())
    val uiState: StateFlow<AssistantUiState> = _uiState.asStateFlow()

    fun sendMessage(text: String) {
        if (text.isBlank()) return

        val userMsg = ChatMessage(sender = "user", text = text)
        _uiState.value = _uiState.value.copy(
            messages = _uiState.value.messages + userMsg,
            isLoading = true,
            pendingProposal = null,
            errorMessage = null
        )

        viewModelScope.launch {
            val result = repository.chatWithAssistant(text)
            if (result.isSuccess) {
                val data = result.getOrNull()!!
                val assistantMsg = ChatMessage(
                    sender = "assistant",
                    text = data.proposal.response.ifBlank { "I processed your request." },
                    proposal = if (data.requiresConfirmation) data.proposal else null
                )

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    messages = _uiState.value.messages + assistantMsg,
                    pendingProposal = if (data.requiresConfirmation) data.proposal else null
                )
            } else {
                val errMsg = ChatMessage(
                    sender = "assistant",
                    text = "Sorry, I had trouble processing that. Please check server connectivity."
                )
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    messages = _uiState.value.messages + errMsg,
                    errorMessage = result.exceptionOrNull()?.localizedMessage
                )
            }
        }
    }

    fun confirmProposal(proposal: AssistantProposal) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = repository.executeAssistantProposal(proposal)
            if (result.isSuccess) {
                val confirmMsg = ChatMessage(
                    sender = "assistant",
                    text = "✅ ${result.getOrNull() ?: "Action executed successfully!"}"
                )
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    messages = _uiState.value.messages + confirmMsg,
                    pendingProposal = null
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to execute proposal"
                )
            }
        }
    }

    fun dismissProposal() {
        _uiState.value = _uiState.value.copy(pendingProposal = null)
    }
}
