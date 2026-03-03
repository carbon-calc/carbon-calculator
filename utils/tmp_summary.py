import json

with open('/tmp/carbon_calc_test_data.json') as f:
    data = json.load(f)

for sheet in data:
    print(f'\n=== {sheet["sheetName"]} ===')
    pc = sheet['projectConfig']
    print(f'  Name: {pc["projectName"]}')
    print(f'  Area: {pc["netArea"]} ha')
    print(f'  WCG: {pc["woodlandCarbonGuarantee"]}')
    print(f'  Country: {pc["country"]}')
    print(f'  Version: {pc["calculatorVersion"]}')
    print(f'  Sections: {len(sheet["plantingSections"])}')
    for s in sheet['plantingSections']:
        if 'species' in s:
            print(f'    {s["species"]}: spacing={s["plannedSpacing"]}m, YC={s["yieldClassLookup"]}, {s["managementRegime"]}, {s["areaHectares"]}ha, clearfell={s["clearfellAge"]}')
        elif 'label' in s:
            print(f'    [{s["label"]}]: {s["areaHectares"]}ha')
    print(f'  Total estab emissions: {sheet["totalEstablishmentEmissions"]}')
    print(f'  Soil accum area: {sheet["soilCarbonAccumulationArea"]}')
    print(f'  Baseline: {sheet["baselineSignificant"]}, Leakage: {sheet["leakageSignificant"]}')
    print(f'  Soil assumptions: {len(sheet["soilCarbonAssumptions"])} rows')
    for sa in sheet['soilCarbonAssumptions']:
        print(f'    {sa["previousLanduse"]}, {sa["soilType"]}, {sa["groundPreparation"]}, {sa["areaHectares"]}ha, emissions={sa["soilEmissionsTotal"]}')
    print(f'  Results: {len(sheet["results"])} periods')
    if sheet['results']:
        r = sheet['results'][-1]
        print(f'  Final (yr {r["cumulativeToYear"]}): biomass={r["A_biomassCarbon"]}, net={r["H_netCarbon"]}, claimable={r["J_netAfterBuffer"]}, /ha={r["K_perHectare"]}')
