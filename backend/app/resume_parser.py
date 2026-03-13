import re
from pdfminer.high_level import extract_text

def parse_resume(file_path):
    text = extract_text(file_path)

    batch_match = re.search(r"20\d{2}", text)
    batch = batch_match.group() if batch_match else None

    skills = []
    common_skills = ["Python", "Java", "C++", "Machine Learning", "React", "SQL"]

    for skill in common_skills:
        if skill.lower() in text.lower():
            skills.append(skill)

    return {
        "batch": batch,
        "skills": skills
    }
