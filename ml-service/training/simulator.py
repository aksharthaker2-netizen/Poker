import random
random.seed(42)
RANKS = "23456789TJQKA"
SUITS = "shdc"
from treys import Card, Evaluator
_showdown_evaluator = Evaluator()


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


def xgboost_bot_decide(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets, position, big_blind=10, is_ip=False, is_aggressor=False):
    if not community_cards:
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
        num_prior_bets=num_bets, is_hero_aggressor=is_aggressor, street=street, hero_is_ip=is_ip,
    )

def heuristic_bot_decide(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets=0, position=None, big_blind=10, is_ip=False, is_aggressor=False):
    feats = features.build_feature_vector(hole_cards, community_cards, pot_size, to_call)
    result = decision_engine.decide(feats, min_raise)
    return result["action"], result["raise_amount"]

def run_betting_street(hero_hole, villain_hole, board, pot, hero_stack, villain_stack,
                        hero_decide_fn, villain_decide_fn, num_bets, min_raise,
                        hero_position, villain_position, big_blind, hero_acts_first=True, aggressor=None):
    to_call = 0

    if hero_acts_first:
        first_fn, first_hole, first_pos = hero_decide_fn, hero_hole, hero_position
        second_fn, second_hole, second_pos = villain_decide_fn, villain_hole, villain_position
    else:
        first_fn, first_hole, first_pos = villain_decide_fn, villain_hole, villain_position
        second_fn, second_hole, second_pos = hero_decide_fn, hero_hole, hero_position

    first_action, first_raise = first_fn(
        first_hole, board, pot, to_call, min_raise, num_bets, first_pos, big_blind,
        is_ip=(first_pos == "BB"), is_aggressor=(aggressor == first_pos),
    )

    if first_action == "fold":
        winner = "villain" if hero_acts_first else "hero"
        return winner, pot, hero_stack, villain_stack, aggressor

    if first_action == "raise":
        bet = min(first_raise, (hero_stack if hero_acts_first else villain_stack))
        pot += bet
        if hero_acts_first:
            hero_stack -= bet
        else:
            villain_stack -= bet
        new_aggressor = first_pos

        second_action, _ = second_fn(
            second_hole, board, pot, bet, min_raise, num_bets + 1, second_pos, big_blind,
            is_ip=(second_pos == "BB"), is_aggressor=(new_aggressor == second_pos),
        )
        if second_action == "fold":
            winner = "hero" if hero_acts_first else "villain"
            return winner, pot, hero_stack, villain_stack, new_aggressor
        call_amount = min(bet, (villain_stack if hero_acts_first else hero_stack))
        pot += call_amount
        if hero_acts_first:
            villain_stack -= call_amount
        else:
            hero_stack -= call_amount
        return None, pot, hero_stack, villain_stack, new_aggressor

    second_action, second_raise = second_fn(
        second_hole, board, pot, to_call, min_raise, num_bets, second_pos, big_blind,
        is_ip=(second_pos == "BB"), is_aggressor=(aggressor == second_pos),
    )
    if second_action == "fold":
        winner = "hero" if hero_acts_first else "villain"
        return winner, pot, hero_stack, villain_stack, aggressor
    if second_action == "raise":
        bet = min(second_raise, (villain_stack if hero_acts_first else hero_stack))
        pot += bet
        if hero_acts_first:
            villain_stack -= bet
        else:
            hero_stack -= bet
        new_aggressor = second_pos

        third_action, _ = first_fn(
            first_hole, board, pot, bet, min_raise, num_bets + 1, first_pos, big_blind,
            is_ip=(first_pos == "BB"), is_aggressor=(new_aggressor == first_pos),
        )
        if third_action == "fold":
            winner = "villain" if hero_acts_first else "hero"
            return winner, pot, hero_stack, villain_stack, new_aggressor
        call_amount = min(bet, (hero_stack if hero_acts_first else villain_stack))
        pot += call_amount
        if hero_acts_first:
            hero_stack -= call_amount
        else:
            villain_stack -= call_amount
        return None, pot, hero_stack, villain_stack, new_aggressor

    return None, pot, hero_stack, villain_stack, aggressor
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

    aggressor = None
    for street_name, visible_board in streets:
        winner, pot, hero_stack, villain_stack, aggressor = run_betting_street(
            hero_hole, villain_hole, visible_board, pot,
            hero_stack, villain_stack,
            hero_decide_fn, villain_decide_fn,
            num_bets, min_raise=big_blind * 2,
            hero_position="SB", villain_position="BB",
            big_blind=big_blind,
            hero_acts_first=(street_name == "preflop"),
            aggressor=aggressor,
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

def play_hand_and_log_postflop(villain_decide_fn=xgboost_bot_decide, explore_rate=0.5, big_blind=10):
    logs = []

    def logging_hero_fn(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets, position, big_blind=big_blind):
        if not community_cards:
            return xgboost_bot_decide(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets, position, big_blind)

        strength = features.hand_strength(hole_cards, community_cards)
        facing_bet_to_pot = (to_call / pot_size) if pot_size > 0 else 0
        street_map = {3: "Flop", 4: "Turn", 5: "River"}
        street = street_map.get(len(community_cards), "Flop")

        if random.random() < explore_rate:
            action = random.choice(["fold", "call", "raise"])
        else:
            action, _ = predictor.predict_postflop_action(
                hole_cards, community_cards, pot_size, to_call, min_raise,
                num_prior_bets=num_bets, is_hero_aggressor=False, street=street, hero_is_ip=False,
            )
        raise_amount = min_raise if action == "raise" else None

        logs.append({
            "hand_strength": strength,
            "facing_bet_to_pot": facing_bet_to_pot,
            "facing_a_bet": to_call > 0,
            "street": street,
            "action": action,
        })
        return action, raise_amount

    hero_profit, villain_profit, outcome = play_one_hand(logging_hero_fn, villain_decide_fn, big_blind=big_blind)
    for entry in logs:
        entry["hero_profit"] = hero_profit
    return logs

def play_hand_full_log(opponent_pool, explore_rate=0.7, big_blind=10):
    logs = []
    villain_fn = random.choice(opponent_pool)

    def logging_hero_fn(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets, position, big_blind=big_blind):
        pot_size_bb = pot_size / big_blind
        to_call_bb = to_call / big_blind

        if not community_cards:
            strength = features.hand_strength(hole_cards, [])
            situation = {
                "phase": "preflop",
                "hand_strength": strength,
                "num_bets": num_bets,
                "pot_size_bb": pot_size_bb,
                "to_call_bb": to_call_bb,
            }
        else:
            strength = features.hand_strength(hole_cards, community_cards)
            is_paired, flush_possible = features.board_texture(community_cards)
            straight_poss = features.straight_possible(community_cards)
            street_map = {3: "Flop", 4: "Turn", 5: "River"}
            situation = {
                "phase": "postflop",
                "hand_strength": strength,
                "num_bets": num_bets,
                "pot_size_bb": pot_size_bb,
                "to_call_bb": to_call_bb,
                "street": street_map.get(len(community_cards), "Flop"),
                "board_paired": is_paired,
                "board_flush_possible": flush_possible,
                "board_straight_possible": straight_poss,
            }

        if random.random() < explore_rate:
            action = random.choice(["fold", "call", "raise"])
        else:
            action, _ = xgboost_bot_decide(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets, position, big_blind)

        situation["action"] = action
        logs.append(situation)
        raise_amount = min_raise if action == "raise" else None
        return action, raise_amount

    hero_profit, villain_profit, outcome = play_one_hand(logging_hero_fn, villain_fn, big_blind=big_blind)
    for entry in logs:
        entry["hero_profit"] = hero_profit
    return logs

def deal_multiway_hand(num_players):
    deck = new_shuffled_deck()
    hole_cards = [[deck.pop(), deck.pop()] for _ in range(num_players)]
    board = [deck.pop() for _ in range(5)]
    return hole_cards, board

def run_multiway_street(hole_cards_list, board, pot, stacks, folded, decide_fns, positions,
                         acting_order, committed, min_raise, num_bets):
    last_raiser = None
    idx = 0
    order = [p for p in acting_order if not folded[p]]
    all_in = {i: (stacks[i] <= 0) for i in range(len(hole_cards_list))}
    while True:
        active = [p for p in range(len(hole_cards_list)) if not folded[p]]
        if len(active) == 1:
            return active[0], pot, stacks, folded, committed

        remaining_to_act = [p for p in active if not all_in[p]]
        if not remaining_to_act:
            break

        if idx >= len(order):
            idx = 0
        player = order[idx]
        if folded[player] or all_in[player]:
            idx += 1
            continue
        if player == last_raiser:
            break

        to_call = max(committed.values()) - committed[player]
        action, raise_amt = decide_fns[player](
            hole_cards_list[player], board, pot, to_call, min_raise, num_bets, positions[player]
        )

        if action == "fold":
            folded[player] = True
        elif action == "raise":
            current_max = max(committed.values())
            intended_bet = max(raise_amt, current_max + min_raise)
            bet = min(intended_bet, stacks[player] + committed[player])
            if bet <= current_max:
                call_amt = min(current_max - committed[player], stacks[player])
                pot += call_amt
                stacks[player] -= call_amt
                committed[player] += call_amt
            else:
                extra = bet - committed[player]
                pot += extra
                stacks[player] -= extra
                committed[player] = bet
                last_raiser = player
                num_bets += 1
        else:
            call_amt = min(to_call, stacks[player])
            pot += call_amt
            stacks[player] -= call_amt
            committed[player] += call_amt

        if stacks[player] <= 0:
            all_in[player] = True

        idx += 1
        if last_raiser is None and idx >= len(order):
            break

    return None, pot, stacks, folded, committed

def resolve_multiway_showdown(hole_cards_list, board, still_in):
    best_rank = None
    winners = []
    for i in still_in:
        cards = [Card.new(c) for c in hole_cards_list[i]]
        board_cards = [Card.new(c) for c in board]
        rank = _showdown_evaluator.evaluate(board_cards, cards)
        if best_rank is None or rank < best_rank:
            best_rank = rank
            winners = [i]
        elif rank == best_rank:
            winners.append(i)
    return winners

def play_multiway_hand(decide_fns, num_players, starting_stack=1000, small_blind=5, big_blind=10, sb_seat=None):
    hole_cards, board = deal_multiway_hand(num_players)
    stacks = [starting_stack] * num_players
    folded = [False] * num_players

    if sb_seat is None:
        sb_seat = num_players - 2
    bb_seat = (sb_seat + 1) % num_players

    positions = ["UTG"] * num_players
    positions[sb_seat] = "SB"
    positions[bb_seat] = "BB"
    other_labels = ["HJ", "CO", "BTN"]
    label_idx = 0
    for i in range(num_players):
        if positions[i] == "UTG" and i != sb_seat and i != bb_seat:
            if label_idx < len(other_labels):
                positions[i] = other_labels[label_idx]
                label_idx += 1

    committed = {i: 0 for i in range(num_players)}
    committed[sb_seat] = small_blind
    committed[bb_seat] = big_blind
    stacks[sb_seat] -= small_blind
    stacks[bb_seat] -= big_blind
    pot = small_blind + big_blind
    num_bets = 1

    streets = [("preflop", []), ("flop", board[0:3]), ("turn", board[0:4]), ("river", board[0:5])]

    for street_name, visible_board in streets:
        active_players = [i for i in range(num_players) if not folded[i]]
        if len(active_players) == 1:
            break

        if street_name == "preflop":
            street_order = [(bb_seat + 1 + i) % num_players for i in range(num_players)]
        else:
            street_order = [(sb_seat + i) % num_players for i in range(num_players)]

        street_committed = {i: (committed[i] if street_name == "preflop" else 0) for i in range(num_players)}
        winner, pot, stacks, folded, _ = run_multiway_street(
            hole_cards, visible_board, pot, stacks, folded, decide_fns, positions,
            street_order, street_committed, min_raise=big_blind * 2, num_bets=num_bets,
        )
        num_bets = 0
        if winner is not None:
            stacks[winner] += pot
            profits = [stacks[i] - starting_stack for i in range(num_players)]
            return profits, "folded_out"

    still_in = [i for i in range(num_players) if not folded[i]]
    if len(still_in) == 1:
        stacks[still_in[0]] += pot
    else:
        winners = resolve_multiway_showdown(hole_cards, board, still_in)
        share = pot // len(winners)
        remainder = pot - share * len(winners)
        for w in winners:
            stacks[w] += share
        stacks[winners[0]] += remainder

    profits = [stacks[i] - starting_stack for i in range(num_players)]
    return profits, "showdown"

def run_multiway_simulation(num_hands, num_players, decide_fns, sb_seat=None):
    total_profits = [0] * num_players
    for hand_num in range(num_hands):
        profits, outcome = play_multiway_hand(decide_fns, num_players, sb_seat=sb_seat)
        assert abs(sum(profits)) < 0.01, f"Not zero-sum! profits={profits}"
        for i in range(num_players):
            total_profits[i] += profits[i]
    return total_profits

def make_rated_bot_decide(bot_rating):
    def rated_decide(hole_cards, community_cards, pot_size, to_call, min_raise, num_bets, position, big_blind=10, is_ip=False, is_aggressor=False):
        action, raise_amount = xgboost_bot_decide(
            hole_cards, community_cards, pot_size, to_call, min_raise, num_bets, position, big_blind, is_ip, is_aggressor
        )
        return predictor.predict_rated_action(action, raise_amount, bot_rating)
    return rated_decide

def run_seat_alternating_heads_up(num_hands, bot_a_fn, bot_b_fn, big_blind=10):
    total_a_profit = 0
    for _ in range(num_hands // 2):
        profit_a, profit_b, outcome = play_one_hand(bot_a_fn, bot_b_fn, big_blind=big_blind)
        total_a_profit += profit_a
    for _ in range(num_hands - num_hands // 2):
        profit_b, profit_a, outcome = play_one_hand(bot_b_fn, bot_a_fn, big_blind=big_blind)
        total_a_profit += profit_a
    return total_a_profit

def run_seat_rotating_multiway(num_hands, num_players, decide_fns):
    total_profits = [0] * num_players
    for hand_num in range(num_hands):
        sb_seat = hand_num % num_players
        profits, outcome = play_multiway_hand(decide_fns, num_players, sb_seat=sb_seat)
        assert abs(sum(profits)) < 0.01, f"Not zero-sum! profits={profits}"
        for i in range(num_players):
            total_profits[i] += profits[i]
    return total_profits