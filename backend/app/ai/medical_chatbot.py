import os
import json
import math
from typing import List, Dict, Optional, Tuple

try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print("Warning: Failed to load sentence-transformers. Ensure it is installed.", e)
    model = None

# Structured Medical Knowledge Base
CONDITIONS_KB = [
    {
        "name": "Cardiac Distress",
        "symptoms": ["chest pain", "shortness of breath", "dizziness", "rapid heartbeat", "nausea", "sweating"],
        "severity": "HIGH",
        "keywords": "heart attack, coronary, myocardial infarction"
    },
    {
        "name": "Respiratory Issue",
        "symptoms": ["shortness of breath", "wheezing", "cough", "tight chest", "difficulty breathing"],
        "severity": "HIGH",
        "keywords": "asthma, copd, respiratory failure"
    },
    {
        "name": "Hypoxia",
        "symptoms": ["confusion", "restlessness", "bluish skin", "rapid breathing", "shortness of breath"],
        "severity": "HIGH",
        "keywords": "low oxygen, cyanosis, hypoxia"
    },
    {
        "name": "Anxiety Attack",
        "symptoms": ["rapid heartbeat", "sweating", "trembling", "shortness of breath", "chest pain", "fear"],
        "severity": "MEDIUM",
        "keywords": "panic attack, stress, anxiety"
    },
    {
        "name": "Dehydration",
        "symptoms": ["extreme thirst", "dry mouth", "fatigue", "dizziness", "confusion", "dark urine"],
        "severity": "MEDIUM",
        "keywords": "dehydrated, fluid loss, dry"
    },
    {
        "name": "Viral Infection",
        "symptoms": ["fever", "chills", "fatigue", "body aches", "sore throat", "cough", "headache"],
        "severity": "LOW",
        "keywords": "flu, common cold, virus"
    },
    {
        "name": "Fatigue",
        "symptoms": ["constant tiredness", "weakness", "lack of energy", "drowsiness", "difficulty concentrating"],
        "severity": "LOW",
        "keywords": "tired, exhausted, sleep deprivation"
    },
    {
        "name": "Gastrointestinal Issue",
        "symptoms": ["nausea", "vomiting", "diarrhea", "stomach pain", "loss of appetite"],
        "severity": "MEDIUM",
        "keywords": "food poisoning, stomach bug, gastroenteritis"
    },
    {
        "name": "Migraine",
        "symptoms": ["severe headache", "nausea", "sensitivity to light", "sensitivity to sound", "visual disturbances"],
        "severity": "MEDIUM",
        "keywords": "headache, aura, throbbing"
    },
    {
        "name": "Heat Stroke",
        "symptoms": ["high body temperature", "altered mental state", "nausea", "flushed skin", "rapid breathing", "racing heart rate"],
        "severity": "HIGH",
        "keywords": "hyperthermia, heat stroke, overheating"
    }
]

# Pre-compute embeddings for conditions
CONDITION_EMBEDDINGS = {}
if model:
    for cond in CONDITIONS_KB:
        text_repr = f"{cond['name']}. Symptoms: {', '.join(cond['symptoms'])}. {cond['keywords']}"
        CONDITION_EMBEDDINGS[cond["name"]] = model.encode(text_repr)

def cosine_similarity(a, b):
    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def process_vitals(vitals: dict) -> Tuple[float, list, float]:
    """Helper to process vitals and return severity boost and context notes."""
    vitals_boost = 1.0
    context = []
    
    if not vitals:
        return vitals_boost, context, 0.0

    hr = vitals.get("heart_rate")
    spo2 = vitals.get("spo2")
    bp_sys = None
    bp = vitals.get("blood_pressure", "")
    if isinstance(bp, str) and "/" in bp:
        try:
            bp_sys = int(bp.split("/")[0])
        except:
            pass

    critical_score = 0.0
    if hr and hr > 130:
        vitals_boost *= 1.2
        critical_score += 0.5
        context.append(f"Elevated heart rate ({hr} bpm).")
    elif hr and hr < 50:
        vitals_boost *= 1.1
        critical_score += 0.3
        context.append(f"Low heart rate ({hr} bpm).")
        
    if spo2 and spo2 < 90:
        vitals_boost *= 1.3
        critical_score += 0.6
        context.append(f"Critically low SpO2 ({spo2}%).")
    elif spo2 and spo2 < 95:
        vitals_boost *= 1.1
        critical_score += 0.2
        context.append(f"Low SpO2 ({spo2}%).")
        
    if bp_sys and bp_sys > 180:
        vitals_boost *= 1.2
        critical_score += 0.4
        context.append(f"Severely high blood pressure ({bp}).")
        
    return vitals_boost, context, critical_score

