package com.vitalchain.escalation

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.telephony.SmsManager
import androidx.core.app.ActivityCompat
import com.vitalchain.triage.TriageLevel

class SmsFallback(private val context: Context) {

    fun sendEmergencySms(phoneNumber: String, level: TriageLevel, timestamp: Long) {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            return
        }

        val message = "EMERGENCY ALERT: $level condition detected at $timestamp. Please check the VitalChain app or contact the user immediately."

        try {
            val smsManager = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java)
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
            smsManager.sendTextMessage(phoneNumber, null, message, null, null)
        } catch (e: Exception) {
            e.printStackTrace()
            // In a real app we'd log this or try a backup method
        }
    }
}
