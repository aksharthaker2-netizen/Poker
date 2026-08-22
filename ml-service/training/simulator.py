import random

RANKS = "23456789TJQKA"
SUITS = "shdc"


def new_shuffled_deck():
    deck = [r + s for r in RANKS for s in SUITS]
    random.shuffle(deck)
    return deck


def deal_hand():
    deck = new_shuffled_deck()
    hero_hole = [deck.pop(), deck.pop()]
    villain_hole = [deck.pop(), deck.pop()]
    board = [deck.pop() for _ in range(5)]
    return hero_hole, villain_hole, board

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
import features
import decision_engine
import predictor


def xgboost_bot_decide(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets, position="BTN"):
    if not community_cards:
        action = predictor.predict_preflop_action(
            hand_strength=features.hand_strength(hole_cards, []),
            num_bets=num_bets,
            pot_size=pot_size,
            num_players=2,
            position=position,
        )
        return action, (min_raise if action == "raise" else None)

    feats = features.build_feature_vector(hole_cards, community_cards, pot_size, to_call)
    result = decision_engine.decide(feats, min_raise)
    return result["action"], result["raise_amount"]


def heuristic_bot_decide(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets=0):
    feats = features.build_feature_vector(hole_cards, community_cards, pot_size, to_call)
    result = decision_engine.decide(feats, min_raise)
    return result["action"], result["raise_amount"]

def run_betting_street(hero_hole, villain_hole, board, pot, hero_stack, villain_stack,
                        hero_decide_fn, villain_decide_fn, num_bets, min_raise):
    to_call = 0
    hero_action, hero_raise = hero_decide_fn(hero_hole, board, pot, to_call, min_raise, num_bets)
    if hero_action == "fold":
        return "villain", pot, hero_stack, villain_stack
    if hero_action == "raise":
        bet = min(hero_raise, hero_stack)
        pot += bet
        hero_stack -= bet
        villain_action, _ = villain_decide_fn(villain_hole, board, pot, bet, min_raise, num_bets + 1)
        if villain_action == "fold":
            return "hero", pot, hero_stack, villain_stack
        call_amount = min(bet, villain_stack)
        pot += call_amount
        villain_stack -= call_amount
        return None, pot, hero_stack, villain_stack

    villain_action, villain_raise = villain_decide_fn(villain_hole, board, pot, to_call, min_raise, num_bets)
    if villain_action == "fold":
        return "hero", pot, hero_stack, villain_stack
    if villain_action == "raise":
        bet = min(villain_raise, villain_stack)
        pot += bet
        villain_stack -= bet
        hero_action2, _ = hero_decide_fn(hero_hole, board, pot, bet, min_raise, num_bets + 1)
        if hero_action2 == "fold":
            return "villain", pot, hero_stack, villain_stack
        call_amount = min(bet, hero_stack)
        pot += call_amount
        hero_stack -= call_amount
    return None, pot, hero_stack, villain_stack

