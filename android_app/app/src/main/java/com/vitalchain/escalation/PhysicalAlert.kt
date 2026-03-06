package com.vitalchain.escalation

import android.content.Context
import android.media.RingtoneManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

class PhysicalAlert(private val context: Context) {

    private val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
        vibratorManager.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }

    private val alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
    private var ringtone = RingtoneManager.getRingtone(context, alarmSound)

    fun startAlert() {
        // Vibrate
        if (vibrator.hasVibrator()) {
            val pattern = longArrayOf(0, 500, 200, 500, 200) // SOS pattern roughly
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0)) // 0 = repeat at index 0
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(pattern, 0)
            }
        }

        // Sound Audio
        if (ringtone == null) {
            val notificationSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            ringtone = RingtoneManager.getRingtone(context, notificationSound)
        }
        ringtone?.play()
    }

    fun stopAlert() {
        vibrator.cancel()
        ringtone?.stop()
    }
}
