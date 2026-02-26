package com.vitalchain.state

import android.os.Handler
import android.os.Looper

enum class EmergencyState {
    IDLE,
    ALERT_TRIGGERED,
    PROPAGATING,
    ACKNOWLEDGED,
    ESCALATED
}

class StateController(
    private val onStateChanged: (EmergencyState) -> Unit,
    private val onEscalate: () -> Unit // e.g. send SMS fallback
) {
    var currentState: EmergencyState = EmergencyState.IDLE
        private set

    private val handler = Handler(Looper.getMainLooper())
    private val ESCALATION_TIMEOUT_MS = 60_000L // 60 seconds

    private val escalationRunnable = Runnable {
        if (currentState == EmergencyState.PROPAGATING || currentState == EmergencyState.ALERT_TRIGGERED) {
            transitionTo(EmergencyState.ESCALATED)
            onEscalate()
        }
    }

    fun triggerAlert() {
        if (currentState == EmergencyState.IDLE) {
            transitionTo(EmergencyState.ALERT_TRIGGERED)
        }
    }

    fun startPropagation() {
        if (currentState == EmergencyState.ALERT_TRIGGERED) {
            transitionTo(EmergencyState.PROPAGATING)
            // Start timer for escalation
            handler.postDelayed(escalationRunnable, ESCALATION_TIMEOUT_MS)
        }
    }

    fun acknowledgeAlert() {
        if (currentState == EmergencyState.PROPAGATING || currentState == EmergencyState.ALERT_TRIGGERED) {
            // Cancel escalation timer
            handler.removeCallbacks(escalationRunnable)
            transitionTo(EmergencyState.ACKNOWLEDGED)
        }
    }

    fun reset() {
        handler.removeCallbacks(escalationRunnable)
        transitionTo(EmergencyState.IDLE)
    }

    private fun transitionTo(newState: EmergencyState) {
        currentState = newState
        // Here we would also trigger SQLite persistence and broadcast the state change
        onStateChanged(currentState)
    }
}
