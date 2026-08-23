import pandas as pd
from pathlib import Path

df = pd.read_csv(Path(__file__).resolve().parent / "data" / "acpc_headsup_opening.csv")
df["strength_bucket"] = pd.cut(df["hand_strength"], bins=10)

print("Average profit by strength bucket and action:")
print(df.groupby(["strength_bucket", "action"])["profit_bb"].agg(["mean", "count"]))

best_action = df.groupby(["strength_bucket", "action"])["profit_bb"].mean().unstack().idxmax(axis=1)
print("\nEmpirically best action per bucket (from real elite AI play):")
print(best_action)