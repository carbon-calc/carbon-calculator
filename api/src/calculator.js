/**
 * Carbon Calculation Engine
 *
 * Implements the Woodland Carbon Code Standard Carbon Calculator (v3.0)
 * algorithm:
 *
 *   1. Resolve species → model group → lookup key per planting section
 *   2. Biomass carbon per section per 5-year period via biomass lookup table
 *   3. Clearfell cap applied if section has a clearfell age
 *   4. Area-weighted whole-project biomass carbon
 *   5. Apply 20% model precision deduction (multiply by 0.8)
 *   6. Establishment emissions (one-time, applied to period 1)
 *   7. Soil carbon: emission at year 0 + accumulation per period
 *   8. Gross sequestration = biomass + establishment + soil
 *   9. Deduct baseline and leakage if significant
 *  10. 20% buffer deduction
 *  11. PIU vintage schedule
 */

import refData from './reference-data.js';

const MODEL_PRECISION_FACTOR = 0.8; // 20% deduction
const BUFFER_RATE = 0.2;            // 20% buffer
const NUM_PERIODS = 20;             // 0-5 through 95-100

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a species reference to its model group code.
 * Accepts either an eco: IRI (e.g. "eco:Beech") or a common name label.
 */
function resolveSpecies(speciesRef) {
  let species;
  if (typeof speciesRef === 'string') {
    species = refData.speciesById.get(speciesRef) || refData.speciesByLabel.get(speciesRef);
  }
  if (!species) return null;

  const modelGroupId = species.mapsToModelGroup;
  const modelGroup = refData.modelGroupById.get(modelGroupId);
  if (!modelGroup) return null;

  return {
    speciesId: species['@id'],
    speciesLabel: species.label,
    modelCode: modelGroup.speciesModelCode,
    modelGroupId: modelGroup['@id'],
    modelGroup,
  };
}

/**
 * Find closest available spacing for a model group.
 */
function resolveSpacing(modelGroup, requestedSpacing) {
  const availableIds = Array.isArray(modelGroup.hasAvailableSpacing)
    ? modelGroup.hasAvailableSpacing
    : [modelGroup.hasAvailableSpacing];

  const availableSpacings = availableIds
    .map(id => refData.spacingById.get(id))
    .filter(Boolean)
    .sort((a, b) => Math.abs(a.spacingValue - requestedSpacing) - Math.abs(b.spacingValue - requestedSpacing));

  return availableSpacings[0] || null;
}

/**
 * Build the composite lookup key for biomass/clearfell tables.
 * Format: "{modelCode}{spacing:.1f}{yieldClass:02d}{mgmtCode}"
 */
function buildLookupKey(modelCode, spacing, yieldClass, mgmtCode) {
  const sp = spacing.toFixed(1);
  const yc = String(yieldClass).padStart(2, '0');
  return `${modelCode}${sp}${yc}${mgmtCode}`;
}

/**
 * Look up biomass carbon for a given key + period start year.
 * Returns cumulativeTotalSeq (tCO2e/ha).
 */
function lookupBiomassCarbon(baseKey, periodStartYear) {
  const periodStr = String(periodStartYear).padStart(3, '0');
  // The lookup key in the biomass table includes the period:
  // e.g. "BE1.202No_thin000" for period 0-5
  // But actually the key format from extraction is just the base key
  // Let me check: lookupKey = "BE1.202NO_thin000"
  // That matches: modelCode + spacing + YC + mgmt + period
  const fullKey = `${baseKey}${periodStr}`;
  const entry = refData.biomassLookup.get(fullKey);
  return entry ? (entry.cumulativeTotalSeq || 0) : 0;
}

/**
 * Look up clearfell max sequestration cap.
 */
function lookupClearfellCap(baseKey, clearfellAge) {
  const caps = refData.clearfellLookup.get(baseKey);
  if (!caps) return null;
  // Find the rotation age ≤ clearfellAge (must be multiple of 5)
  const roundedAge = Math.floor(clearfellAge / 5) * 5;
  return caps[String(roundedAge)] ?? null;
}

