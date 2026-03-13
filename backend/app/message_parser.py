import re
from datetime import datetime

import spacy

nlp = spacy.load("en_core_web_sm")


def preprocess_text(text: str) -> str:
    """
    Normalize whitespace so that regex patterns work reliably across
    Telegram/WhatsApp style messages.
    """
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_links(text: str) -> str | None:
    match = re.search(r"https?://\S+", text)
    return match.group() if match else None


def extract_link(text: str) -> str | None:
    """
    Backwards-compatible single-link extractor wrapper.
    """
    return extract_links(text)


def extract_batch(text: str) -> str | None:
    match = re.search(r"\b20\d{2}\b", text)
    return match.group() if match else None


def extract_role(text: str) -> str | None:
    """
    Try to capture a meaningful role/internship title.
    """
    # Common explicit patterns (e.g. "Summer Internship", "Winter Internship")
    role_pattern = re.search(
        r"\b(Summer|Winter|Fall|Spring)\s+Intern(?:ship)?\b", text, re.IGNORECASE
    )
    if role_pattern:
        return role_pattern.group().strip()

    # Generic "... Internship" or "... Intern" phrase
    generic_pattern = re.search(
        r"\b([A-Z][A-Za-z\s]+?(?:Internship|Intern))\b", text
    )
    if generic_pattern:
        return generic_pattern.group(1).strip()

    # Fallback to simple keyword-based roles list (previous behaviour)
    roles = [
        "SDE",
        "Software Engineer",
        "Software Developer",
        "Intern",
        "Internship",
        "Backend Engineer",
        "Frontend Engineer",
        "Full Stack Engineer",
        "Data Engineer",
        "ML Engineer",
    ]
    lower_text = text.lower()
    for role in roles:
        if role.lower() in lower_text:
            return role
    return None


def extract_company(text: str) -> str | None:
    """
    Try several patterns to guess the company / institution.
    """
    # Pattern like "Offered @ IIT-Tirupati" or "at IIT Tirupati"
    at_pattern = re.search(
        r"@\s*([A-Z][A-Za-z\- ]+)|\bat\s+([A-Z][A-Za-z\- ]+)", text
    )
    if at_pattern:
        candidate = at_pattern.group(1) or at_pattern.group(2)
        if candidate:
            # Normalise separating hyphens: "IIT-Tirupati" -> "IIT Tirupati"
            return candidate.strip().replace("-", " ")

    # Explicit label "Company: XYZ"
    label_pattern = re.search(r"Company[:\-]\s*([A-Za-z0-9 &\-.]+)", text)
    if label_pattern:
        return label_pattern.group(1).strip()

    # Fallback to spaCy ORG detection (previous behaviour)
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == "ORG":
            return ent.text

    return None


