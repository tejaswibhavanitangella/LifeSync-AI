package com.lifesync.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.lifesync.ai.ui.assistant.AssistantScreen
import com.lifesync.ai.ui.assistant.AssistantViewModel
import com.lifesync.ai.ui.calendar.CalendarScreen
import com.lifesync.ai.ui.calendar.CalendarViewModel
import com.lifesync.ai.ui.components.LifeSyncBottomNav
import com.lifesync.ai.ui.dashboard.DashboardScreen
import com.lifesync.ai.ui.dashboard.DashboardViewModel
import com.lifesync.ai.ui.finance.FinanceScreen
import com.lifesync.ai.ui.finance.FinanceViewModel
import com.lifesync.ai.ui.navigation.Screen
import com.lifesync.ai.ui.settings.SettingsScreen
import com.lifesync.ai.ui.tasks.TasksScreen
import com.lifesync.ai.ui.tasks.TasksViewModel
import com.lifesync.ai.ui.theme.LifeSyncTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val systemDark = isSystemInDarkTheme()
            var isDarkTheme by remember { mutableStateOf(systemDark) }

            LifeSyncTheme(darkTheme = isDarkTheme) {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Dashboard.route

                val showBottomBar = currentRoute != Screen.Settings.route

                // Shared ViewModels
                val dashboardViewModel: DashboardViewModel = viewModel()
                val tasksViewModel: TasksViewModel = viewModel()
                val financeViewModel: FinanceViewModel = viewModel()
                val calendarViewModel: CalendarViewModel = viewModel()
                val assistantViewModel: AssistantViewModel = viewModel()

                Scaffold(
                    bottomBar = {
                        if (showBottomBar) {
                            LifeSyncBottomNav(
                                currentRoute = currentRoute,
                                onNavigate = { screen ->
                                    navController.navigate(screen.route) {
                                        popUpTo(Screen.Dashboard.route) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            )
                        }
                    }
                ) { paddingValues ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                    ) {
                        NavHost(
                            navController = navController,
                            startDestination = Screen.Dashboard.route
                        ) {
                            composable(Screen.Dashboard.route) {
                                DashboardScreen(
                                    viewModel = dashboardViewModel,
                                    onNavigateToTasks = { navController.navigate(Screen.Tasks.route) },
                                    onNavigateToFinance = { navController.navigate(Screen.Finance.route) },
                                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
                                )
                            }
                            composable(Screen.Tasks.route) {
                                TasksScreen(viewModel = tasksViewModel)
                            }
                            composable(Screen.Finance.route) {
                                FinanceScreen(viewModel = financeViewModel)
                            }
                            composable(Screen.Calendar.route) {
                                CalendarScreen(viewModel = calendarViewModel)
                            }
                            composable(Screen.Assistant.route) {
                                AssistantScreen(viewModel = assistantViewModel)
                            }
                            composable(Screen.Settings.route) {
                                SettingsScreen(
                                    isDarkTheme = isDarkTheme,
                                    onToggleTheme = { isDarkTheme = !isDarkTheme },
                                    onBack = { navController.popBackStack() }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
