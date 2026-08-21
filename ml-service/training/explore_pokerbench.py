import sys
from pathlib import Path
import pandas as pd
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
from features import hand_strength

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(exist_ok=True)
LOCAL_PATH = DATA_DIR / "preflop_60k.csv"
URL = "https://huggingface.co/datasets/RZ412/PokerBench/resolve/main/preflop_60k_train_set_game_scenario_information.csv"

if LOCAL_PATH.exists():
    df = pd.read_csv(LOCAL_PATH)
else:
    df = pd.read_csv(URL)
    df.to_csv(LOCAL_PATH, index=False)

df = df.drop(columns=["Unnamed: 0"], errors="ignore")


def normalize_action(decision):
    if decision in ("fold", "call"):
        return decision
    return "raise"


df["action_label"] = df["correct_decision"].apply(normalize_action)


def compute_strength(holding):
    card1 = holding[0:2]
    card2 = holding[2:4]
    return hand_strength([card1, card2], [])


df["our_hand_strength"] = df["hero_holding"].apply(compute_strength)

print("Average hand_strength by action (our function vs solver's real decisions):")
print(df.groupby("action_label")["our_hand_strength"].mean())

print("Average num_bets by action:")
print(df.groupby("action_label")["num_bets"].mean())

call_rows = df[df["action_label"] == "call"]
facing_allin = call_rows["prev_line"].str.contains("allin", na=False).mean()
print(f"\nFraction of 'call' decisions facing an all-in: {facing_allin:.2%}")

raise_rows = df[df["action_label"] == "raise"]
is_opening_raise = (raise_rows["num_bets"] <= 1).mean()
print(f"Fraction of 'raise' decisions that are early/opening raises: {is_opening_raise:.2%}")