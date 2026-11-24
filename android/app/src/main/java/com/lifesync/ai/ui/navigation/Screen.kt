package com.lifesync.ai.ui.navigation

sealed class Screen(val route: String) {
    object Dashboard : Screen("dashboard")
    object Tasks : Screen("tasks")
    object Finance : Screen("finance")
    object Calendar : Screen("calendar")
    object Assistant : Screen("assistant")
    object Settings : Screen("settings")
}