// ---------------------------------------------------------------------------
// Establishment Emissions
// ---------------------------------------------------------------------------

/**
 * Calculate total establishment emissions (tCO2e) from the project.
 * Uses fixed rates and spacing-dependent rates.
 */
function calculateEstablishmentEmissions(project) {
  const items = project.establishmentEmissions || [];
  let totalEmissions = 0;

  for (const item of items) {
    const emissionTypeRef = item.emissionType;
    const emissionType = refData.emissionTypeById.get(emissionTypeRef);
    if (!emissionType) continue;

    let rate = 0;
    let quantity = 0;

    // Get quantity from the item
    const inputQty = item.inputQuantity;
    if (inputQty) {
      quantity = inputQty.value || 0;
    }

    // Fixed-rate emission types (have emissionRate property)
    if (emissionType.emissionRate != null) {
      rate = emissionType.emissionRate; // Already negative (emissions)
      totalEmissions += rate * quantity;
    }
    // Spacing-dependent rates — need the net area and spacing
    else if (item.emissionRate) {
      rate = item.emissionRate.value || 0;
      totalEmissions += rate * quantity;
    }
  }

  return totalEmissions;
}

/**
 * Auto-calculate spacing-dependent establishment emissions for each section.
 * The Excel calculator derives seedling, shelter, spiral, voleguard,
 * fertiliser emissions from the per-hectare rates in TreeSpacingOption.
 */
