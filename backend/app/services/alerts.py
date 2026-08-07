def generate_alerts(result):
    alerts = []
    
    risk_level = result.get("risk_level") or result.get("severity")
    if risk_level in ("High", "Critical"):
        alerts.append("Critical cyber risk detected")
        
    risk_score = result.get("risk_score")
    if risk_score is not None and risk_score < 50:
        alerts.append("Immediate action required")
        
    issues_found = result.get("issues_found") or []
    for issue in issues_found:
        alerts.append(issue)
        
    return alerts