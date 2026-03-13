import re
from datetime import datetime

import requests
from bs4 import BeautifulSoup


def _extract_visible_text(html: str) -> str:
    """
    Extract visible text from an HTML page, removing script/style content
    and normalising whitespace so that regex patterns work reliably.
    """
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    text = soup.get_text(separator=" ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_deadline_from_page(url: str):
    """
    Backwards-compatible helper used by the existing pipeline.
    Keeps the original deadline behaviour (month-name based pattern).
    """
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        text = _extract_visible_text(r.text)

        deadline_iso = _extract_deadline_from_text(text)
        if deadline_iso:
            return deadline_iso

    except Exception:
        return None

    return None


def _extract_role(text: str) -> str | None:
    """
    Extract a role/position description from page text.
    """
    label_pattern = re.search(
        r"(?:Job Role|Position|Internship Role|Role)[:\-]\s*([^.]+)",
        text,
        re.IGNORECASE,
    )
    if label_pattern:
        return label_pattern.group(1).strip()

    title_pattern = re.search(
        r"\b([A-Z][A-Za-z0-9/&\-\s]+?(?:Internship|Intern))\b",
        text,
    )
    if title_pattern:
        return title_pattern.group(1).strip()

    return None


def _extract_deadline_from_text(text: str) -> str | None:
    """
    Extract a deadline date from page text, supporting both numeric
    formats (DD.MM.YYYY, DD-MM-YYYY, DD/MM/YYYY) and month-name formats
    like 'March 12, 2026' or 'March 12, 11:59 PM IST'.

    If multiple dates exist, prioritise those near relevant keywords.
    Returns an ISO-formatted date (YYYY-MM-DD) or None.
    """
    # Numeric date: 10.03.2026 / 10-03-2026 / 10/03/2026
    num_pattern = re.compile(r"\b(\d{1,2}[./-]\d{1,2}[./-]\d{4})\b")

    # Month name date: March 12, 2026 or March 12
    month_pattern = re.compile(
        r"\b("
        r"January|February|March|April|May|June|July|August|September|October|November|December"
        r")\s+(\d{1,2})(?:,\s*(\d{4}))?",
        re.IGNORECASE,
    )

    def _parse_numeric(date_str: str) -> str | None:
        for fmt in ("%d.%m.%Y", "%d-%m-%Y", "%d/%m/%Y"):
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
        return None

    def _parse_month_name(match: re.Match) -> str | None:
        month_name = match.group(1)
        day = match.group(2)
        year = match.group(3)
        if year is None:
            year = str(datetime.utcnow().year)
        try:
            dt = datetime.strptime(f"{month_name} {day} {year}", "%B %d %Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            return None

    # First, search in windows around relevant keywords
    keyword_pattern = re.compile(
        r"(registration|registrations|deadline|dead\s*line|apply|last\s*date|application\s*deadline)",
        re.IGNORECASE,
    )
    for m in keyword_pattern.finditer(text):
        start = max(0, m.start() - 100)
        end = min(len(text), m.end() + 100)
        window = text[start:end]

        num_match = num_pattern.search(window)
        if num_match:
            parsed = _parse_numeric(num_match.group(1))
            if parsed:
                return parsed

        month_match = month_pattern.search(window)
        if month_match:
            parsed = _parse_month_name(month_match)
            if parsed:
                return parsed

    # Fallback: search whole text if nothing found near keywords
    num_match = num_pattern.search(text)
    if num_match:
        parsed = _parse_numeric(num_match.group(1))
        if parsed:
            return parsed

    month_match = month_pattern.search(text)
    if month_match:
        parsed = _parse_month_name(month_match)
        if parsed:
            return parsed

    return None


def _extract_deadline(text: str) -> str | None:
    """
    Thin wrapper around _extract_deadline_from_text for scrape_opportunity_page.
    """
    return _extract_deadline_from_text(text)


def _extract_stipend(text: str) -> str | None:
    """
    Extract stipend information like '₹5,000 per month' or similar.
    """
    stipend_line = re.search(
        r"(?:Stipend|stipend)[^₹]*?(₹[\d,]+[^.]*?(?:per\s*month|/month)?)",
        text,
    )
    if stipend_line:
        return stipend_line.group(1).strip()

    generic = re.search(
        r"(?:Stipend|stipend)[:\-]\s*([^.]+)",
        text,
        re.IGNORECASE,
    )
    if generic:
        return generic.group(1).strip()

    return None


def _extract_eligibility(text: str) -> str | None:
    """
    Extract eligibility criteria, especially lines with CGPA/GPA/Eligibility.
    """
    pattern = re.search(
        r"(Eligibility[^.]+|CGPA[^.]+|GPA[^.]+)",
        text,
        re.IGNORECASE,
    )
    if pattern:
        return pattern.group(0).strip(" .")
    return None


def _extract_company(text: str) -> str | None:
    """
    Very lightweight heuristic for company/institution name.
    This keeps things generic so it works across many sites.
    """
    label_pattern = re.search(
        r"(?:Company|Organisation|Organization|Institute)[:\-]\s*([A-Za-z0-9 &\-\.,]+)",
        text,
        re.IGNORECASE,
    )
    if label_pattern:
        return label_pattern.group(1).strip()
    return None


def scrape_opportunity_page(url: str) -> dict:
    """
    Fetch and parse an internship opportunity page and extract
    structured fields.

    This function is intentionally defensive: on any failure it
    returns an empty dict so callers can safely merge it with
    parse_message() output without risking crashes.
    """
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
    except Exception:
        return {}

    try:
        text = _extract_visible_text(resp.text)
    except Exception:
        return {}

    data: dict = {
        "company": _extract_company(text),
        "role": _extract_role(text),
        "deadline": _extract_deadline(text),
        "duration": None,  # can be extended later if needed
        "stipend": _extract_stipend(text),
        "eligibility_criteria": _extract_eligibility(text),
        "application_link": url,
        "raw_text": text,
    }

    # Remove keys that are completely empty to keep merging simple,
    # but keep the overall dict structure.
    cleaned = {k: v for k, v in data.items() if v is not None}
    # Ensure raw_text and application_link are always present
    cleaned.setdefault("application_link", url)
    cleaned.setdefault("raw_text", text)
    return cleaned

