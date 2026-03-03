import openpyxl
import warnings
warnings.filterwarnings("ignore")

wb = openpyxl.load_workbook('docs/CarbonCalculator_Examples_V3.0_August2025.xlsx', data_only=True)
ws = wb['Natural regeneration']

# Dump all non-empty cells in rows 1-100, cols A-AZ
for row in ws.iter_rows(min_row=1, max_row=100, min_col=1, max_col=52):
    for cell in row:
        if cell.value is not None:
            print(f'{cell.coordinate}: {repr(cell.value)}')
