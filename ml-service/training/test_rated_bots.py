import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
import predictor

for rating in [400, 800, 1200, 1600]:
    fold_count = 0
    trials = 1000
    for _ in range(trials):
        action, _ = predictor.predict_rated_action("raise", 20, rating)
        if action != "raise":
            fold_count += 1
    print(f"Rating {rating}: {fold_count}/{trials} decisions downgraded from the model's real choice")