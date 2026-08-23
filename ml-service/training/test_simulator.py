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

from simulator import resolve_showdown

# Hero has top pair of Aces, villain has nothing -- hero should win
result = resolve_showdown(
    hero_hole=["Ah", "Ks"],
    villain_hole=["7c", "2d"],
    board=["Ad", "Jh", "4s", "9c", "3h"],
)
print(f"Hero AK vs Villain 72 on A-J-4-9-3 board: {result}")

# A clear villain win -- villain has a flush, hero just has a pair
result2 = resolve_showdown(
    hero_hole=["Ah", "Ks"],
    villain_hole=["2c", "7c"],
    board=["Ad", "3c", "4c", "9c", "Kh"],
)
print(f"Hero AK (pair) vs Villain 27 (flush) on A-3-4-9-K (3 clubs): {result2}")

from simulator import play_one_hand, heuristic_bot_decide, xgboost_bot_decide

hero_profit, villain_profit = play_one_hand(xgboost_bot_decide, heuristic_bot_decide)
print(f"XGBoost bot profit: {hero_profit}, Heuristic bot profit: {villain_profit}")