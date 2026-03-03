/**
 * Reference Data Loader
 * Loads all JSON-LD reference data files and builds indexed lookup structures.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REF_DIR = join(__dirname, '..', 'reference-data');

function loadJsonld(filename) {
  const raw = readFileSync(join(REF_DIR, filename), 'utf-8');
  const data = JSON.parse(raw);
  return data['@graph'] || [];
}

// ---------------------------------------------------------------------------
// Load all reference data
// ---------------------------------------------------------------------------
const countries = loadJsonld('countries.jsonld');
const previousLanduses = loadJsonld('previous-landuse.jsonld');
const soilTypes = loadJsonld('soil-types.jsonld');
const groundPrepMethods = loadJsonld('ground-preparation-methods.jsonld');
const establishmentEmissionTypes = loadJsonld('establishment-emission-types.jsonld');
const managementRegimes = loadJsonld('management-regimes.jsonld');
const growthPeriods = loadJsonld('growth-periods.jsonld');
const treeSpecies = loadJsonld('tree-species.jsonld');
const yieldClasses = loadJsonld('yield-classes.jsonld');
const treeSpacingOptions = loadJsonld('tree-spacing-options.jsonld');
const speciesModelGroups = loadJsonld('species-model-groups.jsonld');
const soilEmissionLookupRaw = loadJsonld('soil-emission-lookup.jsonld');
const soilCarbonAccumulation = loadJsonld('soil-carbon-accumulation.jsonld');
const biomassLookupRaw = loadJsonld('biomass-carbon-lookup.jsonld');
const clearfellMaxSeqRaw = loadJsonld('clearfell-max-seq.jsonld');

// ---------------------------------------------------------------------------
// Build indexed lookups
// ---------------------------------------------------------------------------

// Species by label (common name)
const speciesByLabel = new Map();
for (const sp of treeSpecies) {
  if (sp.label) speciesByLabel.set(sp.label, sp);
}

// Species by @id
const speciesById = new Map();
for (const sp of treeSpecies) {
  speciesById.set(sp['@id'], sp);
}

// Model groups by @id
const modelGroupById = new Map();
for (const mg of speciesModelGroups) {
  modelGroupById.set(mg['@id'], mg);
}

// Model groups by code
const modelGroupByCode = new Map();
for (const mg of speciesModelGroups) {
  if (mg.speciesModelCode) modelGroupByCode.set(mg.speciesModelCode, mg);
}

// Spacing options by @id
const spacingById = new Map();
for (const sp of treeSpacingOptions) {
  if (sp['@type'] === 'eco:TreeSpacingOption') {
    spacingById.set(sp['@id'], sp);
  }
}

// Spacing options by value
const spacingByValue = new Map();
for (const sp of treeSpacingOptions) {
  if (sp['@type'] === 'eco:TreeSpacingOption' && sp.spacingValue != null) {
    spacingByValue.set(sp.spacingValue, sp);
  }
}

// Shelter/spiral guard rates by @id
const protectionRateById = new Map();
for (const item of treeSpacingOptions) {
  if (item['@type'] === 'eco:ShelterRate' || item['@type'] === 'eco:SpiralGuardRate') {
    protectionRateById.set(item['@id'], item);
  }
}

// Ground prep methods by @id
const groundPrepById = new Map();
for (const gp of groundPrepMethods) {
  groundPrepById.set(gp['@id'], gp);
}

// Establishment emission types by @id
const emissionTypeById = new Map();
for (const et of establishmentEmissionTypes) {
  emissionTypeById.set(et['@id'], et);
}

// Growth periods sorted by index
const sortedPeriods = [...growthPeriods]
  .filter(p => p.periodIndex > 0)
  .sort((a, b) => a.periodIndex - b.periodIndex);

// Soil emission lookup: key = "{countryId}:{topsoilPct}" → { seminatural, pasture, arable }
const soilEmissionLookup = new Map();
const soilRateById = new Map();
for (const entry of soilEmissionLookupRaw) {
  if (entry['@type'] === 'calc:SoilEmissionRate') {
    soilRateById.set(entry['@id'], entry);
  }
}
for (const entry of soilEmissionLookupRaw) {
  if (entry['@type'] === 'calc:SoilEmissionLookupEntry') {
    const key = `${entry.soilEmissionCountry}:${entry.topsoilPercentageCode}`;
    const rates = {};
    const rateIds = Array.isArray(entry.hasSoilEmissionRate) ? entry.hasSoilEmissionRate : [entry.hasSoilEmissionRate];
    for (const rateId of rateIds) {
      const rate = soilRateById.get(rateId);
      if (rate) {
        // Map eco:Seminatural → seminatural, eco:Pasture → pasture, eco:Arable → arable
        const landuse = rate.forPreviousLanduse?.replace('eco:', '').toLowerCase();
        if (landuse) rates[landuse] = rate.soilEmissionValue || 0;
      }
    }
    soilEmissionLookup.set(key, rates);
  }
}

// Soil carbon accumulation by period index (1-20)
const soilAccumByIndex = new Map();
for (const entry of soilCarbonAccumulation) {
  // Map period IRI to index
  const periodId = entry.accumulationForPeriod;
  const period = growthPeriods.find(p => p['@id'] === periodId);
  if (period) {
    soilAccumByIndex.set(period.periodIndex, entry.accumulationValue || 0);
  }
}

// Biomass lookup: key → entry
// Normalize keys: Excel uses "NO_thin" but reference data uses "No_thin"
const biomassLookup = new Map();
for (const entry of biomassLookupRaw) {
  if (entry.lookupKey) {
    const normalizedKey = entry.lookupKey.replace('NO_thin', 'No_thin');
    biomassLookup.set(normalizedKey, entry);
  }
}

// Clearfell max seq: key → { maxSequestrationByAge }
const clearfellLookup = new Map();
for (const entry of clearfellMaxSeqRaw) {
  if (entry.lookupKey) {
    clearfellLookup.set(entry.lookupKey, entry.maxSequestrationByAge || {});
  }
}

// Management regime code by @id
const mgmtById = new Map();
for (const mr of managementRegimes) {
  mgmtById.set(mr['@id'], mr);
}

// Country by @id  
const countryById = new Map();
for (const c of countries) {
  countryById.set(c['@id'], c);
}

// Previous landuse by @id
const previousLanduseById = new Map();
for (const pl of previousLanduses) {
  previousLanduseById.set(pl['@id'], pl);
}

export default {
  // Raw arrays
  countries,
  previousLanduses,
  soilTypes,
  groundPrepMethods,
  establishmentEmissionTypes,
  managementRegimes,
  growthPeriods,
  treeSpecies,
  yieldClasses,
  treeSpacingOptions,
  speciesModelGroups,
  soilCarbonAccumulation,
  sortedPeriods,

  // Indexed lookups
  speciesByLabel,
  speciesById,
  modelGroupById,
  modelGroupByCode,
  spacingById,
  spacingByValue,
  protectionRateById,
  groundPrepById,
  emissionTypeById,
  soilEmissionLookup,
  soilAccumByIndex,
  biomassLookup,
  clearfellLookup,
  mgmtById,
  countryById,
  previousLanduseById,
  soilRateById,
};
