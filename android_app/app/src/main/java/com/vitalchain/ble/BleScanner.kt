package com.vitalchain.ble

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.content.pm.PackageManager
import android.os.ParcelUuid
import androidx.core.app.ActivityCompat
import com.vitalchain.triage.TriageLevel
import java.nio.ByteBuffer
import java.util.UUID

data class EmergencyAlert(
    val emergencyIdHash: Int,
    val level: TriageLevel,
    val timestampSeconds: Int
)

class BleScanner(
    private val context: Context,
    private val onAlertReceived: (EmergencyAlert) -> Unit
) {

    private val VITALCHAIN_SERVICE_UUID = UUID.fromString("0000180F-0000-1000-8000-00805f9b34fb")
    
    private val bluetoothManager: BluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter? = bluetoothManager.adapter
    private val scanner = bluetoothAdapter?.bluetoothLeScanner

    fun startScanning() {
        if (scanner == null) return

        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
            return
        }

        val filters = listOf(
            ScanFilter.Builder()
                .setServiceUuid(ParcelUuid(VITALCHAIN_SERVICE_UUID))
                .build()
        )

        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()

        scanner.startScan(filters, settings, scanCallback)
    }

    fun stopScanning() {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED) {
            scanner?.stopScan(scanCallback)
        }
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            val serviceData = result.scanRecord?.getServiceData(ParcelUuid(VITALCHAIN_SERVICE_UUID))
            if (serviceData != null && serviceData.size >= 9) {
                val buffer = ByteBuffer.wrap(serviceData)
                val idHash = buffer.int
                val levelOrdinal = buffer.get().toInt()
                val timestampSecs = buffer.int

                val level = TriageLevel.values().getOrElse(levelOrdinal) { TriageLevel.GREEN }
                
                onAlertReceived(EmergencyAlert(idHash, level, timestampSecs))
            }
        }
    }
}