def analyze_text_query(user_input: str, vitals: dict = None, state: str = None) -> dict:
    if not user_input.strip() and not vitals:
        return {
            "response": "Please describe your symptoms or provide vitals for analysis.",
            "confidence": 0.0,
            "predictions": [],
            "top_condition": "Unknown",
            "severity": "LOW"
        }
        
    # Analyze text with embedding
    scores = []
    if model and user_input.strip():
        user_emb = model.encode(user_input)
        for cond in CONDITIONS_KB:
            sim = cosine_similarity(user_emb, CONDITION_EMBEDDINGS[cond["name"]])
            scores.append((cond, sim))
    else:
        # Fallback if no model or no text, base on vitals
        for cond in CONDITIONS_KB:
            scores.append((cond, 0.1))

    # Incorporate vitals
    vitals_boost, vitals_context, vitals_criticality = process_vitals(vitals)
    
    final_scores = []
    for cond, base_score in scores:
        adj_score = base_score
        
        # Adjust based on severity if vitals are abnormal
        if vitals_criticality > 0 and cond["severity"] == "HIGH":
            adj_score *= vitals_boost
            
        # Hard scale to not exceed 0.98
        adj_score = min(adj_score, 0.98)
        final_scores.append((cond, adj_score))
        
    final_scores.sort(key=lambda x: x[1], reverse=True)
    top_matches = final_scores[:3]
    top_cond = top_matches[0][0] if top_matches else None
    confidence = top_matches[0][1] * 100 if top_matches else 0.0
    
    predictions = [{"name": c["name"], "confidence": round(s * 100, 1)} for c, s in top_matches]
    
    # Generate response string
    severity = top_cond["severity"] if top_cond else "UNKNOWN"
    
    explanation = ""
    if state == "ALERT" or state == "ESCALATED":
        explanation += "⚠️ EMERGENCY PROTOCOL ACTIVE. Help is being coordinated. "
        
    if top_cond and top_matches[0][1] > 0.4:
        explanation += f"Based on your description, this could be related to {top_cond['name']}. "
    else:
        explanation += "I am analyzing your symptoms, but I cannot confidently determine a specific condition yet. "
        
    if vitals_context:
        explanation += "Note: " + " ".join(vitals_context)
        
    if severity == "HIGH" or vitals_criticality >= 0.5:
        explanation += " Please seek immediate medical attention."
    else:
        explanation += " Possible conditions include: " + ", ".join([f"{p['name']} ({p['confidence']}%)" for p in predictions]) + "."

    return {
        "response": explanation,
        "confidence": round(confidence, 1),
        "predictions": predictions,
        "top_condition": top_cond["name"] if top_cond else "Unknown",
        "severity": severity
    }

def analyze_symptom_list(symptoms: List[str], vitals: dict = None) -> dict:
    if not symptoms:
        return {
            "top_condition": "Unknown",
            "confidence": 0.0,
            "alternatives": [],
            "severity": "LOW"
        }
        
    normalized_symptoms = [s.lower().strip() for s in symptoms]
    vitals_boost, _, vitals_critical = process_vitals(vitals)
    
    condition_scores = []
    for cond in CONDITIONS_KB:
        cond_sym = [s.lower() for s in cond["symptoms"]]
        
        # Count overlaps
        overlap = 0
        for s in normalized_symptoms:
            for cs in cond_sym:
                if s in cs or cs in s:
                    overlap += 1
                    break
                    
        base_overlap = overlap / max(len(cond_sym), 1)
        
        # multipliers
        score = base_overlap
        if cond["severity"] == "HIGH":
            score *= 1.1
            if vitals_critical > 0:
                score *= vitals_boost 
                
        score = min(score, 0.98) # cap
        condition_scores.append((cond, score))
        
    condition_scores.sort(key=lambda x: x[1], reverse=True)
    top_matches = condition_scores[:3]
    top_cond = top_matches[0][0]
    confidence = top_matches[0][1] * 100
    
    alternatives = [{"name": c["name"], "confidence": round(s * 100, 1)} for c, s in top_matches[1:]]
    
    return {
        "top_condition": top_cond["name"],
        "confidence": round(confidence, 1),
        "alternatives": alternatives,
        "severity": top_cond["severity"]
    }

def get_chatbot_response(message: str, vitals: dict, status: str, latency: dict = None) -> dict:
    '''Adapter wrapper to preserve the internal old signature if anything else uses it'''
    result = analyze_text_query(user_input=message, vitals=vitals, state=status)
    return {
        "clinical_explanation": result["response"],
        "system_action_explanation": f"(Confidence: {result['confidence']}%)"
    }
