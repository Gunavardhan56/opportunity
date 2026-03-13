def check_eligibility(user, opportunity):
    """
    Determine eligibility based primarily on skill overlap.

    - Uses opportunity["skills_required"] when available.
    - Falls back to existing batch/skills logic when no required skills
      are present to preserve previous behaviour.
    """
    user_skills = user.get("skills") or []
    required_skills = (
        opportunity.get("skills_required")
        or opportunity.get("skills")
        or []
    )

    # Skill-based eligibility when we have explicit requirements.
    if required_skills:
        if not user_skills:
            return {"eligible": None, "score": 0}

        user_set = {s.lower() for s in user_skills}
        req_set = {s.lower() for s in required_skills}

        if not req_set:
            return {"eligible": None, "score": 0}

        matches = user_set & req_set
        score = len(matches) / len(req_set)

        return {"eligible": score > 0, "score": round(score, 2)}

    # Fallback to previous batch/skills logic when no required skills exist.
    score = 0
    total = 0

    if opportunity.get("batch"):
        total += 1
        if user.get("batch") == opportunity.get("batch"):
            score += 1

    if opportunity.get("skills") and user.get("skills"):
        total += 1
        if any(skill in user["skills"] for skill in opportunity["skills"]):
            score += 1

    if total == 0:
        return {"eligible": None, "score": 0}

    match_score = score / total
    return {
        "eligible": match_score >= 0.5,
        "score": round(match_score, 2),
    }
