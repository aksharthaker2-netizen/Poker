import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import play_one_hand, xgboost_bot_decide, heuristic_bot_decide

NUM_HANDS = 10000
total_hero = 0
for _ in range(NUM_HANDS // 2):
    profit_hero, profit_villain, outcome = play_one_hand(xgboost_bot_decide, heuristic_bot_decide)
    total_hero += profit_hero
for _ in range(NUM_HANDS // 2):
    profit_villain, profit_hero, outcome = play_one_hand(heuristic_bot_decide, xgboost_bot_decide)
    total_hero += profit_hero

print(f"XGBoost vs Phase 0, seats alternated, {NUM_HANDS} hands:")
print(f"XGBoost bb/100 (true skill difference): {(total_hero/10)/NUM_HANDS*100:.2f}")