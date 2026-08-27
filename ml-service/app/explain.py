"""
explain.py
----------
Turns a decision + the numbers behind it into a short, human-readable reason.
Template-based, per the plan doc — picks the most relevant explanation for
the situation rather than generating free-form text.
"""

def generate_reason(action, hand_strength, pot_odds_or_facing_bet, is_preflop, to_call):
    if action == "fold":
        if to_call > 0 and hand_strength < 0.3:
            return "Your hand is too weak to continue against this bet."
        return "The price to continue isn't favorable enough for a hand this weak."

    if action == "raise":
        if hand_strength > 0.7:
            return "You have a very strong hand — raising builds the pot while you're ahead."
        return "Your hand is strong enough, and the situation favors, applying pressure here."

    if action == "call":
        if to_call == 0:
            return "There's nothing to call — checking keeps the pot small with a moderate hand."
        if pot_odds_or_facing_bet < 0.2:
            return "The pot odds are good enough to continue even with a moderate hand."
        return "Your hand is strong enough to continue, but not strong enough to raise."

    return "This is a reasonable, low-risk option given the situation."