package com.vitalchain.triage

data class ClassificationResult(
    val level: TriageLevel,
    val confidenceScore: Float,
    val requiresManualConfirmation: Boolean
)

class EmergencyCoordinator {

    // Thresholds
    private val HR_THRESHOLD_HIGH = 120
    private val HR_THRESHOLD_LOW = 40
    private val O2_THRESHOLD_DANGER = 90
    private val O2_THRESHOLD_WARNING = 94
    private val SYS_HIGH = 160
    private val SYS_LOW = 90

    fun classifyEmergency(vitals: Vitals): ClassificationResult {
        var redPoints = 0
        var yellowPoints = 0
        
        // Heart Rate Checks
        if (vitals.heartRate > HR_THRESHOLD_HIGH || vitals.heartRate < HR_THRESHOLD_LOW) {
            redPoints += 2
        } else if (vitals.heartRate > 100 || vitals.heartRate < 50) {
            yellowPoints += 1
        }

        // Oxygen Checks
        if (vitals.oxygenSaturation < O2_THRESHOLD_DANGER) {
            redPoints += 3
        } else if (vitals.oxygenSaturation <= O2_THRESHOLD_WARNING) {
            yellowPoints += 2
        }

        // BP Checks
        if (vitals.bloodPressureSystolic > SYS_HIGH || vitals.bloodPressureSystolic < SYS_LOW) {
            redPoints += 2
        } else if (vitals.bloodPressureSystolic > 140 || vitals.bloodPressureSystolic < 100) {
            yellowPoints += 1
        }

        if (vitals.hasSevereSymptoms) {
            redPoints += 3
        }

        val totalPoints = redPoints + yellowPoints
        var confidence = 0f
        val level: TriageLevel

        if (redPoints >= 3) {
            level = TriageLevel.RED
            confidence = (redPoints / 6f).coerceAtMost(1.0f)
        } else if (yellowPoints >= 2 || (redPoints > 0 && yellowPoints > 0)) {
            level = TriageLevel.YELLOW
            confidence = (yellowPoints / 4f).coerceAtMost(1.0f)
        } else {
            level = TriageLevel.GREEN
            confidence = 1.0f
        }

        val requiresConfirmation = confidence < 0.7f && level != TriageLevel.GREEN
        
        return ClassificationResult(level, confidence, requiresConfirmation)
    }
}
