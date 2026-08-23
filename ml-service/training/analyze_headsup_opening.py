import pandas as pd
from pathlib import Path

df = pd.read_csv(Path(__file__).resolve().parent / "data" / "headsup_opening_log.csv")

df["strength_bucket"] = pd.cut(df["hand_strength"], bins=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0], include_lowest=True)

print("Average profit by strength bucket and action:")
print(df.groupby(["strength_bucket", "action"])["hero_profit"].agg(["mean", "count"]))

best_action = df.groupby(["strength_bucket", "action"])["hero_profit"].mean().unstack().idxmax(axis=1)
print("\nEmpirically best action per hand-strength bucket:")
print(best_action)