import subprocess
import xml.etree.ElementTree as ET
import json

HIGH_RISK_PORTS = {
    "21":   {"service": "FTP",      "risk": "High",     "reason": "Unencrypted file transfer, commonly exploited"},
    "22":   {"service": "SSH",      "risk": "High",     "reason": "Remote access exposed, restrict to trusted IPs"},
    "23":   {"service": "Telnet",   "risk": "Critical", "reason": "Unencrypted remote access, attackers can intercept everything"},
    "80":   {"service": "HTTP",     "risk": "Medium",   "reason": "Website has no encryption, visitor data is exposed"},
    "443":  {"service": "HTTPS",    "risk": "Low",      "reason": "Encrypted web traffic, generally safe"},
    "445":  {"service": "SMB",      "risk": "Critical", "reason": "Used by ransomware like WannaCry to spread across networks"},
    "3306": {"service": "MySQL",    "risk": "Critical", "reason": "Database exposed to internet, severe data breach risk"},
    "3389": {"service": "RDP",      "risk": "Critical", "reason": "Remote desktop exposed, common ransomware entry point"},
    "8080": {"service": "HTTP-Alt", "risk": "Medium",   "reason": "Alternative web port, often misconfigured"},
}

def get_summary_and_actions(ports):
    critical_ports = [p for p in ports if p["risk"] == "Critical"]
    high_ports = [p for p in ports if p["risk"] == "High"]

    if critical_ports:
        names = ", ".join([p["service"] for p in critical_ports])
        summary = f"Your network has critically exposed services ({names}) that attackers can use to break in or deploy ransomware. Immediate action is required."
        actions = [
            f"Close or restrict port {p['port']} ({p['service']}) immediately" for p in critical_ports
        ] + [
            "Contact your IT support to apply a firewall rule blocking these ports from the internet",
            "Check if any unknown devices have connected to your network recently"
        ]
    elif high_ports:
        names = ", ".join([p["service"] for p in high_ports])
        summary = f"Your network has high-risk services exposed ({names}). These should be restricted to trusted users only."
        actions = [
            f"Restrict port {p['port']} ({p['service']}) to trusted IP addresses only" for p in high_ports
        ] + [
            "Enable firewall rules to block public access to these ports"
        ]
    elif ports:
        summary = "Your network has some open ports. They are low to medium risk but should be reviewed regularly."
        actions = [
            "Review all open ports listed below",
            "Close any ports for services you are not actively using",
            "Run this scan monthly to monitor your network"
        ]
    else:
        summary = "No open ports were detected. Your network appears to be well protected."
        actions = ["No action needed. Run this scan monthly to stay protected."]

    return summary, actions

def scan(target):
    print(f"Scanning {target}, please wait...")
    
    try:
        cmd = ["nmap", "-sV", "--open", "-oX", "-", target]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            root = ET.fromstring(result.stdout)
            open_ports = []
            for host in root.findall("host"):
                for port in host.findall(".//port"):
                    port_id = port.get("portid")
                    protocol = port.get("protocol")
                    state = port.find("state").get("state")
                    if state != "open":
                        continue
                    service_el = port.find("service")
                    service_name = service_el.get("name", "unknown") if service_el is not None else "unknown"
                    if port_id in HIGH_RISK_PORTS:
                        info = HIGH_RISK_PORTS[port_id]
                        risk = info["risk"]
                        reason = info["reason"]
                        service_name = info["service"]
                    else:
                        risk = "Low"
                        reason = "No known high-risk association"
                    open_ports.append({
                        "port": int(port_id),
                        "protocol": protocol,
                        "service": service_name,
                        "state": state,
                        "risk": risk,
                        "reason": reason
                    })
            summary, actions = get_summary_and_actions(open_ports)
            severity = "Critical" if any(p["risk"] == "Critical" for p in open_ports) else "High" if any(p["risk"] == "High" for p in open_ports) else "Medium" if any(p["risk"] == "Medium" for p in open_ports) else "Low" if any(p["risk"] == "Low" for p in open_ports) else "None"
            verdict = "DANGEROUS" if severity in ("Critical", "High") else "SUSPICIOUS" if severity == "Medium" else "CLEAN"
            return {
                "tool": "nmap",
                "verdict": verdict,
                "severity": severity,
                "summary": summary,
                "actions": actions,
                "raw_ports": open_ports
            }
    except Exception as e:
        print(f"Nmap CLI failed: {e}. Falling back to socket-based scanner.")

    import socket
    open_ports = []
    
    try:
        ip = socket.gethostbyname(target)
    except Exception as e:
        return {
            "tool": "nmap_socket_fallback",
            "verdict": "ERROR",
            "severity": "None",
            "summary": f"Could not resolve target: {target}",
            "actions": ["Verify that target hostname is spelt correctly and reachable."]
        }

    ports_to_scan = [21, 22, 23, 80, 443, 445, 3306, 3389, 8080]
    for port in ports_to_scan:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        result = s.connect_ex((ip, port))
        if result == 0:
            port_id_str = str(port)
            if port_id_str in HIGH_RISK_PORTS:
                info = HIGH_RISK_PORTS[port_id_str]
                risk = info["risk"]
                reason = info["reason"]
                service_name = info["service"]
            else:
                risk = "Low"
                reason = "No known high-risk association"
                service_name = "unknown"
            open_ports.append({
                "port": port,
                "protocol": "tcp",
                "service": service_name,
                "state": "open",
                "risk": risk,
                "reason": reason
            })
        s.close()

    summary, actions = get_summary_and_actions(open_ports)
    severity = "Critical" if any(p["risk"] == "Critical" for p in open_ports) else "High" if any(p["risk"] == "High" for p in open_ports) else "Medium" if any(p["risk"] == "Medium" for p in open_ports) else "Low" if any(p["risk"] == "Low" for p in open_ports) else "None"
    verdict = "DANGEROUS" if severity in ("Critical", "High") else "SUSPICIOUS" if severity == "Medium" else "CLEAN"
    return {
        "tool": "nmap_socket_fallback",
        "verdict": verdict,
        "severity": severity,
        "summary": summary,
        "actions": actions,
        "raw_ports": open_ports
    }

if __name__ == "__main__":
    target = "scanme.nmap.org"
    output = scan(target)
    print(output)