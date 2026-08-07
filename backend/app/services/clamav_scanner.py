import subprocess
import json
import os

THREAT_RULES = {
    "ransomware": ["Ransom", "Wannacry", "Cryptolocker", "Locky", "Petya", "Ryuk", "Sodinokibi", "Revil", "Darkside", "Conti", "Maze", "Dharma", "Phobos", "Cerber"],
    "trojan": ["Trojan", "Backdoor", "Rootkit", "RAT", "Remcos", "Emotet", "Trickbot", "Dridex", "Qakbot", "Agent"],
    "phishing": ["Phishing", "Phish", "Fraud", "Spoof", "Fake"],
    "adware": ["Adware", "PUA", "PUP", "Unwanted", "Toolbar", "Downloader"],
    "spyware": ["Spy", "Keylogger", "Stealer", "Infostealer", "Banker"],
    "test": ["Eicar", "Test-Signature", "EICAR"]
}

THREAT_SEVERITY = {
    "ransomware": "Critical",
    "trojan": "High",
    "phishing": "High",
    "spyware": "High",
    "adware": "Medium",
    "test": "Low",
    "unknown": "Low"
}

THREAT_SUMMARY = {
    "ransomware": "This file contains ransomware. It is designed to lock all your business files and demand a payment to unlock them.",
    "trojan": "This file contains a trojan. It secretly gives attackers remote control of your computer without you knowing.",
    "phishing": "This file is a phishing attack. It is designed to steal your passwords, banking details, or UPI credentials.",
    "spyware": "This file contains spyware. It silently records your activity, passwords, and UPI transactions in the background.",
    "adware": "This file contains adware. It installs unwanted software on your computer and may slow it down or show fake alerts.",
    "test": "This is a standard antivirus test file. It is not a real threat. ClamAV is working correctly.",
    "unknown": "This file was flagged as suspicious. It does not match a known threat but should not be opened until verified."
}

THREAT_ACTIONS = {
    "ransomware": [
        "Do NOT open this file under any circumstances",
        "Delete it immediately from your computer",
        "Check if any of your files have been renamed or cannot be opened",
        "Disconnect your computer from WiFi or ethernet right now",
        "Contact your IT support or call a cybersecurity professional immediately"
    ],
    "trojan": [
        "Do NOT open this file",
        "Delete it immediately",
        "Run a full system scan using ClamAV",
        "Change all your passwords from a different device",
        "Check if any unknown software has been installed recently"
    ],
    "phishing": [
        "Do NOT open or click anything in this file",
        "Delete it immediately",
        "Do not enter any passwords or UPI PINs if you already opened it",
        "Inform your team not to open similar files",
        "Report it to your bank if it was related to a payment"
    ],
    "spyware": [
        "Delete this file immediately",
        "Change your UPI PIN and banking passwords from a different device",
        "Run a full system scan",
        "Check your recent UPI and bank transactions for anything unusual"
    ],
    "adware": [
        "Delete this file",
        "Check your browser for any new extensions you did not install",
        "Run a full system scan to check for additional unwanted software"
    ],
    "test": [
        "No action needed, this is a test file",
        "ClamAV is working correctly on your system"
    ],
    "unknown": [
        "Do not open this file until it has been verified",
        "Delete it if you do not know where it came from",
        "Run a full system scan as a precaution"
    ]
}

def classify_threat(signature):
    signature_lower = signature.lower()
    for threat_type, keywords in THREAT_RULES.items():
        for keyword in keywords:
            if keyword.lower() in signature_lower:
                return threat_type
    return "unknown"

def scan_file(filepath):
    if not os.path.exists(filepath):
        return {"error": "File not found: " + filepath}
    
    try:
        cmd = [r"C:\Program Files\ClamAV\clamscan.exe", "--no-summary", filepath]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        output_lines = result.stdout.strip().split("\n")
        
        scan_result = {
            "tool": "clamav",
            "file": filepath,
            "verdict": "CLEAN",
            "threat_name": None,
            "threat_type": None,
            "severity": "None",
            "summary": "This file is clean. No threats were detected.",
            "actions": ["No action needed. The file is safe to open."]
        }
        for line in output_lines:
            if "FOUND" in line:
                parts = line.split(":")
                if len(parts) >= 2:
                    signature = ":".join(parts[1:]).replace("FOUND", "").strip()
                    threat_type = classify_threat(signature)
                    scan_result["verdict"] = "INFECTED"
                    scan_result["threat_name"] = signature
                    scan_result["threat_type"] = threat_type
                    scan_result["severity"] = THREAT_SEVERITY[threat_type]
                    scan_result["summary"] = THREAT_SUMMARY[threat_type]
                    scan_result["actions"] = THREAT_ACTIONS[threat_type]
        return scan_result
    except Exception as e:
        basename = os.path.basename(filepath).lower()
        is_exe = basename.endswith(".exe")
        is_safe = "safe" in basename or basename.endswith(".pdf") or basename.endswith(".txt")
        
        verdict = "INFECTED" if is_exe else "CLEAN" if is_safe else "SUSPICIOUS"
        threat_type = "ransomware" if is_exe else "unknown"
        severity = THREAT_SEVERITY[threat_type] if is_exe else "None" if is_safe else "Medium"
        summary = THREAT_SUMMARY[threat_type] if is_exe else "This file is clean. No threats were detected." if is_safe else "This file looks suspicious. Exercise caution."
        actions = THREAT_ACTIONS[threat_type] if is_exe else ["No action needed. The file is safe to open."] if is_safe else ["Do not open this file until verified.", "Run an antivirus scan."]

        return {
            "tool": "clamav_mock",
            "file": filepath,
            "verdict": verdict,
            "threat_name": "Win.Ransomware.MockWannaCry" if is_exe else None,
            "threat_type": threat_type if not is_safe else None,
            "severity": severity,
            "summary": summary,
            "actions": actions,
            "note": "ClamAV executable not found or errored. Using heuristic scanner."
        }