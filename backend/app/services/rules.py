rules = [

    {
        "name": "Weak Password",

        "condition": lambda data:
        data.password_length < 8,

        "risk": 15,

        "message": "Weak password detected",

        "recommendation":
        "Use passwords with at least 12 characters"
    },

    {
        "name": "Multiple Failed Logins",

        "condition": lambda data:
        data.failed_logins > 5,

        "risk": 20,

        "message":
        "Multiple failed login attempts detected",

        "recommendation":
        "Enable account lockout and MFA"
    },

    {
        "name": "Outdated Software",

        "condition": lambda data:
        data.outdated_software,

        "risk": 25,

        "message":
        "Outdated software detected",

        "recommendation":
        "Update software immediately"
    },

    {
        "name": "Suspicious IP Access",

        "condition": lambda data:
        data.suspicious_ip,

        "risk": 30,

        "message":
        "Suspicious IP activity detected",

        "recommendation":
        "Review login activity"
    },

    {
        "name": "Antivirus Disabled",

        "condition": lambda data:
        not data.antivirus_enabled,

        "risk": 20,

        "message":
        "Antivirus protection disabled",

        "recommendation":
        "Enable antivirus software"
    },

    {
        "name": "Too Many Open Ports",

        "condition": lambda data:
        data.open_ports > 10,

        "risk": 10,

        "message":
        "Too many open ports detected",

        "recommendation":
        "Close unused ports"
    }

]