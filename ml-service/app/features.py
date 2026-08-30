from treys import Card, Evaluator
def pot_odds(pot_size: float, to_call: float) -> float:
    if to_call <= 0:
        return 0.0
    return to_call / (pot_size + to_call)
_RANK_VALUE = {
    "A": 10, "K": 8, "Q": 7, "J": 6, "T": 5,
    "9": 4.5, "8": 4, "7": 3.5, "6": 3, "5": 2.5,
    "4": 2, "3": 1.5, "2": 1,
}
def _chen_score(hole_cards: list[str]) -> float:
    r1, s1 = hole_cards[0][0], hole_cards[0][1]
    r2, s2 = hole_cards[1][0], hole_cards[1][1]

    high_rank = r1 if _RANK_VALUE[r1] >= _RANK_VALUE[r2] else r2
    score = _RANK_VALUE[high_rank]

    if r1 == r2:
        score = max(score * 2, 5) #if it is a pair then double the initial score or dont give them below 5
        if s1 == s2:
            score += 2

    if r1 != r2:
        _RANK_ORDER = "23456789TJQKA"
        gap = abs(_RANK_ORDER.index(r1) - _RANK_ORDER.index(r2)) - 1
        if gap == 0:
            score += 1
        elif gap == 1:
            score += 0.5
        elif gap >= 4:
            score -= 2

    score = max(score, 0)
    return min(score / 20.0, 1.0)

_evaluator = Evaluator()

def _postflop_strength(hole_cards: list[str], community_cards: list[str]) -> float:
    hand = [Card.new(c) for c in hole_cards]
    board = [Card.new(c) for c in community_cards]
    rank = _evaluator.evaluate(board, hand)
    percentage = _evaluator.get_five_card_rank_percentage(rank)
    return 1.0 - percentage

def hand_strength(hole_cards, community_cards) -> float:
    if not community_cards:
        return _chen_score(hole_cards)
    return _postflop_strength(hole_cards, community_cards)


def build_feature_vector(hole_cards, community_cards, pot_size, to_call) -> dict:
    return {
        "hand_strength": hand_strength(hole_cards, community_cards),
        "pot_odds": pot_odds(pot_size, to_call),
    }

def board_texture(cards):
    ranks = [c[0] for c in cards]
    suits = [c[1] for c in cards]
    is_paired = int(len(ranks) != len(set(ranks)))
    suit_counts = {s: suits.count(s) for s in set(suits)}
    flush_possible = int(max(suit_counts.values()) >= 3)
    return is_paired, flush_possible


_RANK_TO_NUM = {r: i for i, r in enumerate("23456789TJQKA", start=2)}


def straight_possible(cards):
    nums = sorted(set(_RANK_TO_NUM[c[0]] for c in cards))
    if len(nums) < 2:
        return 0
    return int(nums[-1] - nums[0] <= 4)

def map_position_label(position):
    mapping = {
        "button": "BTN",
        "late": "CO",
        "middle": "HJ",
        "early": "UTG",
        "blinds": "BB",
    }
    return mapping.get(position, position)

import numpy as np


def add_equity_noise(hand_strength, noise_level):
    if noise_level <= 0:
        return hand_strength
    noise = np.random.normal(0, noise_level)
    noisy_strength = hand_strength + noise
    return max(0.0, min(1.0, noisy_strength))

def determine_aggressor_from_history(action_history, hero_seat_label="bot_seat"):
    last_raiser = None
    for action_str in action_history:
        parts = action_str.split(":")
        if len(parts) >= 2 and parts[1] == "raise":
            last_raiser = parts[0]
    return last_raiser == hero_seat_label

def determine_is_in_position(mapped_position):
    return mapped_position in ("BTN", "CO", "BB")