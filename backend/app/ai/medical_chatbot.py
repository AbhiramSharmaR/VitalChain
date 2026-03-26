import os
import json
import math
import urllib.request
import urllib.error
import re
import threading
from typing import List, Dict, Optional, Tuple, Any

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

def classify_intent(text: str) -> str:
    """Classifies if a query is informational or symptom-based."""
    text_lower = text.lower()
    
    strong_info = ["how can i", "how do i", "tips for", "what are", "what is", "can you explain", "foods that", "how to", "how can you", "help me understand"]
    for kw in strong_info:
        if kw in text_lower:
            return "INFORMATIONAL"
            
    # Keep symptom intent focused on user-reported sensations/complaints.
    # Note: avoid treating general wellness questions (e.g., "How can I improve my sleep?") as symptom reports.
    symptom_keywords = ["i have", "i am feeling", "i feel", "my chest", "my head", "my stomach", "it hurts", "pain in", "experiencing", "suffering from", "i've been having", "i keep", "my arm", "symptoms of"]
    
    for kw in symptom_keywords:
        if kw in text_lower:
            return "SYMPTOM"
            
    info_keywords = ["what", "how", "why", "can you", "tips", "foods", "meaning", "define", "difference"]
    for kw in info_keywords:
        if kw in text_lower:
            return "INFORMATIONAL"
                
    if " i " in f" {text_lower} " or " my " in f" {text_lower} " or " me " in f" {text_lower} ":
        return "SYMPTOM"
        
    return "INFORMATIONAL"

def _informational_fallback(user_input: str) -> str:
    q = (user_input or "").strip()
    ql = q.lower()

    if "sleep" in ql:
        return (
            "To improve sleep, try keeping a consistent sleep/wake time, limiting caffeine after midday, "
            "reducing screen/bright light for 1–2 hours before bed, and keeping the room cool/dark/quiet. "
            "If you snore loudly, stop breathing during sleep, or have persistent daytime sleepiness, consider talking to a clinician."
        )
    if "stress" in ql or "anxiety" in ql:
        return (
            "For stress, start with a small daily routine: 10–15 minutes of walking, a short breathing exercise (slow exhale), "
            "and reducing late-day caffeine/alcohol. If stress is impacting sleep, appetite, or functioning for weeks, consider professional support."
        )
    if "cholesterol" in ql:
        return (
            "To help lower LDL cholesterol, focus on soluble fiber (oats/beans), replacing saturated fats with unsaturated fats "
            "(olive oil, nuts, fish), and regular activity. If you have diabetes, heart disease, or strong family history, ask your clinician "
            "whether medication is appropriate."
        )
    if "diabetes" in ql:
        return (
            "Common diabetes symptoms can include increased thirst/urination, fatigue, blurred vision, and slow-healing wounds. "
            "If you suspect diabetes, a clinician can confirm with blood tests (like fasting glucose or HbA1c)."
        )

    return (
        "I can help with general health information. If you share your goal (e.g., sleep, diet, exercise) or any symptoms, "
        "I can tailor the guidance."
    )
 
_FLAN_CACHE: Optional[dict] = None
_FLAN_LOCK = threading.Lock()

def _load_flan() -> dict:
    """
    Lazy-load Flan-T5 so the backend doesn't require ML deps to start.
    """
    global _FLAN_CACHE
    if _FLAN_CACHE is not None:
        return _FLAN_CACHE
    # Guard against concurrent first-load requests.
    with _FLAN_LOCK:
        if _FLAN_CACHE is not None:
            return _FLAN_CACHE
        try:
            import torch
            from transformers import T5ForConditionalGeneration, T5Tokenizer
        except Exception as e:
            raise RuntimeError(
                "Flan-T5 dependencies are not installed (torch, transformers)."
            ) from e

        device = "cuda" if torch.cuda.is_available() else "cpu"
        flan_name = os.getenv("FLAN_MODEL", "google/flan-t5-small")
        tokenizer = T5Tokenizer.from_pretrained(flan_name)
        model_ = T5ForConditionalGeneration.from_pretrained(flan_name).to(device)
        model_.eval()
        _FLAN_CACHE = {"device": device, "tokenizer": tokenizer, "model": model_, "torch": torch}
        return _FLAN_CACHE

