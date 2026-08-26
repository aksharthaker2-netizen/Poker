import tomllib
from pathlib import Path

data_dir = Path("training/data/acpc_phh")
sample_file = next(data_dir.iterdir())
content = sample_file.read_text()
hand_blocks = content.split("\n[")
hand_blocks = [("[" + b if not b.startswith("[") else b) for b in hand_blocks]

for block in hand_blocks[:5]:
    lines = block.split("\n", 1)
    if len(lines) < 2:
        continue
    hand = tomllib.loads(lines[1])
    actions = hand.get("actions", [])
    blinds = hand.get("blinds_or_straddles")
    non_deal = [a for a in actions if not a.startswith("d dh") and not a.startswith("d db")]
    if non_deal:
        first_actor = non_deal[0].split()[0]
        print(f"blinds={blinds}, first_actor={first_actor}")