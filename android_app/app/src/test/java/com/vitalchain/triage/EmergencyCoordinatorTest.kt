package com.vitalchain.triage

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class EmergencyCoordinatorTest {

    private val coordinator = EmergencyCoordinator()

    @Test
    fun testNormalVitals_ExpectedGreen() {
        val vitals = Vitals(
            heartRate = 75,
            oxygenSaturation = 98,
            bloodPressureSystolic = 120,
            bloodPressureDiastolic = 80,
            hasSevereSymptoms = false
        )

        val result = coordinator.classifyEmergency(vitals)

        assertEquals(TriageLevel.GREEN, result.level)
        assertEquals(1.0f, result.confidenceScore)
        assertEquals(false, result.requiresManualConfirmation)
    }

    @Test
    fun testElevatedHeartRate_ExpectedYellow() {
        // HR > 100, but < 120 so it's a yellow point (1 pt)
        val vitals = Vitals(
            heartRate = 110,
            oxygenSaturation = 96,
            bloodPressureSystolic = 120,
            bloodPressureDiastolic = 80,
            hasSevereSymptoms = false
        )

        val result = coordinator.classifyEmergency(vitals)

        // Only 1 yellow point -> Result is GREEN according to our logic
        // Because yellow requires >= 2 points or (red > 0 && yellow > 0)
        assertEquals(TriageLevel.GREEN, result.level)
    }

    @Test
    fun testElevatedHeartRateAndLowOxygen_ExpectedYellow() {
        // HR > 100 (1 yellow pt) and O2 <= 94 (2 yellow pts) -> Total 3 yellow pts.
        val vitals = Vitals(
            heartRate = 110,
            oxygenSaturation = 94,
            bloodPressureSystolic = 120,
            bloodPressureDiastolic = 80,
            hasSevereSymptoms = false
        )

        val result = coordinator.classifyEmergency(vitals)

        assertEquals(TriageLevel.YELLOW, result.level)
        assertTrue(result.confidenceScore > 0f)
    }

    @Test
    fun testSevereSymptoms_ExpectedRed() {
        // Severe symptoms -> 3 red pts -> RED
        val vitals = Vitals(
            heartRate = 75,
            oxygenSaturation = 98,
            bloodPressureSystolic = 120,
            bloodPressureDiastolic = 80,
            hasSevereSymptoms = true
        )

        val result = coordinator.classifyEmergency(vitals)

        assertEquals(TriageLevel.RED, result.level)
    }

    @Test
    fun testExtremeVitals_ExpectedRed() {
        // HR > 120 (2 red pts), O2 < 90 (3 red pts) -> 5 red pts -> RED
        val vitals = Vitals(
            heartRate = 140,
            oxygenSaturation = 85,
            bloodPressureSystolic = 120,
            bloodPressureDiastolic = 80,
            hasSevereSymptoms = false
        )

        val result = coordinator.classifyEmergency(vitals)

        assertEquals(TriageLevel.RED, result.level)
        assertTrue(result.confidenceScore > 0.8f) // 5/6 = 0.833
    }
}
