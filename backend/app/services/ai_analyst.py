def explain_threat_indicators(evidence: dict) -> dict:
    target = evidence.get("target", "Unknown Target")
    score = evidence.get("risk_score", 0)
    severity = evidence.get("severity", "None")
    
    reasons = []
    if evidence.get("virustotal_malicious", 0) > 0:
        reasons.append("VirusTotal flagged indicator as malicious (weight: 25%)")
    if evidence.get("ssl_invalid"):
        reasons.append("Invalid/Expired SSL certificate detected (weight: 10%)")
    if evidence.get("dns_mismatch"):
        reasons.append("DNS reverse lookup mismatch flagged (weight: 10%)")
    if evidence.get("abuse_score", 0) > 20:
        reasons.append("AbuseIPDB reports high incident reporting score (weight: 15%)")
    if not reasons:
        reasons.append("Low risk baseline indicators observed.")
        
    summary = f"Aggregated analysis for {target} shows risk score {score} ({severity} risk level)."
    
    return {
        "threat_score": score,
        "confidence": 90,
        "reasons": reasons,
        "attack_summary": summary,
        "why_occurred": "Detection triggered by pattern matching and indicators of compromise correlation.",
        "likely_attack_chain": "Reconnaissance -> Active Scan -> Tactic Mapping",
        "business_impact": "Medium impact. Potential threat vector exposure if unchecked.",
        "containment_steps": [
            "Isolate host/asset from network segment.",
            "Revoke active token sessions."
        ],
        "recovery_steps": [
            "Restore target asset configuration from verified backups.",
            "Audit firewall rules."
        ],
        "future_prevention": [
            "Configure multi-factor authentication.",
            "Schedule recurring port scans."
        ]
    }
