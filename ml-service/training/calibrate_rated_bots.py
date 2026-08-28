import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))
from simulator import play_one_hand, make_rated_bot_decide

NUM_HANDS = 2000
RATINGS = [400, 800, 1200, 1600]

for i, rating_a in enumerate(RATINGS):
    for rating_b in RATINGS[i+1:]:
        bot_a = make_rated_bot_decide(rating_a)
        bot_b = make_rated_bot_decide(rating_b)

        total_a_profit = 0
        for _ in range(NUM_HANDS // 2):
            profit_a, profit_b, outcome = play_one_hand(bot_a, bot_b)
            total_a_profit += profit_a
        for _ in range(NUM_HANDS // 2):
            profit_b, profit_a, outcome = play_one_hand(bot_b, bot_a)
            total_a_profit += profit_a

        bb_per_100 = (total_a_profit / 10) / NUM_HANDS * 100
        print(f"Rating {rating_a} vs Rating {rating_b} (seats alternated): {rating_a}'s bb/100 = {bb_per_100:.2f}")