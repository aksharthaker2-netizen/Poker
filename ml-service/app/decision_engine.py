RAISE_THRESHOLD = 0.75
FOLD_MARGIN = 0.05


def decide(features: dict, min_raise: float) -> dict:
    strength = features["hand_strength"]
    odds = features["pot_odds"]

    if strength >= RAISE_THRESHOLD:
        return {"action": "raise", "raise_amount": min_raise}

    if strength < odds + FOLD_MARGIN:
        return {"action": "fold", "raise_amount": None}

    return {"action": "call", "raise_amount": None}