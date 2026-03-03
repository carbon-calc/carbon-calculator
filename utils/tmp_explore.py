import openpyxl

wb = openpyxl.load_workbook('docs/CarbonCalculator_Examples_V3.0_August2025.xlsx', data_only=True)
print("Sheet names:")
for name in wb.sheetnames:
    print(f"  {repr(name)}")