def _normalize_numeric_date(date_str: str) -> str | None:
    """
    Convert common numeric date formats (e.g. 30-03-2026, 30/03/26)
    into ISO format YYYY-MM-DD. Returns None if parsing fails.
    """
    date_str = date_str.strip()
    # Replace common separators with a dash
    cleaned = re.sub(r"[\/\.]", "-", date_str)

    # Try DD-MM-YYYY and DD-MM-YY
    for fmt in ("%d-%m-%Y", "%d-%m-%y"):
        try:
            dt = datetime.strptime(cleaned, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def extract_deadline(text: str) -> str | None:
    """
    Extract a deadline date only when it appears close to a recognised
    deadline keyword, and normalise it to ISO format (YYYY-MM-DD).

    Supported formats:
    - ISO: YYYY-MM-DD
    - Numeric: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
    - Month names: March 12, 2026 / Mar 12 / March 12, 11:59 PM IST

    Dates that appear only in duration sections (e.g. '15.05.2026 to 14.07.2026')
    are ignored because we always anchor around deadline-related keywords.
    """

    # Keywords that indicate a real application deadline
    keyword_pattern = re.compile(
        r"(Deadline|Dead\s*Line|Last\s*Date|Apply\s*Before|Application\s*Deadline|"
        r"Registrations?\s+open\s+till)",
        re.IGNORECASE,
    )

    iso_pattern = re.compile(r"\b(\d{4}-\d{2}-\d{2})\b")
    numeric_pattern = re.compile(r"\b([0-3]?\d[./-][0-3]?\d[./-]\d{4})\b")
    month_pattern = re.compile(
        r"\b("
        r"January|February|March|April|May|June|July|August|September|October|November|December|"
        r"Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec"
        r")\s+(\d{1,2})(?:,\s*(\d{4}))?",
        re.IGNORECASE,
    )

    def _parse_iso(date_str: str) -> str | None:
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            return None

    def _parse_month(match: re.Match) -> str | None:
        month_name = match.group(1)
        day = match.group(2)
        year = match.group(3)
        if year is None:
            year = str(datetime.utcnow().year)
        try:
            # Use full month name for parsing; datetime can handle abbreviated forms.
            dt = datetime.strptime(f"{month_name} {day} {year}", "%B %d %Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            try:
                dt = datetime.strptime(f"{month_name} {day} {year}", "%b %d %Y")
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                return None

    # Scan around each keyword occurrence and pick the first valid date we find.
    for m in keyword_pattern.finditer(text):
        start = max(0, m.start() - 80)
        end = min(len(text), m.end() + 80)
        window = text[start:end]

        iso_match = iso_pattern.search(window)
        if iso_match:
            parsed = _parse_iso(iso_match.group(1))
            if parsed:
                return parsed

        num_match = numeric_pattern.search(window)
        if num_match:
            parsed = _normalize_numeric_date(num_match.group(1))
            if parsed:
                return parsed

        month_match = month_pattern.search(window)
        if month_match:
            parsed = _parse_month(month_match)
            if parsed:
                return parsed

    # No suitable deadline found near any keyword
    return None


def extract_duration(text: str) -> str | None:
    """
    Extract internship duration text, e.g. '14 May – 13 July 2026'.
    """
    duration_pattern = re.search(
        r"(?:Internship\s*Duration|Duration)[:\-]\s*([^.]+?)(?:\.\s| Stipend| Eligibility| CGPA| GPA|$)",
        text,
        re.IGNORECASE,
    )
    if duration_pattern:
        return duration_pattern.group(1).strip()
    return None


def extract_stipend(text: str) -> str | None:
    """
    Extract stipend information and try to normalise to '<amount>/month'
    when possible.
    """
    stipend_line = re.search(
        r"Stipend[:\-]\s*([^.]+)", text, re.IGNORECASE
    )
    if not stipend_line:
        return None

    raw = stipend_line.group(1).strip()

    # Look for the first numeric amount (with optional commas)
    amount_match = re.search(r"([\d,]+)", raw)
    if not amount_match:
        return raw

    amount = amount_match.group(1).replace(",", "")
    lower_raw = raw.lower()
    if "month" in lower_raw:
        return f"{amount}/month"

    return amount


def extract_criteria(text: str) -> str | None:
    """
    Extract eligibility criteria text, e.g. 'CGPA 7.0 and above'.
    """
    pattern = re.search(
        r"(Eligibility[^.]+|CGPA[^.]+|GPA[^.]+)", text, re.IGNORECASE
    )
    if pattern:
        value = pattern.group(0)
        # Remove leading label words
        value = re.sub(r"^(Eligibility[:\-]?\s*|CGPA[:\-]?\s*|GPA[:\-]?\s*)", "", value, flags=re.IGNORECASE)
        return value.strip(" .")
    return None


def extract_required_skills(text: str) -> list[str]:
    """
    Extract a list of required skills mentioned in the message text.
    Matching is case-insensitive but original canonical names are returned.
    """
    common_skills = [
        "Python",
        "Java",
        "C++",
        "Machine Learning",
        "React",
        "JavaScript",
        "SQL",
        "TensorFlow",
        "Node.js",
    ]

    found: list[str] = []
    lower_text = text.lower()

    for skill in common_skills:
        if skill.lower() in lower_text:
            found.append(skill)

    return found


def calculate_confidence(data: dict) -> float:
    """
    Preserve original confidence behaviour so existing consumers
    are unaffected.
    """
    fields = ["company", "role", "batch", "deadline", "link"]
    score = sum(1 for f in fields if data.get(f))
    return round(score / len(fields), 2)


def parse_message(message: str) -> dict:
    """
    Parse a raw opportunity message into structured fields.
    The returned structure remains backward compatible with the
    existing backend, while adding richer fields.
    """
    text = preprocess_text(message)

    company = extract_company(text)
    role = extract_role(text)
    batch = extract_batch(text)
    deadline = extract_deadline(text)
    link = extract_link(text)
    duration = extract_duration(text)
    stipend = extract_stipend(text)
    eligibility_criteria = extract_criteria(text)
    skills_required = extract_required_skills(text)

    parsed_data: dict = {
        # Existing fields (must remain for compatibility)
        "company": company,
        "role": role,
        "batch": batch,
        "deadline": deadline,
        "link": link,
        "raw_message": message,
        # New richer fields
        "duration": duration,
        "stipend": stipend,
        "eligibility_criteria": eligibility_criteria,
        "application_link": link,
        "skills_required": skills_required,
    }

    parsed_data["confidence"] = calculate_confidence(parsed_data)
    return parsed_data