def _flan_generate(prompt: str, max_new_tokens: int = 220) -> str:
    flan = _load_flan()
    input_ids = flan["tokenizer"].encode(prompt, return_tensors="pt").to(flan["device"])
    with flan["torch"].no_grad():
        outputs = flan["model"].generate(
            input_ids,
            max_new_tokens=max_new_tokens,
            min_new_tokens=min(80, max_new_tokens),
            do_sample=True,
            top_p=0.9,
            top_k=50,
            temperature=0.9,
            num_beams=1,
            no_repeat_ngram_size=3,
            repetition_penalty=1.15,
            early_stopping=True,
        )
    return flan["tokenizer"].decode(outputs[0], skip_special_tokens=True).strip()

_DISCLAIMER = "This is general medical information, not personal medical advice."

def _sanitize_flan_output(answer: str, user_message: str) -> str:
    """
    Flan-T5 sometimes echoes prompt text or leaks instruction lines. Clean that up.
    """
    text = (answer or "").strip()
    if not text:
        return _DISCLAIMER

    # Drop obvious prompt-leak lines.
    banned_substrings = [
        "instructions (do not repeat",
        "do not recommend specific medicines",
        "do not recommend specific medicine",
        "do not diagnose",
        "do not repeat these sentences",
        "your job is to answer",
        "context (if any):",
        "user's question or message:",
        "now write a clear, detailed answer",
    ]

    lines = [ln.strip() for ln in text.splitlines()]
    kept: List[str] = []
    for ln in lines:
        low = ln.lower()
        if not ln:
            continue
        if any(b in low for b in banned_substrings):
            continue
        # Also drop lines that are just bullet-rule fragments.
        if re.match(r"^-\s*(do not|give general|you may|write in|at the very end)", low):
            continue
        kept.append(ln)

    text = "\n".join(kept).strip() or text

    # Remove exact echoed question (common failure mode).
    q = (user_message or "").strip()
    if q and text.lower().startswith(q.lower()):
        text = text[len(q):].lstrip(" \n:.-")

    # Ensure disclaimer appears exactly once at the end.
    text = text.strip()
    text = re.sub(r"\bThis is general medical information, not personal medical advice\.\s*$", "", text, flags=re.I).strip()
    if text:
        text = f"{text}\n\n{_DISCLAIMER}"
    else:
        text = _DISCLAIMER

    return text

def flan_chatbot_answer(user_message: str, context_block: Optional[str] = None) -> str:
    """
    Flan-T5 chatbot (replaces Ollama entirely).
    """
    context = context_block or "No extra context is provided."
    # Keep prompt short to reduce instruction leakage in outputs.
    system_instructions = (
        "You are a helpful health information assistant.\n"
        "Write a helpful, detailed answer with short paragraphs and/or bullet points.\n"
        "Do not diagnose. Do not give medication names or dosages.\n"
        "Include practical self-care tips and add a short 'When to seek urgent care' section when relevant.\n"
        f"End your answer with: {_DISCLAIMER}\n"
    )
    prompt = (
        f"{system_instructions}\n\n"
        f"Context:\n{context}\n\n"
        f"Question:\n{user_message}\n\n"
        "Answer:"
    )
    raw = _flan_generate(prompt)
    return _sanitize_flan_output(raw, user_message)

def _snorebot_unavailable_message() -> str:
    return (
        "AI OCR/prescription analysis is unavailable because required ML/OCR dependencies are not installed. "
        "Install pytesseract + pillow + numpy + torch + transformers + sentence-transformers to enable it."
    )

_SNORE_CACHE: Optional[dict] = None

