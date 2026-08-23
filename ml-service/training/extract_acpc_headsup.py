import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "app"))
import features

import tomllib
import pandas as pd

data_dir = Path(__file__).resolve().parent / "data" / "acpc_phh"
records = []

for file_path in data_dir.iterdir():
    content = file_path.read_text()
    hand_blocks = content.split("\n[")
    hand_blocks = [("[" + b if not b.startswith("[") else b) for b in hand_blocks]

    for block in hand_blocks:
        lines = block.split("\n", 1)
        if len(lines) < 2:
            continue
        toml_text = lines[1]
        try:
            hand = tomllib.loads(toml_text)
        except Exception:
            continue

        actions = hand.get("actions", [])
        results = hand.get("_results")
        blinds = hand.get("blinds_or_straddles")
        if not actions or not results or not blinds:
            continue

        small_blind, big_blind = blinds

        deal_actions = [a for a in actions if a.startswith("d dh")]
        if len(deal_actions) != 2:
            continue

        non_deal_actions = [a for a in actions if not a.startswith("d dh") and not a.startswith("d db")]
        if not non_deal_actions:
            continue
        first_action = non_deal_actions[0]

        if first_action.startswith("p1"):
            actor_index = 0
        elif first_action.startswith("p2"):
            actor_index = 1
        else:
            continue

        actor_cards_raw = deal_actions[actor_index].split()[-1]
        hole_cards = [actor_cards_raw[0:2], actor_cards_raw[2:4]]
        strength = features.hand_strength(hole_cards, [])
        profit_bb = results[actor_index] / big_blind

        action_token = first_action.split()[1]
        if action_token == "f":
            action = "fold"
        elif action_token == "cc":
            action = "call"
        elif action_token == "cbr":
            action = "raise"
        else:
            continue

        records.append({
            "hand_strength": strength,
            "action": action,
            "profit_bb": profit_bb,
        })
df = pd.DataFrame(records)
out_path = Path(__file__).resolve().parent / "data" / "acpc_headsup_opening.csv"
df.to_csv(out_path, index=False)
print(f"Extracted {len(df)} hands")
print(df.describe())