function calculateSpacingDependentEmissions(sections) {
  let total = 0;
  for (const section of sections) {
    const spacingOpt = section._resolvedSpacing;
    const area = section._area || 0;
    if (!spacingOpt || area === 0) continue;

    // Seedling emission per ha
    total += (spacingOpt.seedlingRate || 0) * area;

    // Shelter rate (if section uses shelters)
    if (section._usesShelters) {
      const shelterRate = refData.protectionRateById.get(spacingOpt.hasShelterRate);
      if (shelterRate) {
        total += (shelterRate.protectionEmissionRate || 0) * area;
      }
    }

    // Spiral guard rate (if section uses spiral guards)
    if (section._usesSpiralGuards) {
      const spiralRate = refData.protectionRateById.get(spacingOpt.hasSpiralGuardRate);
      if (spiralRate) {
        total += (spiralRate.protectionEmissionRate || 0) * area;
      }
    }

    // Voleguard emission
    if (section._usesVoleguards) {
      total += (spacingOpt.voleguardRate || 0) * area;
    }

    // Fertiliser emission
    if (section._usesFertiliser) {
      total += (spacingOpt.fertiliserRate || 0) * area;
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// Soil Carbon
// ---------------------------------------------------------------------------

/**
 * Calculate soil carbon emission at year 0 (one-time, based on country,
 * ground prep topsoil loss code, and previous landuse).
 * Returns tCO2e for the whole project area affected.
 */
function calculateSoilEmission(soilEntries) {
  let totalSoilEmission = 0;

  for (const entry of soilEntries) {
    const countryRef = entry.country;
    const landuseRef = entry.previousLanduse;
    const groundPrepRef = entry.groundPreparation;

    const groundPrep = refData.groundPrepById.get(groundPrepRef);
    if (!groundPrep) continue;

    const topsoilCode = groundPrep.topsoilCarbonLostCode || '00';
    const country = refData.countryById.get(countryRef);
    if (!country) continue;

    // Build lookup key: "proj:England:02"
    const lookupKey = `${countryRef}:${topsoilCode}`;
    const rates = refData.soilEmissionLookup.get(lookupKey);
    if (!rates) continue;

    // Get the landuse-specific rate
    const landuseLabel = landuseRef?.replace('eco:', '').toLowerCase();
    const rate = rates[landuseLabel] || 0;

    // Area from the entry
    const area = entry.soilCarbonArea?.value || 0;

    totalSoilEmission += rate * area;
  }

  return totalSoilEmission;
}

/**
 * Calculate soil carbon accumulation per period (tCO2e).
 * Only applies to mineral soil, previously arable, minimum-intervention.
 */
function calculateSoilAccumulation(accumArea, periodIndex) {
  if (accumArea <= 0) return 0;
  const accumPerHa = refData.soilAccumByIndex.get(periodIndex) || 0;
  return accumPerHa * accumArea;
}

// ---------------------------------------------------------------------------
// Main Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate carbon capture for a project.
 * @param {Object} project - JSON-LD project payload
 * @returns {Object} calculation results
 */
export function calculateCarbonCapture(project) {
  const errors = [];
  const warnings = [];

  // -------------------------------------------------------------------------
  // 1. Resolve planting sections
  // -------------------------------------------------------------------------
  const sections = project.plantingSections || [];
  const resolvedSections = [];
  let totalArea = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionNum = section.sectionNumber || (i + 1);

    // Resolve species
    const speciesRef = section.species;
    const resolved = resolveSpecies(speciesRef);
    if (!resolved) {
      errors.push(`Section ${sectionNum}: Unknown species "${speciesRef}"`);
      continue;
    }

    // Resolve spacing
    const requestedSpacing = section.plannedSpacing?.value;
    if (!requestedSpacing) {
      errors.push(`Section ${sectionNum}: Missing spacing`);
      continue;
    }
    const spacingOpt = resolveSpacing(resolved.modelGroup, requestedSpacing);
    if (!spacingOpt) {
      errors.push(`Section ${sectionNum}: No valid spacing for ${resolved.modelCode}`);
      continue;
    }

    // Yield class
    const yc = section.yieldClass?.yieldClassValue || section.yieldClassValue;
    if (!yc) {
      errors.push(`Section ${sectionNum}: Missing yield class`);
      continue;
    }

    // Management regime
    const mgmtRef = section.managementRegime;
    const mgmt = refData.mgmtById.get(mgmtRef);
    const mgmtCode = mgmt?.managementRegimeCode || 'No_thin';

    // Area
    const area = section.sectionArea?.value || 0;
    if (area <= 0) {
      errors.push(`Section ${sectionNum}: Area must be positive`);
      continue;
    }

    // Build lookup key
    const lookupKey = buildLookupKey(resolved.modelCode, spacingOpt.spacingValue, yc, mgmtCode);

    // Clearfell
    const clearfellAge = section.clearfellAge?.value || 0;
    let clearfellCap = null;
    if (clearfellAge > 0) {
      clearfellCap = lookupClearfellCap(lookupKey, clearfellAge);
    }

    totalArea += area;

    resolvedSections.push({
      sectionNumber: sectionNum,
      speciesLabel: resolved.speciesLabel,
      modelCode: resolved.modelCode,
      spacing: spacingOpt.spacingValue,
      yieldClass: yc,
      managementRegime: mgmtCode,
      lookupKey,
      area,
      clearfellAge,
      clearfellCap,
      _resolvedSpacing: spacingOpt,
      _area: area,
      _usesShelters: section._usesShelters || false,
      _usesSpiralGuards: section._usesSpiralGuards || false,
      _usesVoleguards: section._usesVoleguards || false,
      _usesFertiliser: section._usesFertiliser || false,
    });
  }

  // Natural regeneration area
  const naturalRegenArea = project.naturalRegeneration?.naturalRegenerationArea?.value || 0;
  // Woody shrubs area
  const woodyShrubArea = project.woodyShrubs?.woodyShrubArea?.value || 0;
  // Net project area
  const netArea = project.netArea?.value || totalArea + naturalRegenArea + woodyShrubArea;

  if (resolvedSections.length === 0 && errors.length > 0) {
    return { errors, warnings, results: null };
  }

  // -------------------------------------------------------------------------
  // 2. Establishment emissions (one-time)
  // -------------------------------------------------------------------------
  const fixedEstEmissions = calculateEstablishmentEmissions(project);
  const spacingEstEmissions = calculateSpacingDependentEmissions(resolvedSections);
  const totalEstablishmentEmissions = fixedEstEmissions + spacingEstEmissions;

  // -------------------------------------------------------------------------
  // 3. Soil carbon
  // -------------------------------------------------------------------------
  const soilEntries = project.soilCarbonEntries || [];
  const soilEmissionYear0 = calculateSoilEmission(soilEntries);

  // Accumulation area (mineral, previously arable, minimum-intervention)
  const accumArea = project.soilCarbonAccumulation?.accumulationArea?.value || 0;

  // -------------------------------------------------------------------------
  // 4. Baseline and leakage
  // -------------------------------------------------------------------------
  const baseline = project.baselineAndLeakage;
  const isBaselineSignificant = baseline?.isBaselineSignificant || false;
  const isLeakageSignificant = baseline?.isLeakageSignificant || false;

  // -------------------------------------------------------------------------
  // 5. Calculate per-period results
  // -------------------------------------------------------------------------
  const periodResults = [];

  for (let periodIdx = 1; periodIdx <= NUM_PERIODS; periodIdx++) {
    const period = refData.sortedPeriods[periodIdx - 1];
    const periodStartYear = period.periodStartYear;
    const periodEndYear = period.periodEndYear;

    // --- Biomass carbon per section ---
    let totalBiomassPerHa = 0;
    const sectionBiomass = [];

    for (const section of resolvedSections) {
      let biomassPerHa = lookupBiomassCarbon(section.lookupKey, periodStartYear);

      // Apply clearfell cap
      if (section.clearfellCap != null && biomassPerHa > section.clearfellCap) {
        biomassPerHa = section.clearfellCap;
      }

      // Area-weighted contribution
      const biomassTotal = biomassPerHa * section.area;
      totalBiomassPerHa += biomassTotal;

      sectionBiomass.push({
        sectionNumber: section.sectionNumber,
        biomassPerHa: round(biomassPerHa, 2),
        biomassTotal: round(biomassTotal, 2),
      });
    }

    // --- Model precision deduction (20%) ---
    const adjustedBiomass = totalBiomassPerHa * MODEL_PRECISION_FACTOR;

    // --- Establishment emissions (one-time cost, included in all cumulative totals) ---
    // Since biomass values from the lookup table are cumulative, the one-time
    // establishment emissions must also be included in every period to keep
    // the running totals correct.
    const estEmissions = totalEstablishmentEmissions;

    // --- Soil carbon ---
    // Soil emission at year 0 is a one-time cost — included in every
    // cumulative period (same reasoning as establishment emissions).
    const soilEmission = soilEmissionYear0;
    // Accumulation is also cumulative by period
    const soilAccum = calculateSoilAccumulation(accumArea, periodIdx);
    const totalSoilCarbon = soilEmission + soilAccum;

    // --- Gross sequestration (cumulative) ---
    const grossSequestration = adjustedBiomass + estEmissions + totalSoilCarbon;

    // --- Deductions ---
    let deductions = 0;
    // Baseline: if significant, deduct the biomass that would have grown anyway
    // The Excel model has this as a manual entry; we'll support a direct value
    if (isBaselineSignificant && project.baselineAndLeakage?.baselineDeduction?.value) {
      deductions += project.baselineAndLeakage.baselineDeduction.value;
    }
    // Leakage: similar manual entry
    if (isLeakageSignificant && project.baselineAndLeakage?.leakageDeduction?.value) {
      deductions += project.baselineAndLeakage.leakageDeduction.value;
    }

    // --- Net carbon ---
    const netCarbon = Math.round(grossSequestration - deductions);

    // --- Buffer (20% withheld) ---
    const bufferDeduction = Math.round(netCarbon * BUFFER_RATE);
    const netAfterBuffer = netCarbon - bufferDeduction;

    // --- Per hectare ---
    const perHa = netArea > 0 ? round(netAfterBuffer / netArea, 2) : 0;

    periodResults.push({
      periodIndex: periodIdx,
      periodLabel: period.label,
      periodStartYear,
      periodEndYear,
      sectionBiomass,
      totalBiomass: round(totalBiomassPerHa, 2),
      adjustedBiomass: round(adjustedBiomass, 2),
      establishmentEmissions: round(estEmissions, 2),
      soilEmission: round(soilEmission, 2),
      soilAccumulation: round(soilAccum, 2),
      totalSoilCarbon: round(totalSoilCarbon, 2),
      grossSequestration: round(grossSequestration, 2),
      deductions: round(deductions, 2),
      netCarbon,
      bufferDeduction,
      netAfterBuffer,
      perHectare: perHa,
    });
  }

  // -------------------------------------------------------------------------
  // 6. PIU vintage schedule
  // -------------------------------------------------------------------------
  const isGuarantee = project.isWoodlandCarbonGuarantee || false;
  const vintageSchedule = calculateVintageSchedule(periodResults, isGuarantee);

  // -------------------------------------------------------------------------
  // 7. Summary
  // -------------------------------------------------------------------------
  const finalPeriod = periodResults[periodResults.length - 1];

  return {
    errors,
    warnings,
    summary: {
      projectName: project.projectName || 'Unnamed Project',
      totalProjectArea: round(netArea, 2),
      numberOfSections: resolvedSections.length,
      totalEstablishmentEmissions: round(totalEstablishmentEmissions, 2),
      soilEmissionYear0: round(soilEmissionYear0, 2),
      totalNetCarbon100yr: finalPeriod.netCarbon,
      totalNetAfterBuffer100yr: finalPeriod.netAfterBuffer,
      totalBuffer100yr: finalPeriod.bufferDeduction,
      perHectare100yr: finalPeriod.perHectare,
      verificationScheme: isGuarantee ? '5-Yearly Guarantee' : '10-Yearly Standard',
    },
    sections: resolvedSections.map(s => ({
      sectionNumber: s.sectionNumber,
      species: s.speciesLabel,
      modelCode: s.modelCode,
      spacing: s.spacing,
      yieldClass: s.yieldClass,
      managementRegime: s.managementRegime,
      area: s.area,
      lookupKey: s.lookupKey,
      clearfellAge: s.clearfellAge || null,
      clearfellCap: s.clearfellCap != null ? round(s.clearfellCap, 2) : null,
    })),
    periodResults,
    vintageSchedule,
  };
}

// ---------------------------------------------------------------------------
// PIU Vintage Schedule
// ---------------------------------------------------------------------------

function calculateVintageSchedule(periodResults, isGuarantee) {
  const schedule = [];
  let totalPIUsIssued = 0;

  if (isGuarantee) {
    // 5-yearly verification: every period gets its own vintage
    for (let i = 0; i < periodResults.length; i++) {
      const current = periodResults[i];
      const cumulativeNet = current.netAfterBuffer;

      // PIUs can only be issued when cumulative net is positive
      // and exceeds already-issued PIUs
      const increment = Math.max(0, cumulativeNet - totalPIUsIssued);
      totalPIUsIssued += increment;

      schedule.push({
        periodLabel: current.periodLabel,
        periodStartYear: current.periodStartYear,
        periodEndYear: current.periodEndYear,
        cumulativeNetAfterBuffer: cumulativeNet,
        totalPIUsIssued,
        periodIncrement: increment,
      });
    }
  } else {
    // 10-yearly verification: aggregate every 2 periods
    for (let i = 1; i < periodResults.length; i += 2) {
      const current = periodResults[i];
      const cumulativeNet = current.netAfterBuffer;

      // PIUs can only be issued when cumulative net is positive
      // and exceeds already-issued PIUs
      const increment = Math.max(0, cumulativeNet - totalPIUsIssued);
      totalPIUsIssued += increment;

      schedule.push({
        periodLabel: `${periodResults[i - 1].periodLabel} to ${current.periodLabel}`,
        periodStartYear: periodResults[i - 1].periodStartYear,
        periodEndYear: current.periodEndYear,
        cumulativeNetAfterBuffer: cumulativeNet,
        totalPIUsIssued,
        periodIncrement: increment,
      });
    }
  }

  return schedule;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function round(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export default { calculateCarbonCapture };
