"""Đọc Employee.xlsx (cột A: Tên, cột B: Chức vụ) -> data/employees.json
Chạy:  python scripts/import-employees.py [đường_dẫn.xlsx]
Sau đó: npm run reset-data  (sao lưu DB cũ) rồi chạy lại server để nạp danh sách mới.
"""
import json, sys, pathlib
import openpyxl

root = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "Employee.xlsx"
ws = openpyxl.load_workbook(src).active
rows = [r for r in ws.iter_rows(min_row=2, values_only=True) if r and r[0]]
people = [{"name": str(r[0]).strip(), "position": str(r[1] or "").strip()} for r in rows]
out = root / "data" / "employees.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(people, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Đã ghi {len(people)} nhân viên -> {out}")
