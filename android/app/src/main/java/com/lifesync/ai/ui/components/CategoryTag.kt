package com.lifesync.ai.ui.components

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lifesync.ai.ui.theme.getCategoryColor

@Composable
fun CategoryTag(
    category: String,
    modifier: Modifier = Modifier
) {
    val categoryColor = getCategoryColor(category)

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(8.dp),
        color = categoryColor.copy(alpha = 0.15f)
    ) {
        Text(
            text = category,
            color = categoryColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}
