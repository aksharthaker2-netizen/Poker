from remotezip import RemoteZip

url = "https://zenodo.org/records/17136841/files/poker-hand-histories.zip?download=1"

with RemoteZip(url) as zip_file:
    names = zip_file.namelist()

    top_level_dirs = sorted(set(n.split("/")[1] for n in names if n.startswith("data/") and len(n.split("/")) > 1))
    print("Top-level folders under data/:")
    for d in top_level_dirs:
        print(f"  {d}")

    print("\nSample paths containing 'acpc':")
    acpc_paths = [n for n in names if "acpc" in n.lower()]
    for p in acpc_paths[:15]:
        print(f"  {p}")
    print(f"  ... ({len(acpc_paths)} total matches)")