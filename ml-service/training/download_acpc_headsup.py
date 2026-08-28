from remotezip import RemoteZip
from pathlib import Path
import random

random.seed(42)
url = "https://zenodo.org/records/17136841/files/poker-hand-histories.zip?download=1"
out_dir = Path(__file__).resolve().parent / "data" / "acpc_phh"
out_dir.mkdir(parents=True, exist_ok=True)

with RemoteZip(url) as zip_file:
    all_names = zip_file.namelist()
    headsup_files = [n for n in all_names if "2p_nolimit" in n and n.endswith(".phhs")]
    print(f"Found {len(headsup_files)} heads-up no-limit match files total")

    sample = random.sample(headsup_files, min(1200, len(headsup_files)))
    print(f"Downloading a sample of {len(sample)} files...")

    for i, name in enumerate(sample):
        target_path = out_dir / Path(name).name
        if target_path.exists():
            continue
        with zip_file.open(name) as source, open(target_path, "wb") as dest:
            dest.write(source.read())
        if (i + 1) % 100 == 0:
            print(f"  {i + 1}/{len(sample)} processed")

print(f"\nDone. Files saved to: {out_dir}")