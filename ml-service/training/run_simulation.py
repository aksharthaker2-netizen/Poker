import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import play_one_hand, xgboost_bot_decide, heuristic_bot_decide
import predictor
_original_predict_postflop = predictor.predict_postflop_action
postflop_call_count = [0]

def _counting_wrapper(*args, **kwargs):
    postflop_call_count[0] += 1
    return _original_predict_postflop(*args, **kwargs)

predictor.predict_postflop_action = _counting_wrapper

NUM_HANDS = 2000
BIG_BLIND = 10

hero_total_profit = 0
hero_folds = 0

for i in range(NUM_HANDS):
    hero_profit, villain_profit, outcome = play_one_hand(xgboost_bot_decide, heuristic_bot_decide, big_blind=BIG_BLIND)
    assert abs(hero_profit + villain_profit) < 0.01, f"Not zero-sum! hero={hero_profit}, villain={villain_profit}"
    hero_total_profit += hero_profit
    if outcome == "hero_folded":
        hero_folds += 1

print(f"predict_postflop_action was called {postflop_call_count[0]} times out of {NUM_HANDS} hands")
print(f"Raise-facing-bet downgraded to call: {predictor._raise_downgrade_count[0]} times")
bb_per_100 = (hero_total_profit / BIG_BLIND) / NUM_HANDS * 100
print(f"Hands played: {NUM_HANDS}")
print(f"Hero total profit: {hero_total_profit} chips")
print(f"Hero bb/100: {bb_per_100:.2f}")
print(f"Hero fold rate: {hero_folds / NUM_HANDS:.1%}")