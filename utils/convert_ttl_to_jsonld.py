"""Convert all TTL reference data files to JSON-LD for the API."""
import json, re, os

API_REF = "api/reference-data"
os.makedirs(API_REF, exist_ok=True)

def write_jsonld(filename, data):
    path = os.path.join(API_REF, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    count = len(data.get("@graph", []))
    print(f"  {filename}: {count} entries")

# ============================================================================
# 1. Ground Preparation Methods
# ============================================================================
write_jsonld("ground-preparation-methods.jsonld", {
    "@context": {
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "skos": "http://www.w3.org/2004/02/skos/core#",
        "label": "rdfs:label",
        "definition": "skos:definition",
        "topsoilCarbonLostCode": "ref:topsoilCarbonLostCode"
    },
    "@graph": [
        {"@id": "ref:NoPreparation", "@type": "ref:GroundPreparationMethod", "label": "None", "topsoilCarbonLostCode": "00"},
        {"@id": "ref:NegligibleDisturbance", "@type": "ref:GroundPreparationMethod", "label": "Negligible Disturbance", "definition": "Hand screefing only", "topsoilCarbonLostCode": "00"},
        {"@id": "ref:LowDisturbance", "@type": "ref:GroundPreparationMethod", "label": "Low Disturbance", "definition": "Hand turfing, inverted, hinge & trench mounding, patch scarification, subsoiling, drains", "topsoilCarbonLostCode": "05"},
        {"@id": "ref:MediumDisturbance", "@type": "ref:GroundPreparationMethod", "label": "Medium Disturbance", "definition": "Shallow/rotary (<30cm) plough, disc/linear mounding", "topsoilCarbonLostCode": "10"},
        {"@id": "ref:HighDisturbance", "@type": "ref:GroundPreparationMethod", "label": "High Disturbance", "definition": "Deep (>30cm) plough, with or without tining", "topsoilCarbonLostCode": "20"},
        {"@id": "ref:VeryHighDisturbance", "@type": "ref:GroundPreparationMethod", "label": "Very High Disturbance", "definition": "Agricultural ploughing", "topsoilCarbonLostCode": "40"}
    ]
})

# ============================================================================
# 2. Establishment Emission Types
# ============================================================================
write_jsonld("establishment-emission-types.jsonld", {
    "@context": {
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "qty": "https://w3id.org/wcc/quantity#",
        "label": "rdfs:label",
        "comment": "rdfs:comment",
        "emissionRate": {"@id": "ref:emissionRate", "@type": "http://www.w3.org/2001/XMLSchema#double"},
        "emissionRateUnit": {"@id": "ref:emissionRateUnit", "@type": "@id"}
    },
    "@graph": [
        {"@id": "ref:SeedlingEmission", "@type": "ref:EstablishmentEmissionType", "label": "Seedlings", "comment": "Spacing-dependent rate — looked up via ref:TreeSpacingOption ref:seedlingRate."},
        {"@id": "ref:TreeShelterEmission", "@type": "ref:EstablishmentEmissionType", "label": "Tree protection - Tree shelters", "comment": "Spacing-dependent rate — looked up via ref:TreeSpacingOption ref:hasShelterRate."},
        {"@id": "ref:SpiralGuardEmission", "@type": "ref:EstablishmentEmissionType", "label": "Tree protection - Spiral guards", "comment": "Spacing-dependent rate — looked up via ref:TreeSpacingOption ref:hasSpiralGuardRate."},
        {"@id": "ref:VoleguardEmission", "@type": "ref:EstablishmentEmissionType", "label": "Tree protection - Voleguards", "comment": "Spacing-dependent rate — looked up via ref:TreeSpacingOption ref:voleguardRate."},
        {"@id": "ref:FertiliserEmission", "@type": "ref:EstablishmentEmissionType", "label": "Fertiliser", "comment": "Spacing-dependent rate — looked up via ref:TreeSpacingOption ref:fertiliserRate."},
        {"@id": "ref:MoundingEmission", "@type": "ref:EstablishmentEmissionType", "label": "Ground preparation (fuel): Mounding", "emissionRate": -0.41987, "emissionRateUnit": "qty:hectare"},
        {"@id": "ref:ScarifyingEmission", "@type": "ref:EstablishmentEmissionType", "label": "Ground preparation (fuel): Scarifying", "emissionRate": -0.05185, "emissionRateUnit": "qty:hectare"},
        {"@id": "ref:PloughingEmission", "@type": "ref:EstablishmentEmissionType", "label": "Ground preparation (fuel): Ploughing", "emissionRate": -0.06874, "emissionRateUnit": "qty:hectare"},
        {"@id": "ref:SubsoilingEmission", "@type": "ref:EstablishmentEmissionType", "label": "Ground preparation (fuel): Subsoiling", "emissionRate": -0.17296, "emissionRateUnit": "qty:hectare"},
        {"@id": "ref:HerbicideEmission", "@type": "ref:EstablishmentEmissionType", "label": "Herbicide", "emissionRate": -0.04414, "emissionRateUnit": "qty:hectare"},
        {"@id": "ref:FencingEmission", "@type": "ref:EstablishmentEmissionType", "label": "Fencing", "emissionRate": -0.0022, "emissionRateUnit": "qty:metre"},
        {"@id": "ref:GateEmission", "@type": "ref:EstablishmentEmissionType", "label": "Gates", "emissionRate": -0.583, "emissionRateUnit": "qty:each"},
        {"@id": "ref:RoadBuildingEmission", "@type": "ref:EstablishmentEmissionType", "label": "Road building", "emissionRate": -43.13, "emissionRateUnit": "qty:kilometre"},
        {"@id": "ref:VegetationRemovalEmission", "@type": "ref:EstablishmentEmissionType", "label": "Emissions from removal of trees or other vegetation", "comment": "Manual entry — no fixed rate; total emissions entered directly by the user."}
    ]
})

# ============================================================================
# 3. Regeneration Types
# ============================================================================
write_jsonld("regeneration-types.jsonld", {
    "@context": {
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "label": "rdfs:label"
    },
    "@graph": [
        {"@id": "ref:BroadleavesRegen", "@type": "ref:RegenerationType", "label": "Broadleaves"},
        {"@id": "ref:ScotsPineRegen", "@type": "ref:RegenerationType", "label": "Scots Pine"},
        {"@id": "ref:BothRegen", "@type": "ref:RegenerationType", "label": "Both"}
    ]
})

# ============================================================================
# 4. Management Regimes
# ============================================================================
write_jsonld("management-regimes.jsonld", {
    "@context": {
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "label": "rdfs:label",
        "managementRegimeCode": "ref:managementRegimeCode"
    },
    "@graph": [
        {"@id": "ref:NoThin", "@type": "ref:ManagementRegime", "label": "No Thinning", "managementRegimeCode": "No_thin"},
        {"@id": "ref:Thinned", "@type": "ref:ManagementRegime", "label": "Thinned", "managementRegimeCode": "Thinned"}
    ]
})

# ============================================================================
# 5. Growth Periods
# ============================================================================
periods = [{"@id": "ref:periodYear0", "@type": "ref:GrowthPeriod", "label": "Year 0", "periodStartYear": 0, "periodEndYear": 0, "periodIndex": 0}]
for i in range(20):
    s = i * 5
    e = s + 5
    periods.append({
        "@id": f"ref:period{s}to{e}",
        "@type": "ref:GrowthPeriod",
        "label": f"{s}-{e}",
        "periodStartYear": s,
        "periodEndYear": e,
        "periodIndex": i + 1
    })

write_jsonld("growth-periods.jsonld", {
    "@context": {
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "label": "rdfs:label",
        "periodStartYear": {"@id": "ref:periodStartYear", "@type": "xsd:integer"},
        "periodEndYear": {"@id": "ref:periodEndYear", "@type": "xsd:integer"},
        "periodIndex": {"@id": "ref:periodIndex", "@type": "xsd:integer"}
    },
    "@graph": periods
})

# ============================================================================
# 6. Verification Schemes
# ============================================================================
write_jsonld("verification-schemes.jsonld", {
    "@context": {
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "label": "rdfs:label",
        "comment": "rdfs:comment"
    },
    "@graph": [
        {"@id": "ref:Standard10Yearly", "@type": "ref:VerificationScheme", "label": "Standard 10-Yearly Verification", "comment": "Standard WCC verification at 10-year intervals."},
        {"@id": "ref:Guarantee5Yearly", "@type": "ref:VerificationScheme", "label": "5-Yearly Verification (Woodland Carbon Guarantee)", "comment": "5-yearly verification for WCC projects in England using the Woodland Carbon Guarantee."}
    ]
})

# ============================================================================
# 7. Greenhouse Gases
# ============================================================================
write_jsonld("greenhouse-gases.jsonld", {
    "@context": {
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "label": "rdfs:label",
        "comment": "rdfs:comment",
        "chemicalFormula": "ref:chemicalFormula",
        "globalWarmingPotential": {"@id": "ref:globalWarmingPotential", "@type": "xsd:double"}
    },
    "@graph": [
        {"@id": "ref:CarbonDioxide", "@type": "ref:GreenhouseGas", "label": "Carbon Dioxide", "chemicalFormula": "CO2", "globalWarmingPotential": 1.0},
        {"@id": "ref:Methane", "@type": "ref:GreenhouseGas", "label": "Methane", "chemicalFormula": "CH4", "globalWarmingPotential": 28.0},
        {"@id": "ref:NitrousOxide", "@type": "ref:GreenhouseGas", "label": "Nitrous Oxide", "chemicalFormula": "N2O", "globalWarmingPotential": 265.0},
        {"@id": "ref:CO2Equivalent", "@type": "ref:ChemicalSubstance", "label": "CO2 Equivalent", "chemicalFormula": "CO2e"}
    ]
})

# ============================================================================
# 8. Carbon Pools
# ============================================================================
write_jsonld("carbon-pools.jsonld", {
    "@context": {
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "label": "rdfs:label",
        "comment": "rdfs:comment"
    },
    "@graph": [
        {"@id": "ref:StandingBiomass", "@type": "ref:CarbonPool", "label": "Standing Biomass", "comment": "Carbon standing in living trees."},
        {"@id": "ref:Debris", "@type": "ref:CarbonPool", "label": "Debris", "comment": "Carbon in deadwood, litter, and forest floor debris."},
        {"@id": "ref:SoilCarbon", "@type": "ref:CarbonPool", "label": "Soil Carbon", "comment": "Carbon stored in soil organic matter (topsoil 0-30cm)."},
        {"@id": "ref:HarvestedWoodProducts", "@type": "ref:CarbonPool", "label": "Harvested Wood Products", "comment": "Carbon removed from forest in harvested timber."}
    ]
})

# ============================================================================
# 9. Tree Species (from TTL — programmatic conversion)
# ============================================================================
species = []
with open("docs/reference-data/tree-species.ttl") as f:
    content = f.read()
blocks = re.split(r'\n(?=ref:\w)', content)
for block in blocks:
    m = re.match(r'(ref:\S+)', block)
    if not m:
        continue
    entry = {"@id": m.group(1), "@type": "ref:TreeSpecies"}
    lbl = re.search(r'rdfs:label\s+"([^"]+)"', block)
    if lbl: entry["label"] = lbl.group(1)
    code = re.search(r'ref:speciesCode\s+"([^"]*)"', block)
    if code: entry["speciesCode"] = code.group(1)
    latin = re.search(r'ref:latinName\s+"([^"]*)"', block)
    if latin: entry["latinName"] = latin.group(1)
    mg = re.search(r'ref:mapsToModelGroup\s+(ref:\S+)', block)
    if mg: entry["mapsToModelGroup"] = mg.group(1)
    species.append(entry)

write_jsonld("tree-species.jsonld", {
    "@context": {
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "label": "rdfs:label",
        "speciesCode": "ref:speciesCode",
        "latinName": "ref:latinName",
        "mapsToModelGroup": {"@id": "ref:mapsToModelGroup", "@type": "@id"}
    },
    "@graph": species
})

# ============================================================================
# 10. Yield Classes (from TTL)
# ============================================================================
yield_classes = []
with open("docs/reference-data/yield-classes.ttl") as f:
    content = f.read()
blocks = re.split(r'\n(?=ref:\w)', content)
for block in blocks:
    m = re.match(r'(ref:\S+)', block)
    if not m: continue
    entry = {"@id": m.group(1), "@type": "ref:YieldClass"}
    lbl = re.search(r'rdfs:label\s+"([^"]+)"', block)
    if lbl: entry["label"] = lbl.group(1)
    val = re.search(r'ref:yieldClassValue\s+(\d+)', block)
    if val: entry["yieldClassValue"] = int(val.group(1))
    yield_classes.append(entry)

write_jsonld("yield-classes.jsonld", {
    "@context": {
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "label": "rdfs:label",
        "yieldClassValue": {"@id": "ref:yieldClassValue", "@type": "xsd:integer"}
    },
    "@graph": yield_classes
})

# ============================================================================
# 11. Tree Spacing Options (from TTL)
# ============================================================================
spacings = []
with open("docs/reference-data/tree-spacing-options.ttl") as f:
    content = f.read()
blocks = re.split(r'\n(?=ref:\w)', content)
for block in blocks:
    m = re.match(r'(ref:\S+)', block)
    if not m: continue
    eid = m.group(1)

    if "a ref:TreeSpacingOption" in block:
        entry = {"@id": eid, "@type": "ref:TreeSpacingOption"}
        lbl = re.search(r'rdfs:label\s+"([^"]+)"', block)
        if lbl: entry["label"] = lbl.group(1)
        for prop in ["spacingValue", "seedlingRate", "voleguardRate", "fertiliserRate"]:
            val = re.search(rf'ref:{prop}\s+([-\d.eE]+)', block)
            if val: entry[prop] = float(val.group(1))
        shelter = re.search(r'ref:hasShelterRate\s+(ref:\S+)', block)
        if shelter: entry["hasShelterRate"] = shelter.group(1)
        spiral = re.search(r'ref:hasSpiralGuardRate\s+(ref:\S+)', block)
        if spiral: entry["hasSpiralGuardRate"] = spiral.group(1)
        spacings.append(entry)
    elif "a ref:ShelterRate" in block:
        entry = {"@id": eid, "@type": "ref:ShelterRate"}
        lbl = re.search(r'rdfs:label\s+"([^"]+)"', block)
        if lbl: entry["label"] = lbl.group(1)
        val = re.search(r'ref:protectionEmissionRate\s+([-\d.eE]+)', block)
        if val: entry["protectionEmissionRate"] = float(val.group(1))
        spacings.append(entry)
    elif "a ref:SpiralGuardRate" in block:
        entry = {"@id": eid, "@type": "ref:SpiralGuardRate"}
        lbl = re.search(r'rdfs:label\s+"([^"]+)"', block)
        if lbl: entry["label"] = lbl.group(1)
        val = re.search(r'ref:protectionEmissionRate\s+([-\d.eE]+)', block)
        if val: entry["protectionEmissionRate"] = float(val.group(1))
        spacings.append(entry)

write_jsonld("tree-spacing-options.jsonld", {
    "@context": {
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "label": "rdfs:label",
        "spacingValue": {"@id": "ref:spacingValue", "@type": "xsd:double"},
        "seedlingRate": {"@id": "ref:seedlingRate", "@type": "xsd:double"},
        "voleguardRate": {"@id": "ref:voleguardRate", "@type": "xsd:double"},
        "fertiliserRate": {"@id": "ref:fertiliserRate", "@type": "xsd:double"},
        "hasShelterRate": {"@id": "ref:hasShelterRate", "@type": "@id"},
        "hasSpiralGuardRate": {"@id": "ref:hasSpiralGuardRate", "@type": "@id"},
        "protectionEmissionRate": {"@id": "ref:protectionEmissionRate", "@type": "xsd:double"}
    },
    "@graph": spacings
})

# ============================================================================
# 12. Species Model Groups (from TTL)
# ============================================================================
model_groups = []
with open("docs/reference-data/species-model-groups.ttl") as f:
    content = f.read()
blocks = re.split(r'\n(?=ref:\w)', content)
for block in blocks:
    m = re.match(r'(ref:\S+)', block)
    if not m: continue
    entry = {"@id": m.group(1), "@type": "ref:SpeciesModelGroup"}
    lbl = re.search(r'rdfs:label\s+"([^"]+)"', block)
    if lbl: entry["label"] = lbl.group(1)
    code = re.search(r'ref:speciesModelCode\s+"([^"]*)"', block)
    if code: entry["speciesModelCode"] = code.group(1)
    sps = re.findall(r'ref:hasAvailableSpacing\s+(ref:\S+)', block)
    if sps: entry["hasAvailableSpacing"] = sps
    ycs = re.findall(r'ref:hasAvailableYieldClass\s+(ref:\S+)', block)
    if ycs: entry["hasAvailableYieldClass"] = ycs
    model_groups.append(entry)

write_jsonld("species-model-groups.jsonld", {
    "@context": {
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "label": "rdfs:label",
        "speciesModelCode": "ref:speciesModelCode",
        "hasAvailableSpacing": {"@id": "ref:hasAvailableSpacing", "@type": "@id", "@container": "@set"},
        "hasAvailableYieldClass": {"@id": "ref:hasAvailableYieldClass", "@type": "@id", "@container": "@set"}
    },
    "@graph": model_groups
})

# ============================================================================
# 13. Soil Emission Lookup (from TTL)
# ============================================================================
soil_entries = []
with open("docs/reference-data/soil-emission-lookup.ttl") as f:
    content = f.read()
blocks = re.split(r'\n(?=carb:\w)', content)
for block in blocks:
    m = re.match(r'(carb:\S+)', block)
    if not m: continue
    eid = m.group(1)
    if "a carb:SoilEmissionLookupEntry" in block:
        entry = {"@id": eid, "@type": "carb:SoilEmissionLookupEntry"}
        lbl = re.search(r'rdfs:label\s+"([^"]+)"', block)
        if lbl: entry["label"] = lbl.group(1)
        cty = re.search(r'carb:soilEmissionCountry\s+(ref:\S+)', block)
        if cty: entry["soilEmissionCountry"] = cty.group(1)
        pct = re.search(r'carb:topsoilPercentageCode\s+"([^"]*)"', block)
        if pct: entry["topsoilPercentageCode"] = pct.group(1)
        rates = re.findall(r'carb:hasSoilEmissionRate\s+(carb:\S+)', block)
        if rates: entry["hasSoilEmissionRate"] = rates
        soil_entries.append(entry)
    elif "a carb:SoilEmissionRate" in block:
        entry = {"@id": eid, "@type": "carb:SoilEmissionRate"}
        lbl = re.search(r'rdfs:label\s+"([^"]+)"', block)
        if lbl: entry["label"] = lbl.group(1)
        lu = re.search(r'carb:forPreviousLanduse\s+(ref:\S+)', block)
        if lu: entry["forPreviousLanduse"] = lu.group(1)
        val = re.search(r'carb:soilEmissionValue\s+([-\d.eE]+)', block)
        if val: entry["soilEmissionValue"] = float(val.group(1))
        soil_entries.append(entry)

write_jsonld("soil-emission-lookup.jsonld", {
    "@context": {
        "carb": "https://w3id.org/wcc/carbon#",
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "label": "rdfs:label",
        "soilEmissionCountry": {"@id": "carb:soilEmissionCountry", "@type": "@id"},
        "topsoilPercentageCode": "carb:topsoilPercentageCode",
        "hasSoilEmissionRate": {"@id": "carb:hasSoilEmissionRate", "@type": "@id", "@container": "@set"},
        "forPreviousLanduse": {"@id": "carb:forPreviousLanduse", "@type": "@id"},
        "soilEmissionValue": {"@id": "carb:soilEmissionValue", "@type": "xsd:double"}
    },
    "@graph": soil_entries
})

# ============================================================================
# 14. Soil Carbon Accumulation (from TTL)
# ============================================================================
accum_entries = []
with open("docs/reference-data/soil-carbon-accumulation.ttl") as f:
    content = f.read()
blocks = re.split(r'\n(?=carb:\w)', content)
for block in blocks:
    m = re.match(r'(carb:\S+)', block)
    if not m: continue
    entry = {"@id": m.group(1), "@type": "carb:SoilCarbonAccumulationRate"}
    lbl = re.search(r'rdfs:label\s+"([^"]+)"', block)
    if lbl: entry["label"] = lbl.group(1)
    period = re.search(r'carb:accumulationForPeriod\s+(ref:\S+)', block)
    if period: entry["accumulationForPeriod"] = period.group(1)
    val = re.search(r'carb:accumulationValue\s+([-\d.eE]+)', block)
    if val: entry["accumulationValue"] = float(val.group(1))
    accum_entries.append(entry)

write_jsonld("soil-carbon-accumulation.jsonld", {
    "@context": {
        "carb": "https://w3id.org/wcc/carbon#",
        "ref": "https://w3id.org/wcc/reference#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "label": "rdfs:label",
        "accumulationForPeriod": {"@id": "carb:accumulationForPeriod", "@type": "@id"},
        "accumulationValue": {"@id": "carb:accumulationValue", "@type": "xsd:double"}
    },
    "@graph": accum_entries
})

print("\nAll JSON-LD files written to api/reference-data/")
