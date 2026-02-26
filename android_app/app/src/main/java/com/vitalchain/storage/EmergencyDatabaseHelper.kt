package com.vitalchain.storage

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.vitalchain.state.EmergencyState
import com.vitalchain.triage.TriageLevel

class EmergencyDatabaseHelper(context: Context) : 
    SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        const val DATABASE_NAME = "vitalchain_emergency.db"
        const val DATABASE_VERSION = 1

        const val TABLE_LOGS = "emergency_logs"
        const val COLUMN_ID = "id"
        const val COLUMN_EMERGENCY_ID = "emergency_id"
        const val COLUMN_TRIAGE_LEVEL = "triage_level"
        const val COLUMN_TIMESTAMP = "timestamp"
        const val COLUMN_ACK_STATUS = "ack_status"
        const val COLUMN_ESCALATION_STAGE = "escalation_stage"
    }

    override fun onCreate(db: SQLiteDatabase) {
        val createTableQuery = """
            CREATE TABLE $TABLE_LOGS (
                $COLUMN_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COLUMN_EMERGENCY_ID TEXT,
                $COLUMN_TRIAGE_LEVEL TEXT,
                $COLUMN_TIMESTAMP INTEGER,
                $COLUMN_ACK_STATUS INTEGER,
                $COLUMN_ESCALATION_STAGE TEXT
            )
        """.trimIndent()
        db.execSQL(createTableQuery)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_LOGS")
        onCreate(db)
    }

    fun logEmergency(
        emergencyId: String,
        triageLevel: TriageLevel,
        timestamp: Long,
        ackStatus: Boolean,
        escalationStage: EmergencyState
    ) {
        val db = this.writableDatabase
        val values = ContentValues().apply {
            put(COLUMN_EMERGENCY_ID, emergencyId)
            put(COLUMN_TRIAGE_LEVEL, triageLevel.name)
            put(COLUMN_TIMESTAMP, timestamp)
            put(COLUMN_ACK_STATUS, if (ackStatus) 1 else 0)
            put(COLUMN_ESCALATION_STAGE, escalationStage.name)
        }
        db.insert(TABLE_LOGS, null, values)
        db.close()
    }
}
