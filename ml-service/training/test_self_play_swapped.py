import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import play_one_hand, xgboost_bot_decide

NUM_HANDS = 2000
total_a = 0
for _ in range(NUM_HANDS // 2):
    profit_a, profit_b, outcome = play_one_hand(xgboost_bot_decide, xgboost_bot_decide)
    total_a += profit_a
for _ in range(NUM_HANDS // 2):
    profit_b, profit_a, outcome = play_one_hand(xgboost_bot_decide, xgboost_bot_decide)
    total_a += profit_a

print(f"Seat A bb/100 (seats alternated): {(total_a/10)/NUM_HANDS*100:.2f}")