def _load_snorebot_models() -> dict:
    global _SNORE_CACHE
    if _SNORE_CACHE is not None:
        return _SNORE_CACHE
    try:
        import numpy as np
        import torch
        from sentence_transformers import SentenceTransformer as ST, util
        from transformers import AutoTokenizer, AutoModel, pipeline, T5ForConditionalGeneration, T5Tokenizer
    except Exception as e:
        raise RuntimeError(_snorebot_unavailable_message()) from e

    device = "cuda" if torch.cuda.is_available() else "cpu"
    embed_model = ST("sentence-transformers/all-MiniLM-L6-v2", device=device)

    clin_name = os.getenv("CLINICAL_BERT_MODEL", "emilyalsentzer/Bio_ClinicalBERT")
    clin_tokenizer = AutoTokenizer.from_pretrained(clin_name)
    clin_model = AutoModel.from_pretrained(clin_name).to(device)
    clin_model.eval()

    zshot = pipeline(
        "zero-shot-classification",
        model=os.getenv("ZSHOT_MODEL", "valhalla/distilbart-mnli-12-3"),
        device=0 if device == "cuda" else -1,
    )

    flan_name = os.getenv("FLAN_MODEL", "google/flan-t5-small")
    flan_tokenizer = T5Tokenizer.from_pretrained(flan_name)
    flan_model = T5ForConditionalGeneration.from_pretrained(flan_name).to(device)
    flan_model.eval()

    condition_labels = [
        "Respiratory infection (cold, flu, cough, sore throat)",
        "Gastrointestinal issue (stomach pain, vomiting, diarrhea)",
        "Headache or migraine",
        "Musculoskeletal pain (back pain, body pain, joint pain)",
        "Allergic reaction or skin allergy",
        "Urinary tract problem",
        "General fatigue or weakness",
        "Follow-up for chronic disease like diabetes or hypertension",
        "Other or unclear condition",
    ]

    label_emb_minilm = embed_model.encode(condition_labels, convert_to_tensor=True)

    def clinbert_embed(texts: Any) -> "np.ndarray":
        if isinstance(texts, str):
            texts = [texts]
        all_embs = []
        for i in range(0, len(texts), 8):
            batch = texts[i:i + 8]
            enc = clin_tokenizer(batch, padding=True, truncation=True, return_tensors="pt").to(device)
            with torch.no_grad():
                out = clin_model(**enc)
            token_embeddings = out.last_hidden_state
            mask = enc["attention_mask"].unsqueeze(-1).expand(token_embeddings.size()).float()
            sum_embeddings = (token_embeddings * mask).sum(1)
            sum_mask = mask.sum(1).clamp(min=1e-9)
            sent_emb = (sum_embeddings / sum_mask).cpu().numpy()
            all_embs.append(sent_emb)
        return np.vstack(all_embs)

    label_emb_clin = clinbert_embed(condition_labels)

    _SNORE_CACHE = {
        "device": device,
        "np": np,
        "torch": torch,
        "util": util,
        "embed_model": embed_model,
        "clin_tokenizer": clin_tokenizer,
        "clin_model": clin_model,
        "zshot": zshot,
        "flan_tokenizer": flan_tokenizer,
        "flan_model": flan_model,
        "labels": condition_labels,
        "label_emb_minilm": label_emb_minilm,
        "label_emb_clin": label_emb_clin,
        "clinbert_embed": clinbert_embed,
    }
    return _SNORE_CACHE

def ocr_printed(image_bytes: bytes) -> str:
    """
    SnoreBot notebook OCR for printed prescriptions/reports.
    """
    try:
        import io
        import re as _re
        from PIL import Image
        import pytesseract
    except Exception as e:
        raise RuntimeError(_snorebot_unavailable_message()) from e

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    max_dim = 1500
    w, h = img.size
    if max(w, h) > max_dim:
        scale = max_dim / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)))
    text = pytesseract.image_to_string(img, lang="eng")
    return _re.sub(r"\\s+", " ", text).strip()

def predict_condition(symptom_text: str, top_k: int = 3) -> List[dict]:
    """
    SnoreBot notebook condition prediction (zero-shot + MiniLM + ClinicalBERT).
    """
    m = _load_snorebot_models()
    symptom_text = (symptom_text or "").strip()
    if len(symptom_text) < 3:
        return []

    z = m["zshot"](symptom_text, m["labels"], multi_label=False)
    nli_scores = {lab: float(score) for lab, score in zip(z["labels"], z["scores"])}

    q_minilm = m["embed_model"].encode(symptom_text, convert_to_tensor=True)
    cos_minilm = m["util"].cos_sim(q_minilm, m["label_emb_minilm"])[0].cpu().numpy()

    q_clin = m["clinbert_embed"](symptom_text)[0]
    cos_clin = []
    for lab_vec in m["label_emb_clin"]:
        sim = float(
            m["np"].dot(q_clin, lab_vec)
            / (m["np"].linalg.norm(q_clin) * m["np"].linalg.norm(lab_vec) + 1e-9)
        )
        cos_clin.append(sim)
    cos_clin = m["np"].array(cos_clin)

    results = []
    for i, label in enumerate(m["labels"]):
        nli = float(nli_scores.get(label, 0.0))
        s_min = float(cos_minilm[i])
        s_clin = float(cos_clin[i])
        combined = 0.5 * nli + 0.3 * s_min + 0.2 * s_clin
        results.append(
            {
                "label": label,
                "nli_score": round(nli, 4),
                "minilm_sim": round(s_min, 4),
                "clin_sim": round(s_clin, 4),
                "combined_score": round(combined, 4),
            }
        )

    results = sorted(results, key=lambda x: -float(x["combined_score"]))
    return results[:top_k]

