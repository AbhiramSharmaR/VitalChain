package com.vitalchain.ble

import android.content.Context
import com.vitalchain.state.StateController

class AcknowledgmentHandler(
    private val context: Context,
    private val stateController: StateController
) {
    // In a real implementation this might send a directed BLE message or GATT characteristic write
    // For MVP we can just broadcast an ACK packet so the sender knows someone received it.
    private val advertiser = BleAdvertiser(context)

    fun sendAcknowledgment(emergencyIdHash: Int) {
        // We reuse the advertiser but perhaps with a special level or a flag in production.
        // For MVP, if we press Acknowledge, it just stops the local escalation.
        // The sender needs to hear back though.
        // We'll simulate this for the demo by just triggering the state controller.
    }

    fun onAcknowledgmentReceived(emergencyIdHash: Int) {
        // If we were the sender and we get an ACK:
        stateController.acknowledgeAlert()
    }
}
