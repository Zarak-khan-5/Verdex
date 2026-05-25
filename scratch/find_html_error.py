import os

src_dir = r"d:\Verdex\frontend"
matches = []

for root, dirs, files in os.walk(src_dir):
    if "node_modules" in root or ".next" in root:
        continue
    for file in files:
        if file.endswith((".ts", ".tsx", ".js", ".jsx", ".html")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                    if "next/document" in content or "Html" in content or "<Html" in content:
                        matches.append((path, "matches found"))
            except Exception as e:
                pass

print("Matches found:")
for m in matches:
    print(m)
