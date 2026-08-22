from simulator import deal_hand

for _ in range(1000):
    hero, villain, board = deal_hand()
    all_cards = hero + villain + board
    assert len(all_cards) == len(set(all_cards)), "DUPLICATE CARD FOUND"

print("1000 hands dealt, no duplicates")

from simulator import run_betting_street, heuristic_bot_decide

winner, pot, hero_stack, villain_stack = run_betting_street(
    hero_hole=["Ah", "Ad"], villain_hole=["2c", "7h"], board=[],
    pot=15, hero_stack=985, villain_stack=985,
    hero_decide_fn=heuristic_bot_decide, villain_decide_fn=heuristic_bot_decide,
    num_bets=0, min_raise=20,
)
print(f"Winner: {winner}, Pot: {pot}, Hero stack: {hero_stack}, Villain stack: {villain_stack}")