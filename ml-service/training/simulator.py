import random
random.seed(42)
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


def xgboost_bot_decide(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets, position, big_blind=10):
    if not community_cards:
        is_fresh_headsup_open = (to_call == 0 and num_bets <= 1)
        if is_fresh_headsup_open:
            strength = features.hand_strength(hole_cards, [])
            return predictor.predict_headsup_opening_action(strength, min_raise)

        pot_size_bb = pot_size / big_blind
        action = predictor.predict_preflop_action(
            hand_strength=features.hand_strength(hole_cards, []),
            num_bets=num_bets,
            pot_size=pot_size_bb,
            num_players=2,
            position=position,
        )
        return action, (min_raise if action == "raise" else None)

    street_map = {3: "Flop", 4: "Turn", 5: "River"}
    street = street_map.get(len(community_cards), "Flop")
    return predictor.predict_postflop_action(
        hole_cards, community_cards, pot_size, to_call, min_raise,
        num_prior_bets=num_bets, is_hero_aggressor=False, street=street, hero_is_ip=False,
    )


def heuristic_bot_decide(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets=0, position=None, big_blind=10):
    feats = features.build_feature_vector(hole_cards, community_cards, pot_size, to_call)
    result = decision_engine.decide(feats, min_raise)
    return result["action"], result["raise_amount"]

def run_betting_street(hero_hole, villain_hole, board, pot, hero_stack, villain_stack,
                        hero_decide_fn, villain_decide_fn, num_bets, min_raise,
                        hero_position, villain_position, big_blind):
    to_call = 0
    hero_action, hero_raise = hero_decide_fn(hero_hole, board, pot, to_call, min_raise, num_bets, hero_position, big_blind)
    if hero_action == "fold":
        return "villain", pot, hero_stack, villain_stack
    if hero_action == "raise":
        bet = min(hero_raise, hero_stack)
        pot += bet
        hero_stack -= bet
        villain_action, _ = villain_decide_fn(villain_hole, board, pot, bet, min_raise, num_bets + 1, villain_position, big_blind)
        if villain_action == "fold":
            return "hero", pot, hero_stack, villain_stack
        call_amount = min(bet, villain_stack)
        pot += call_amount
        villain_stack -= call_amount
        return None, pot, hero_stack, villain_stack

    villain_action, villain_raise = villain_decide_fn(villain_hole, board, pot, to_call, min_raise, num_bets, villain_position, big_blind)
    if villain_action == "fold":
        return "hero", pot, hero_stack, villain_stack
    if villain_action == "raise":
        bet = min(villain_raise, villain_stack)
        pot += bet
        villain_stack -= bet
        hero_action2, _ = hero_decide_fn(hero_hole, board, pot, bet, min_raise, num_bets + 1, hero_position, big_blind)
        if hero_action2 == "fold":
            return "villain", pot, hero_stack, villain_stack
        call_amount = min(bet, hero_stack)
        pot += call_amount
        hero_stack -= call_amount
    return None, pot, hero_stack, villain_stack

from treys import Card, Evaluator

_showdown_evaluator = Evaluator()


def resolve_showdown(hero_hole, villain_hole, board):
    hero_cards = [Card.new(c) for c in hero_hole]
    villain_cards = [Card.new(c) for c in villain_hole]
    board_cards = [Card.new(c) for c in board]

    hero_rank = _showdown_evaluator.evaluate(board_cards, hero_cards)
    villain_rank = _showdown_evaluator.evaluate(board_cards, villain_cards)

    if hero_rank < villain_rank:
        return "hero"
    elif villain_rank < hero_rank:
        return "villain"
    else:
        return "split"

def play_one_hand(hero_decide_fn, villain_decide_fn, starting_stack=1000, small_blind=5, big_blind=10):
    hero_hole, villain_hole, board = deal_hand()

    hero_stack = starting_stack - small_blind
    villain_stack = starting_stack - big_blind
    pot = small_blind + big_blind
    num_bets = 1

    streets = [
        ("preflop", []),
        ("flop", board[0:3]),
        ("turn", board[0:4]),
        ("river", board[0:5]),
    ]

    for street_name, visible_board in streets:
        winner, pot, hero_stack, villain_stack = run_betting_street(
            hero_hole, villain_hole, visible_board, pot,
            hero_stack, villain_stack,
            hero_decide_fn, villain_decide_fn,
            num_bets, min_raise=big_blind * 2,
            hero_position="SB", villain_position="BB",
            big_blind=big_blind,
        )
        if winner is not None:
            if winner == "hero":
                hero_stack += pot
            else:
                villain_stack += pot
            outcome = "hero_folded" if winner == "villain" else "villain_folded"
            return hero_stack - starting_stack, villain_stack - starting_stack, outcome
        num_bets = 0

    showdown_result = resolve_showdown(hero_hole, villain_hole, board)
    if showdown_result == "hero":
        hero_stack += pot
    elif showdown_result == "villain":
        villain_stack += pot
    else:
        hero_half = pot // 2
        villain_half = pot - hero_half
        hero_stack += hero_half
        villain_stack += villain_half

    hero_profit = hero_stack - starting_stack
    villain_profit = villain_stack - starting_stack
    return hero_profit, villain_profit, "showdown"

def play_hand_and_log_opening(villain_decide_fn=xgboost_bot_decide, explore_rate=0.6, big_blind=10):
    log_entry = {}

    def logging_hero_fn(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets, position, big_blind=big_blind):
        is_opening = (not community_cards) and (to_call == 0)
        if is_opening:
            strength = features.hand_strength(hole_cards, [])
            if random.random() < explore_rate:
                action = random.choice(["fold", "call", "raise"])
            else:
                action = xgboost_bot_decide(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets, position, big_blind)[0]
            log_entry["hand_strength"] = strength
            log_entry["action"] = action
            raise_amount = min_raise if action == "raise" else None
            return action, raise_amount
        else:
            return xgboost_bot_decide(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets, position, big_blind)

    hero_profit, villain_profit, outcome = play_one_hand(logging_hero_fn, villain_decide_fn, big_blind=big_blind)
    log_entry["hero_profit"] = hero_profit
    return log_entry