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
    iteration_count = 0
    while True:
        iteration_count += 1
        if iteration_count > 200:
            print(f"STUCK: committed={committed}, folded={folded}, all_in={all_in}, idx={idx}, order={order}, last_raiser={last_raiser}")
            raise RuntimeError("Betting round exceeded 200 iterations - infinite loop")
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

def play_multiway_hand(decide_fns, num_players, starting_stack=1000, small_blind=5, big_blind=10):
    print("MARKER: NEW CODE RUNNING", flush=True)
    hole_cards, board = deal_multiway_hand(num_players)
    stacks = [starting_stack] * num_players
    folded = [False] * num_players

    base_positions = ["UTG", "HJ", "CO", "BTN"]
    positions = base_positions[:num_players - 2] + ["SB", "BB"]

    committed = {i: 0 for i in range(num_players)}
    committed[num_players - 2] = small_blind
    committed[num_players - 1] = big_blind
    stacks[num_players - 2] -= small_blind
    stacks[num_players - 1] -= big_blind
    pot = small_blind + big_blind
    num_bets = 1

    acting_order = list(range(num_players))
    streets = [("preflop", []), ("flop", board[0:3]), ("turn", board[0:4]), ("river", board[0:5])]

    for street_name, visible_board in streets:
        active_players = [i for i in range(num_players) if not folded[i]]
        if len(active_players) == 1:
            break

        if street_name == "preflop":
            street_order = list(range(num_players))
        else:
            sb_seat = num_players - 2
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
    print(f"DEBUG: folded={folded}, still_in={still_in}, pot={pot}, stacks={stacks}, starting_stack={starting_stack}")
    profits = [stacks[i] - starting_stack for i in range(num_players)]
    return profits, "showdown"

def run_multiway_simulation(num_hands, num_players, decide_fns):
    total_profits = [0] * num_players
    for hand_num in range(num_hands):
        profits, outcome = play_multiway_hand(decide_fns, num_players)
        print(f"Hand {hand_num}: profits={profits}, outcome={outcome}")
        assert abs(sum(profits)) < 0.01, f"Not zero-sum! profits={profits}"
        for i in range(num_players):
            total_profits[i] += profits[i]
    return total_profits

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