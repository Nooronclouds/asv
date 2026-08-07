def map_to_mitre(tool: str, verdict: str) -> dict:
    if verdict in ("DANGEROUS", "INFECTED", "PHISHING"):
        if tool == "clamav":
            return {
                "tactic": "Execution",
                "technique": "Shared Modules",
                "sub_technique": "T1129",
                "confidence": "High"
            }
        elif tool in ("virustotal", "email_analyser"):
            return {
                "tactic": "Initial Access",
                "technique": "Phishing",
                "sub_technique": "T1566.002",
                "confidence": "High"
            }
        elif tool == "nmap":
            return {
                "tactic": "Discovery",
                "technique": "Network Service Discovery",
                "sub_technique": "T1046",
                "confidence": "High"
            }
    return {
        "tactic": "Reconnaissance",
        "technique": "Active Scanning",
        "sub_technique": "T1595",
        "confidence": "Low"
    }
