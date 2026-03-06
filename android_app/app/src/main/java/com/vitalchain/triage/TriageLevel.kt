package com.vitalchain.triage

enum class TriageLevel {
    GREEN,
    YELLOW,
    RED
}

data class Vitals(
    val heartRate: Int,
    val oxygenSaturation: Int,
    val bloodPressureSystolic: Int,
    val bloodPressureDiastolic: Int,
    val hasSevereSymptoms: Boolean
)