def generate_advice(symptom_text: str, predicted_label: str) -> str:
    """
    SnoreBot notebook advice generation (Flan-T5).
    """
    m = _load_snorebot_models()
    prompt = (
        "You are an AI in a demo health app. "
        "Given a patient's symptoms and a broad condition category, "
        "write 3–5 short sentences of high-level, safe advice.\n"
        "Rules: do NOT mention specific medicines or dosages. "
        "Encourage rest, hydration, and consulting a doctor if symptoms are serious or persistent.\n\n"
        f"Symptoms: {symptom_text}\n"
        f"Predicted condition category: {predicted_label}\n\n"
        "Advice for the patient:"
    )
    input_ids = m["flan_tokenizer"].encode(prompt, return_tensors="pt").to(m["device"])
    with m["torch"].no_grad():
        outputs = m["flan_model"].generate(
            input_ids,
            max_length=200,
            num_beams=4,
            temperature=0.7,
            early_stopping=True,
        )
    return m["flan_tokenizer"].decode(outputs[0], skip_special_tokens=True).strip()

def analyze_prescription(image_bytes: bytes) -> dict:
    """
    SnoreBot notebook printed-text pipeline:
      1) OCR
      2) Use OCR text as symptom_text
      3) Predict condition
      4) Generate safe advice
    """
    ocr_text = ocr_printed(image_bytes)
    symptom_text = ocr_text
    preds = predict_condition(symptom_text, top_k=3)
    top_pred = preds[0] if preds else None

    if top_pred is not None:
        advice = generate_advice(symptom_text, top_pred["label"])
        confidence = float(top_pred["combined_score"])
    else:
        advice = (
            "The system could not clearly understand the text. "
            "Please consult a licensed doctor for proper evaluation."
        )
        confidence = 0.0

    return {
        "ocr_text": ocr_text,
        "symptom_text": symptom_text,
        "predictions": preds,
        "top_label": top_pred["label"] if top_pred else None,
        "confidence": confidence,
        "generated_advice": advice,
    }

def analyze_text_query(user_input: str, vitals: dict = None, state: str = None) -> dict:
    if not user_input.strip() and not vitals:
        return {
            "response": "Please describe your symptoms or provide vitals for analysis.",
            "confidence": 0.0,
            "predictions": [],
            "top_condition": "Unknown",
            "severity": "LOW"
        }
        
    intent = classify_intent(user_input)
        
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
    
    if intent == "INFORMATIONAL":
        severity = "LOW"
        try:
            explanation = flan_chatbot_answer(user_input)
        except Exception as e:
            print(f"[chatbot] Flan-T5 unavailable or failed: {e}")
            explanation = _informational_fallback(user_input)
            
        return {
            "response": explanation,
            "confidence": 95.0,
            "predictions": [],
            "top_condition": "Informational",
            "severity": severity
        }
    
    # Generate response string for SYMPTOM intent
    severity = top_cond["severity"] if top_cond else "UNKNOWN"
    
    explanation = ""
    if state == "ALERT" or state == "ESCALATED":
        explanation += "⚠️ EMERGENCY PROTOCOL ACTIVE. Help is being coordinated. "
        
    if top_cond and confidence > 40.0:
        explanation += f"Based on your symptoms, this could be related to {top_cond['name']}. "
    else:
        explanation += "I am analyzing your symptoms, but I cannot confidently determine a specific condition at this time. "
        
    if vitals_context:
        explanation += "Note: " + " ".join(vitals_context) + " "
        
    if vitals_criticality >= 0.5 or (severity == "HIGH" and confidence > 50.0):
        explanation += " Please seek immediate medical attention."
    elif confidence > 30.0:
        explanation += " Possible conditions include: " + ", ".join([f"{p['name']} ({p['confidence']}%)" for p in predictions]) + "."
    else:
        explanation += " If you are feeling unwell, consider consulting a healthcare professional."

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
