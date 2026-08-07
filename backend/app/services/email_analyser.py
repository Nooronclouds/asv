import re
import json
import sys

UPI_BRANDS = {
    "paytm":     "Paytm",
    "phonepe":   "PhonePe",
    "bhim":      "BHIM",
    "gpay":      "Google Pay",
    "googlepay": "Google Pay",
    "sbi":       "SBI",
    "hdfcbank":  "HDFC Bank",
    "hdfc":      "HDFC Bank",
    "icicibank": "ICICI Bank",
    "icici":     "ICICI Bank",
    "axisbank":  "Axis Bank",
    "axis":      "Axis Bank",
    "yesbank":   "Yes Bank",
    "kotakbank": "Kotak Bank",
    "kotak":     "Kotak Bank",
    "npci":      "NPCI",
    "upi":       "UPI",
    "irctc":     "IRCTC",
    "amazon":    "Amazon Pay",
    "flipkart":  "Flipkart",
}

LEGITIMATE_DOMAINS = {
    "paytm":     ["paytm.com", "paytm.in"],
    "phonepe":   ["phonepe.com"],
    "bhim":      ["bhimupi.org.in", "npci.org.in"],
    "gpay":      ["google.com"],
    "googlepay": ["google.com"],
    "sbi":       ["sbi.co.in", "onlinesbi.com"],
    "hdfcbank":  ["hdfcbank.com"],
    "hdfc":      ["hdfcbank.com"],
    "icicibank": ["icicibank.com"],
    "icici":     ["icicibank.com"],
    "axisbank":  ["axisbank.com"],
    "axis":      ["axisbank.com"],
    "yesbank":   ["yesbank.in"],
    "kotakbank": ["kotak.com"],
    "kotak":     ["kotak.com"],
    "npci":      ["npci.org.in"],
    "upi":       ["npci.org.in"],
    "irctc":     ["irctc.co.in", "irctc.com"],
    "amazon":    ["amazon.in", "amazon.com"],
    "flipkart":  ["flipkart.com"],
}

def extract_domain(value):
    if not value:
        return None
    match = re.search(r"@([\w\.\-]+)", value)
    if match:
        return match.group(1).strip().lower()
    return None

def extract_header(raw, header_name):
    pattern = re.compile(
        rf"^{re.escape(header_name)}\s*:\s*(.+?)(?=\n\S|\Z)",
        re.IGNORECASE | re.MULTILINE | re.DOTALL
    )
    match = pattern.search(raw)
    if match:
        value = match.group(1).strip()
        value = re.sub(r"\n\s+", " ", value)
        return value
    return None

def check_spf(raw):
    spf_header = extract_header(raw, "Received-SPF")
    if spf_header:
        spf_lower = spf_header.lower()
        if "pass" in spf_lower:
            return "PASS"
        if "softfail" in spf_lower:
            return "SOFTFAIL"
        if "fail" in spf_lower:
            return "FAIL"
        if "neutral" in spf_lower:
            return "NEUTRAL"
    auth_header = extract_header(raw, "Authentication-Results")
    if auth_header:
        spf_match = re.search(r"spf\s*=\s*(\w+)", auth_header.lower())
        if spf_match:
            return spf_match.group(1).upper()
    return "NONE"

def check_dkim(raw):
    auth_header = extract_header(raw, "Authentication-Results")
    if auth_header:
        dkim_match = re.search(r"dkim\s*=\s*(\w+)", auth_header.lower())
        if dkim_match:
            return dkim_match.group(1).upper()
    return "NONE"

def check_dmarc(raw):
    auth_header = extract_header(raw, "Authentication-Results")
    if auth_header:
        dmarc_match = re.search(r"dmarc\s*=\s*(\w+)", auth_header.lower())
        if dmarc_match:
            return dmarc_match.group(1).upper()
    return "NONE"

def detect_upi_brand(from_domain, sending_domain):
    if not from_domain:
        return {"targeted_brand": None, "spoofed": False}
    for keyword, brand_name in UPI_BRANDS.items():
        if keyword in from_domain:
            legitimate = LEGITIMATE_DOMAINS.get(keyword, [])
            if sending_domain and any(
                sending_domain == leg or sending_domain.endswith("." + leg)
                for leg in legitimate
            ):
                return {"targeted_brand": brand_name, "spoofed": False}
            else:
                return {"targeted_brand": brand_name, "spoofed": True}
    return {"targeted_brand": None, "spoofed": False}

