DEFAULT_WEIGHTS = {
    "virustotal": 0.25,
    "abuseipdb": 0.15,
    "whois_age": 0.10,
    "dns_mismatch": 0.10,
    "ssl_invalid": 0.10,
    "nmap_ports": 0.20,
    "cisa_kev": 0.10
}

def calculate_weighted_risk(indicators: dict, weights: dict = None) -> dict:
    if not weights:
        weights = DEFAULT_WEIGHTS
        
    score = 0.0
    confidence = 85
    
    score += (indicators.get("virustotal", 0) * 100) * weights.get("virustotal", 0.25)
    score += indicators.get("abuseipdb", 0) * weights.get("abuseipdb", 0.15)
    score += (100 if indicators.get("dns_mismatch") else 0) * weights.get("dns_mismatch", 0.10)
    score += (100 if indicators.get("ssl_invalid") else 0) * weights.get("ssl_invalid", 0.10)
    score += min(indicators.get("nmap_ports", 0) * 20, 100) * weights.get("nmap_ports", 0.20)
    
    score = min(score, 100.0)
    severity = "None"
    if score >= 75:
        severity = "Critical"
    elif score >= 50:
        severity = "High"
    elif score >= 25:
        severity = "Medium"
    elif score > 0:
        severity = "Low"
        
    return {
        "risk_score": int(score),
        "confidence_score": confidence,
        "severity": severity,
        "risk_category": "Vulnerability" if score < 50 else "Active Exploitation"
    }

def calculate_posture_score(scan_results: list) -> int:
    if not scan_results:
        return 100
    deduction = 0
    for res in scan_results:
        verdict = res.get("verdict", "CLEAN")
        if verdict in ("DANGEROUS", "INFECTED", "PHISHING"):
            deduction += 25
        elif verdict == "SUSPICIOUS":
            deduction += 10
    return max(100 - deduction, 0)