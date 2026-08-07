import requests
from app.core.config import AI_SERVICE_URL

def get_ai_analysis(scan_result):
    try:
        response = requests.post(
            AI_SERVICE_URL,
            json={
                "scan_data": scan_result
            },
            timeout=5
        )
        # Ensure we return a dictionary with summary and actions
        data = response.json()
        if isinstance(data, dict) and "summary" in data and "actions" in data:
            return data
        return {
            "summary": data.get("summary", "Scan analysis completed."),
            "actions": data.get("actions", ["Review security logs regularly."])
        }
    except Exception:
        verdict = scan_result.get("verdict", "UNKNOWN")
        severity = scan_result.get("severity", "Medium")
        
        return {
            "summary": f"AI service offline. Local security analysis: Verdict is {verdict} with {severity} risk level.",
            "actions": [
                "Verify file or URL safety on a secondary scanning engine.",
                "Monitor logs for abnormal network or authorization activity.",
                "Consult system security policies and update software definitions."
            ]
        }