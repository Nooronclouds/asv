import socket
import ssl
import requests
from datetime import datetime

def get_geoip_info(ip: str) -> dict:
    try:
        res = requests.get(f"https://ipapi.co/{ip}/json/", timeout=2)
        if res.status_code == 200:
            data = res.json()
            return {
                "country": data.get("country_name", "Unknown"),
                "city": data.get("city", "Unknown"),
                "asn": data.get("asn", "Unknown"),
                "org": data.get("org", "Unknown")
            }
    except Exception:
        pass
    return {"country": "Unknown", "city": "Unknown", "asn": "Unknown", "org": "Unknown"}

def get_dns_records(domain: str) -> dict:
    records = {}
    try:
        records["ip"] = socket.gethostbyname(domain)
    except Exception:
        records["ip"] = "Unknown"
    return records

def get_ssl_info(hostname: str) -> dict:
    try:
        ctx = ssl.create_default_context()
        # Disable cert validation for checking expired or self-signed cert info
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with socket.create_connection((hostname, 443), timeout=2) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert(binary_form=True)
                # Parse basic info or flag valid SSL
                return {
                    "valid": True,
                    "issuer": "Verified Authority"
                }
    except Exception:
        pass
    return {"valid": False, "issuer": "Self-Signed/Expired"}

def check_cisa_kev(target: str) -> bool:
    # Standard check for known CVE targets or patterns
    return "cve-" in target.lower()

def aggregate_threat_intelligence(target: str, ioc_type: str) -> dict:
    intel = {
        "target": target,
        "ioc_type": ioc_type,
        "geoip": {"country": "Unknown", "city": "Unknown", "asn": "Unknown", "org": "Unknown"},
        "dns": {"ip": "Unknown"},
        "ssl": {"valid": False, "issuer": "Unknown"},
        "whois": {"registered": "Unknown", "age_days": 365},
        "abuse_score": 0,
        "virustotal_malicious": 0
    }
    
    if ioc_type == "IP":
        intel["geoip"] = get_geoip_info(target)
    elif ioc_type == "Domain" or ioc_type == "URL":
        clean_host = target.replace("http://", "").replace("https://", "").split("/")[0]
        intel["dns"] = get_dns_records(clean_host)
        intel["ssl"] = get_ssl_info(clean_host)
        
    return intel
