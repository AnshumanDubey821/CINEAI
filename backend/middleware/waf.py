"""
Web Application Firewall (WAF) Middleware for FastAPI
=====================================================
Inspects HTTP requests to block OWASP Top 10 vulnerabilities:
- SQL Injection (SQLi)
- Cross-Site Scripting (XSS)
- Path Traversal / Local File Inclusion (LFI)
- Remote Code Execution (RCE) / Command Injection
- Malicious User-Agents / Scanners
- Enforces OWASP Security Headers
"""
import re
import urllib.parse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request

# ── WAF Regex Patterns for Vulnerability Detection ────────────────────────────

# SQL Injection Patterns
SQLI_PATTERNS = [
    r"(?i)\b(union\s+select|select\s+.*\s+from|insert\s+into|delete\s+from|drop\s+table|truncate\s+table|alter\s+table)\b",
    r"(?i)\b(exec\s*\(|execute\s+immediate|concat\s*\(|char\s*\()\b",
    r"(?i)'\s*or\s*'?1'?\s*=\s*'?1",
    r"(?i)\b(information_schema|sys\.tables|sys\.columns)\b",
    r"--\s*$",
    r";\s*(drop|delete|update|insert)",
]

# Cross-Site Scripting (XSS) Patterns
XSS_PATTERNS = [
    r"(?i)<script\b[^>]*>",
    r"(?i)javascript\s*:",
    r"(?i)\bon\w+\s*=\s*[\"'].*?[\"']",
    r"(?i)<\s*iframe\b",
    r"(?i)<\s*object\b",
    r"(?i)<\s*embed\b",
    r"(?i)document\.cookie",
    r"(?i)window\.location",
    r"(?i)eval\s*\(",
    r"(?i)alert\s*\(",
]

# Path Traversal / LFI Patterns
PATH_TRAVERSAL_PATTERNS = [
    r"\.\./\.\.",
    r"\.\.\\\.\.",
    r"(?i)/etc/passwd",
    r"(?i)/etc/shadow",
    r"(?i)c:\\windows",
    r"(?i)c:/windows",
    r"(?i)\b(boot\.ini|win\.ini)\b",
]

# Command Injection (RCE) Patterns
RCE_PATTERNS = [
    r"(?i);\s*(cat|ls|dir|whoami|id|uname|netstat|powershell|cmd\.exe)\b",
    r"(?i)\|\s*(cat|ls|dir|whoami|id|uname|powershell|cmd\.exe)\b",
    r"(?i)`.*?`",
    r"(?i)\$\(.*?\)",
]

# Malicious Scanner User-Agents
BLOCKED_USER_AGENTS = [
    "sqlmap", "nikto", "nmap", "gobuster", "dirbuster", "wpscan",
    "arachni", "netsparker", "acunetix", "hydra", "metasploit",
]

# Compile regexes for maximum performance
COMPILED_PATTERNS = [
    ("SQL Injection", [re.compile(p) for p in SQLI_PATTERNS]),
    ("Cross-Site Scripting (XSS)", [re.compile(p) for p in XSS_PATTERNS]),
    ("Path Traversal", [re.compile(p) for p in PATH_TRAVERSAL_PATTERNS]),
    ("Command Injection (RCE)", [re.compile(p) for p in RCE_PATTERNS]),
]


class WAFMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        # 1. User-Agent Inspection
        user_agent = request.headers.get("user-agent", "").lower()
        for bot in BLOCKED_USER_AGENTS:
            if bot in user_agent:
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "WAF Blocked Request",
                        "reason": f"Malicious User-Agent detected ({bot})",
                        "status": 403,
                    }
                )

        # 2. Inspect Request URI and Query Parameters
        raw_url = urllib.parse.unquote(str(request.url))
        query_string = urllib.parse.unquote(request.url.query)

        # Check compiled attack patterns against URL & Query
        for attack_type, patterns in COMPILED_PATTERNS:
            for pattern in patterns:
                if pattern.search(raw_url) or pattern.search(query_string):
                    print(f"[WAF Threat Detected] {attack_type} in request: {raw_url}")
                    return JSONResponse(
                        status_code=403,
                        content={
                            "error": "WAF Blocked Request",
                            "reason": f"Security violation detected ({attack_type})",
                            "status": 403,
                        }
                    )

        # 3. Process request & Add OWASP Security Headers
        response = await call_next(request)

        # Enforce Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self' http: https: data: 'unsafe-inline' 'unsafe-eval';"

        return response
