from simulator import deal_multiway_hand, run_multiway_street, heuristic_bot_decide, xgboost_bot_decide

hole_cards, board = deal_multiway_hand(3)
stacks = [1000, 995, 990]
folded = [False, False, False]
decide_fns = [xgboost_bot_decide, xgboost_bot_decide, xgboost_bot_decide]
positions = ["UTG", "SB", "BB"]
committed = {0: 0, 1: 5, 2: 10}

winner, pot, stacks, folded, committed = run_multiway_street(
    hole_cards, [], 15, stacks, folded, decide_fns, positions,
    acting_order=[0, 1, 2], committed=committed, min_raise=20, num_bets=1,
)
print(f"Hole cards: {hole_cards}")
print(f"Winner: {winner}, Pot: {pot}, Stacks: {stacks}, Folded: {folded}, Committed: {committed}")