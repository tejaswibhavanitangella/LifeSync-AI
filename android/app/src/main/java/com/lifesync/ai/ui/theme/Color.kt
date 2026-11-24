package com.lifesync.ai.ui.theme

import androidx.compose.ui.graphics.Color

val Violet80 = Color(0xFFDDD6FE)
val Violet40 = Color(0xFF7C3AED)
val Violet20 = Color(0xFF4C1D95)

val Indigo80 = Color(0xFFC7D2FE)
val Indigo40 = Color(0xFF4F46E5)

val Slate900 = Color(0xFF0F172A)
val Slate800 = Color(0xFF1E293B)
val Slate700 = Color(0xFF334155)
val Slate600 = Color(0xFF475569)
val Slate400 = Color(0xFF94A3B8)
val Slate100 = Color(0xFFF1F5F9)
val Slate50 = Color(0xFFF8FAFC)

val DarkBg = Color(0xFF0B0F19)
val DarkSurface = Color(0xFF111827)
val DarkCard = Color(0xFF1A2234)

val Emerald500 = Color(0xFF10B981)
val Rose500 = Color(0xFFF43F5E)
val Amber500 = Color(0xFFF59E0B)
val Blue500 = Color(0xFF3B82F6)

// Category Colors
val CategoryFood = Color(0xFFF97316)
val CategoryTravel = Color(0xFF0EA5E9)
val CategoryTech = Color(0xFF3B82F6)
val CategoryEducation = Color(0xFF8B5CF6)
val CategoryBills = Color(0xFFF43F5E)
val CategoryShopping = Color(0xFFEC4899)
val CategoryHealth = Color(0xFF10B981)
val CategoryOther = Color(0xFF64748B)

fun getCategoryColor(category: String): Color {
    return when (category.lowercase()) {
        "food" -> CategoryFood
        "travel" -> CategoryTravel
        "tech" -> CategoryTech
        "education" -> CategoryEducation
        "bills" -> CategoryBills
        "shopping" -> CategoryShopping
        "health" -> CategoryHealth
        else -> CategoryOther
    }
}