def analyse_header(raw_header_text):
    from_value     = extract_header(raw_header_text, "From")
    reply_to_value = extract_header(raw_header_text, "Reply-To")
    return_path    = extract_header(raw_header_text, "Return-Path")
    subject        = extract_header(raw_header_text, "Subject") or "Unknown"

    from_domain     = extract_domain(from_value)
    reply_to_domain = extract_domain(reply_to_value)
    return_path_dom = extract_domain(return_path)
    sending_domain  = return_path_dom or reply_to_domain or from_domain

    spf_status   = check_spf(raw_header_text)
    dkim_status  = check_dkim(raw_header_text)
    dmarc_status = check_dmarc(raw_header_text)
    brand_check  = detect_upi_brand(from_domain, sending_domain)

    spoofed        = brand_check["spoofed"]
    targeted_brand = brand_check["targeted_brand"]

    domain_mismatch = (
        from_domain is not None
        and sending_domain is not None
        and from_domain != sending_domain
    )

    risk_score = 0
    if spf_status in ("FAIL", "SOFTFAIL"):
        risk_score += 2
    if dkim_status == "FAIL":
        risk_score += 2
    if dmarc_status == "FAIL":
        risk_score += 2
    if spoofed:
        risk_score += 3
    if domain_mismatch:
        risk_score += 2
    if reply_to_domain and from_domain and reply_to_domain != from_domain:
        risk_score += 1

    # ── Verdict ──
    if risk_score >= 5:
        verdict  = "PHISHING"
        severity = "High"
        if targeted_brand:
            summary = (
                f"This email is impersonating {targeted_brand}. "
                f"The sender address is fake and is designed to steal your UPI PIN, OTP, or banking credentials. "
                f"This is a common scam targeting Indian businesses."
            )
            actions = [
                "Do NOT click any link in this email",
                f"Real {targeted_brand} emails only come from their official domain — this one does not",
                "Do not enter your UPI PIN, OTP, or password anywhere",
                "Delete this email immediately",
                "Warn your team members not to open similar emails",
                f"If you already clicked a link, change your {targeted_brand} password and UPI PIN immediately from the official app"
            ]
        else:
            summary = (
                "This email shows strong signs of phishing. "
                "The sender identity could not be verified and the email is likely trying to steal your login credentials or banking information."
            )
            actions = [
                "Do NOT click any links or download any attachments",
                "Do not reply to this email",
                "Delete this email immediately",
                "Warn your team members not to open similar emails",
                "If you already clicked a link, change your passwords immediately from a different device"
            ]
    elif risk_score >= 2:
        verdict  = "SUSPICIOUS"
        severity = "Medium"
        summary  = (
            "This email has suspicious characteristics. "
            "The sender could not be fully verified. It may be trying to trick you into clicking a link or sharing information."
        )
        actions = [
            "Do not click any links in this email",
            "Verify the sender by calling them directly if you know them",
            "Do not share any passwords, OTPs, or UPI PINs",
            "If in doubt, delete the email"
        ]
    else:
        verdict  = "CLEAN"
        severity = "None"
        summary  = "No phishing indicators found. This email appears to be legitimate."
        actions  = [
            "No action needed",
            "Always stay cautious with emails asking for payments or personal information"
        ]

    return {
        "tool":               "email_analyser",
        "subject":            subject,
        "from_domain":        from_domain,
        "reply_to_domain":    reply_to_domain,
        "sending_domain":     sending_domain,
        "spf_status":         spf_status,
        "dkim_status":        dkim_status,
        "dmarc_status":       dmarc_status,
        "domain_mismatch":    domain_mismatch,
        "spoofed":            spoofed,
        "upi_brand_targeted": targeted_brand,
        "risk_score":         risk_score,
        "verdict":            verdict,
        "severity":           severity,
        "summary":            summary,
        "actions":            actions
    }

TEST_HEADER = """From: support@paytm.com.malicious-login.ru
Reply-To: steal@phishingsite.xyz
Return-Path: <bounce@malicious-login.ru>
Subject: Your Paytm KYC is expiring - Verify Now
Received-SPF: fail (domain of paytm.com.malicious-login.ru does not designate permitted sender)
Authentication-Results: mx.google.com;
   spf=fail smtp.mailfrom=malicious-login.ru;
   dkim=fail header.d=malicious-login.ru;
   dmarc=fail action=none header.from=paytm.com.malicious-login.ru
"""

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            with open(sys.argv[1], "r", encoding="utf-8") as f:
                raw = f.read()
        except FileNotFoundError:
            print(f"File not found: {sys.argv[1]}")
            sys.exit(1)
    else:
        print("No file provided — running built-in phishing test header...\n")
        raw = TEST_HEADER

    result = analyse_header(raw)
    print(json.dumps(result, indent=2))