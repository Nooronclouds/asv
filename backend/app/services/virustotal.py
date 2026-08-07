import requests
import json
from app.core.config import VIRUSTOTAL_API_KEY as API_KEY

URL_SUMMARY = {
    "dangerous": "This link is dangerous. It has been flagged by multiple security engines as a phishing page, malware source, or fake payment site.",
    "suspicious": "This link looks suspicious. It has not been confirmed as safe and may be trying to steal your information.",
    "clean": "This link appears to be safe. No security engines flagged it as dangerous."
}

URL_ACTIONS = {
    "dangerous": [
        "Do NOT click this link",
        "Delete the message or email containing this link immediately",
        "If you already clicked it, do not enter any passwords or UPI PINs",
        "Inform your team not to click this link",
        "Report it to your bank if it was related to a payment request"
    ],
    "suspicious": [
        "Do not click this link until it has been verified",
        "Check if the sender is someone you trust",
        "If it claims to be a payment link, call the sender directly to confirm",
        "When in doubt, do not click"
    ],
    "clean": [
        "This link appears safe to visit",
        "Always stay cautious with links received over WhatsApp or email"
    ]
}

def check_url(url):
    headers = {"x-apikey": API_KEY}

    response = requests.post(
        "https://www.virustotal.com/api/v3/urls",
        headers=headers,
        data={"url": url}
    )
    result = response.json()
    analysis_id = result["data"]["id"]

    analysis = requests.get(
        f"https://www.virustotal.com/api/v3/analyses/{analysis_id}",
        headers=headers
    ).json()

    stats = analysis["data"]["attributes"]["stats"]
    malicious = stats["malicious"]
    suspicious = stats["suspicious"]

    if malicious > 0:
        verdict = "dangerous"
    elif suspicious > 0:
        verdict = "suspicious"
    else:
        verdict = "clean"

    return {
        "tool": "virustotal",
        "url": url,
        "malicious_engines": malicious,
        "suspicious_engines": suspicious,
        "verdict": verdict.upper(),
        "severity": "Critical" if verdict == "dangerous" else "Medium" if verdict == "suspicious" else "None",
        "summary": URL_SUMMARY[verdict],
        "actions": URL_ACTIONS[verdict]
    }

if __name__ == "__main__":
    result = check_url("http://testsafebrowsing.appspot.com/s/phishing.html")
    print(json.dumps(result, indent=2))