package com.vitalchain.ui

import android.graphics.Color
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.vitalchain.R
import com.vitalchain.ble.AcknowledgmentHandler
import com.vitalchain.ble.BleAdvertiser
import com.vitalchain.ble.BleScanner
import com.vitalchain.escalation.PhysicalAlert
import com.vitalchain.escalation.SmsFallback
import com.vitalchain.state.EmergencyState
import com.vitalchain.state.StateController
import com.vitalchain.triage.EmergencyCoordinator
import com.vitalchain.triage.TriageLevel
import com.vitalchain.triage.Vitals
import com.vitalchain.storage.EmergencyDatabaseHelper
import java.util.UUID

class HealthDashboardActivity : AppCompatActivity() {

    private lateinit var tvStateStatus: TextView
    private lateinit var btnTriggerEmergency: Button
    private lateinit var btnAcknowledge: Button

    private lateinit var stateController: StateController
    private lateinit var bleAdvertiser: BleAdvertiser
    private lateinit var bleScanner: BleScanner
    private lateinit var physicalAlert: PhysicalAlert
    private lateinit var smsFallback: SmsFallback
    private lateinit var dbHelper: EmergencyDatabaseHelper
    
    private val emergencyCoordinator = EmergencyCoordinator()
    private var currentEmergencyId: String? = null
    private var currentTriageLevel: TriageLevel = TriageLevel.GREEN

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_health_dashboard)

        tvStateStatus = findViewById(R.id.tvStateStatus)
        btnTriggerEmergency = findViewById(R.id.btnTriggerEmergency)
        btnAcknowledge = findViewById(R.id.btnAcknowledge)

        bleAdvertiser = BleAdvertiser(this)
        physicalAlert = PhysicalAlert(this)
        smsFallback = SmsFallback(this)
        dbHelper = EmergencyDatabaseHelper(this)

        stateController = StateController(
            onStateChanged = { state -> updateUiForState(state) },
            onEscalate = { handleEscalation() }
        )

        bleScanner = BleScanner(this) { alert ->
            // Received an alert from another device
            runOnUiThread {
                if (stateController.currentState == EmergencyState.IDLE) {
                    currentTriageLevel = alert.level
                    currentEmergencyId = alert.emergencyIdHash.toString()
                    tvStateStatus.text = "RECEIVED ALERT (${alert.level})"
                    tvStateStatus.setTextColor(Color.parseColor("#FF9800"))
                    physicalAlert.startAlert()
                    btnAcknowledge.visibility = Button.VISIBLE
                }
            }
        }

        btnTriggerEmergency.setOnClickListener {
            // Simulate a RED emergency trigger
            val severeVitals = Vitals(150, 85, 180, 100, true)
            val result = emergencyCoordinator.classifyEmergency(severeVitals)
            
            if (result.level == TriageLevel.RED) {
                currentTriageLevel = TriageLevel.RED
                currentEmergencyId = UUID.randomUUID().toString()
                stateController.triggerAlert()
                stateController.startPropagation()
                
                bleAdvertiser.startAdvertising(
                    currentEmergencyId!!, 
                    currentTriageLevel, 
                    System.currentTimeMillis()
                )

                // Log to SQLite
                dbHelper.logEmergency(
                    currentEmergencyId!!,
                    currentTriageLevel,
                    System.currentTimeMillis(),
                    false,
                    EmergencyState.PROPAGATING
                )
            }
        }

        btnAcknowledge.setOnClickListener {
            physicalAlert.stopAlert()
            btnAcknowledge.visibility = Button.GONE
            tvStateStatus.text = "Status: IDLE"
            tvStateStatus.setTextColor(Color.parseColor("#4CAF50"))
            
            // If we are the receiver, we just acknowledge to stop local alarm
            // (In a full app we'd broadcast an ACK back)
            if (stateController.currentState != EmergencyState.IDLE) {
                stateController.acknowledgeAlert()
                bleAdvertiser.stopAdvertising()
            }
        }
    }

    private fun updateUiForState(state: EmergencyState) {
        when (state) {
            EmergencyState.IDLE -> {
                tvStateStatus.text = "Status: IDLE"
                tvStateStatus.setTextColor(Color.parseColor("#4CAF50"))
            }
            EmergencyState.ALERT_TRIGGERED, EmergencyState.PROPAGATING -> {
                tvStateStatus.text = "Status: PROPAGATING ALERTS..."
                tvStateStatus.setTextColor(Color.parseColor("#F44336"))
            }
            EmergencyState.ACKNOWLEDGED -> {
                tvStateStatus.text = "Status: ACKNOWLEDGED by Peer"
                tvStateStatus.setTextColor(Color.parseColor("#2196F3"))
                bleAdvertiser.stopAdvertising()
            }
            EmergencyState.ESCALATED -> {
                tvStateStatus.text = "Status: ESCALATED (SMS Sent)"
                tvStateStatus.setTextColor(Color.parseColor("#9C27B0"))
            }
        }
    }

    private fun handleEscalation() {
        // Timer expired without ACK
        smsFallback.sendEmergencySms(
            "+1234567890", // Mock emergency contact
            currentTriageLevel,
            System.currentTimeMillis()
        )
        // Log escalation
        currentEmergencyId?.let {
            dbHelper.logEmergency(
                it,
                currentTriageLevel,
                System.currentTimeMillis(),
                false,
                EmergencyState.ESCALATED
            )
        }
    }

    override fun onResume() {
        super.onResume()
        bleScanner.startScanning()
    }

    override fun onPause() {
        super.onPause()
        bleScanner.stopScanning()
    }
}
