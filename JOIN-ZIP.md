# Reassembling learfinal.zip

GitHub rejects any single file over 100 MB, so the 114 MB archive ships as two
parts. Joining them is one command and the result is byte-identical.

**Windows (CMD)**
```cmd
copy /b learfinal.zip.part0 + learfinal.zip.part1 learfinale.zip
```

**macOS / Linux**
```bash
cat learfinal.zip.part0 learfinal.zip.part1 > learfinal.zip
```

Verify against the `learfinal.zip` line in `SHA256SUMS.txt`:

```cmd
certutil -hashfile learfinale.zip SHA256
```
```bash
shasum -a 256 learfinal.zip
```
