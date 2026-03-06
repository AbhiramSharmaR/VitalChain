package com.vitalchain.ble

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.content.Context
import android.content.pm.PackageManager
import android.os.ParcelUuid
import androidx.core.app.ActivityCompat
import com.vitalchain.triage.TriageLevel
import java.nio.ByteBuffer
import java.util.UUID

class BleAdvertiser(private val context: Context) {

    // Using a random UUID for the VitalChain service
    private val VITALCHAIN_SERVICE_UUID = UUID.fromString("0000180F-0000-1000-8000-00805f9b34fb")
    
    private val bluetoothManager: BluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter? = bluetoothManager.adapter
    private val advertiser = bluetoothAdapter?.bluetoothLeAdvertiser

    fun startAdvertising(emergencyId: String, level: TriageLevel, timestamp: Long) {
        if (advertiser == null) return

        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_ADVERTISE) != PackageManager.PERMISSION_GRANTED) {
             // Handle permission logic in UI layer
             return
        }

        // Optimize advertising for RED emergencies
        val mode = if (level == TriageLevel.RED) {
            AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY
        } else {
            AdvertiseSettings.ADVERTISE_MODE_BALANCED
        }

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(mode)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(false)
            .build()

        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addServiceUuid(ParcelUuid(VITALCHAIN_SERVICE_UUID))
            .addServiceData(ParcelUuid(VITALCHAIN_SERVICE_UUID), buildPayload(emergencyId, level, timestamp))
            .build()

        advertiser.startAdvertising(settings, data, advertiseCallback)
    }

    fun stopAdvertising() {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_ADVERTISE) == PackageManager.PERMISSION_GRANTED) {
            advertiser?.stopAdvertising(advertiseCallback)
        }
    }

    private fun buildPayload(emergencyId: String, level: TriageLevel, timestamp: Long): ByteArray {
        // Simple binary payload: 4 bytes EmergencyId (hash), 1 byte Level, 4 bytes Timestamp (seconds)
        val buffer = ByteBuffer.allocate(9)
        buffer.putInt(emergencyId.hashCode())
        buffer.put(level.ordinal.toByte())
        buffer.putInt((timestamp / 1000).toInt())
        return buffer.array()
    }

    private val advertiseCallback = object : android.bluetooth.le.AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            super.onStartSuccess(settingsInEffect)
            // Log success
        }

        override fun onStartFailure(errorCode: Int) {
            super.onStartFailure(errorCode)
            // Log failure
        }
    }
}
