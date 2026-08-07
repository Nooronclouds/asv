def generate_text_report(incident: dict, timeline: list) -> str:
    report = []
    report.append("VANGUARD SME SECURITY SUITE - INCIDENT REPORT")
    report.append("============================================")
    report.append(f"Incident ID: {incident.get('id')}")
    report.append(f"Severity: {incident.get('severity')}")
    report.append(f"Title: {incident.get('title')}")
    report.append(f"Status: {incident.get('status')}")
    report.append(f"Assigned Analyst: {incident.get('assigned_analyst')}")
    report.append("--------------------------------------------")
    report.append("Timeline:")
    for step in timeline:
        report.append(f" - {step.get('timestamp')}: {step.get('description')}")
    report.append("--------------------------------------------")
    report.append("Recommendations:")
    for action in incident.get('recommendations', []):
        report.append(f" * {action}")
    return "\n".join(report)
