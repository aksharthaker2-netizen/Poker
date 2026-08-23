from pokerkit import NoLimitTexasHoldem
import pathlib

file_path = next(pathlib.Path("training/data/acpc_phh").iterdir())
content = file_path.read_text()

print(f"Testing file: {file_path.name}")
print(content[:500])
print("---")

import tomllib
first_hand_raw = content.split("[2]")[0].replace("[1]\n", "")
hand_data = tomllib.loads(first_hand_raw)
print("\nParsed as structured data:")
print(hand_data)