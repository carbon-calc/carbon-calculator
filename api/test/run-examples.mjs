import { calculateCarbonCapture } from '../src/calculator.js';

const examples = {
  'Example 1 - Natural Regeneration': {
    projectName: 'Natural regeneration project 1',
    netArea: { value: 100, unit: 'qty:hectare' },
    isWoodlandCarbonGuarantee: false,
    plantingSections: [
      { sectionNumber: 1, species: 'ref:NatRegenScotsPine', plannedSpacing: { value: 5 }, yieldClassValue: 2, managementRegime: 'ref:NoThin', sectionArea: { value: 60 }, clearfellAge: { value: 0 } },
      { sectionNumber: 2, species: 'ref:NatRegenMixedBroadleaves', plannedSpacing: { value: 5 }, yieldClassValue: 2, managementRegime: 'ref:NoThin', sectionArea: { value: 20 }, clearfellAge: { value: 0 } },
    ],
    establishmentEmissions: [],
    soilCarbonEntries: [
      { country: 'ref:England', previousLanduse: 'ref:Seminatural', groundPreparation: 'ref:NegligibleDisturbance', soilCarbonArea: { value: 10 } },
      { country: 'ref:England', previousLanduse: 'ref:Seminatural', groundPreparation: 'ref:NoPreparation', soilCarbonArea: { value: 90 } },
    ],
    soilCarbonAccumulation: { accumulationArea: { value: 0 } },
    baselineAndLeakage: { isBaselineSignificant: false, isLeakageSignificant: false },
  },
  'Example 2 - Broadleaved Min Intervention': {
    projectName: 'Broadleaved Wood Phase 1',
    netArea: { value: 100, unit: 'qty:hectare' },
    isWoodlandCarbonGuarantee: false,
    plantingSections: [
      { sectionNumber: 1, species: 'ref:OakRoburPetraea', plannedSpacing: { value: 3 }, yieldClassValue: 4, managementRegime: 'ref:NoThin', sectionArea: { value: 50 }, clearfellAge: { value: 0 }, _usesShelters: true },
      { sectionNumber: 2, species: 'ref:BirchDownySilver', plannedSpacing: { value: 3 }, yieldClassValue: 6, managementRegime: 'ref:NoThin', sectionArea: { value: 30 }, clearfellAge: { value: 0 }, _usesSpiralGuards: true },
      { sectionNumber: 3, species: 'ref:CommonAlder', plannedSpacing: { value: 3 }, yieldClassValue: 2, managementRegime: 'ref:NoThin', sectionArea: { value: 10 }, clearfellAge: { value: 0 }, _usesSpiralGuards: true },
      { sectionNumber: 4, species: 'ref:SweetChestnut', plannedSpacing: { value: 3 }, yieldClassValue: 6, managementRegime: 'ref:NoThin', sectionArea: { value: 10 }, clearfellAge: { value: 0 }, _usesSpiralGuards: true },
    ],
    establishmentEmissions: [
      { emissionType: 'ref:HerbicideEmission', inputQuantity: { value: 100 } },
    ],
    soilCarbonEntries: [
      { country: 'ref:NorthernIreland', previousLanduse: 'ref:Pasture', groundPreparation: 'ref:NoPreparation', soilCarbonArea: { value: 50 } },
      { country: 'ref:NorthernIreland', previousLanduse: 'ref:Pasture', groundPreparation: 'ref:LowDisturbance', soilCarbonArea: { value: 50 } },
    ],
    soilCarbonAccumulation: { accumulationArea: { value: 0 } },
    baselineAndLeakage: { isBaselineSignificant: false, isLeakageSignificant: false },
  },
  'Example 3 - Mixed Conifer Thin': {
    projectName: 'Mixed conifer wood phase 1',
    netArea: { value: 100, unit: 'qty:hectare' },
    isWoodlandCarbonGuarantee: false,
    plantingSections: [
      { sectionNumber: 1, species: 'ref:SitkaSpruce', plannedSpacing: { value: 2 }, yieldClassValue: 24, managementRegime: 'ref:Thinned', sectionArea: { value: 30 }, clearfellAge: { value: 0 }, _usesFertiliser: true },
      { sectionNumber: 2, species: 'ref:DouglasFir', plannedSpacing: { value: 2 }, yieldClassValue: 18, managementRegime: 'ref:Thinned', sectionArea: { value: 20 }, clearfellAge: { value: 0 }, _usesFertiliser: true },
      { sectionNumber: 3, species: 'ref:HybridLarch', plannedSpacing: { value: 2 }, yieldClassValue: 14, managementRegime: 'ref:Thinned', sectionArea: { value: 10 }, clearfellAge: { value: 0 }, _usesFertiliser: true },
      { sectionNumber: 4, species: 'ref:OakRoburPetraea', plannedSpacing: { value: 3 }, yieldClassValue: 4, managementRegime: 'ref:NoThin', sectionArea: { value: 20 }, clearfellAge: { value: 0 } },
      { sectionNumber: 5, species: 'ref:BirchDownySilver', plannedSpacing: { value: 3 }, yieldClassValue: 4, managementRegime: 'ref:NoThin', sectionArea: { value: 20 }, clearfellAge: { value: 0 } },
    ],
    establishmentEmissions: [
      { emissionType: 'ref:MoundingEmission', inputQuantity: { value: 50 } },
      { emissionType: 'ref:SubsoilingEmission', inputQuantity: { value: 50 } },
      { emissionType: 'ref:HerbicideEmission', inputQuantity: { value: 200 } },
      { emissionType: 'ref:FencingEmission', inputQuantity: { value: 4400 } },
      { emissionType: 'ref:GateEmission', inputQuantity: { value: 4 } },
      { emissionType: 'ref:RoadBuildingEmission', inputQuantity: { value: 1 } },
    ],
    soilCarbonEntries: [
      { country: 'ref:Wales', previousLanduse: 'ref:Pasture', groundPreparation: 'ref:NoPreparation', soilCarbonArea: { value: 30 } },
      { country: 'ref:Wales', previousLanduse: 'ref:Pasture', groundPreparation: 'ref:LowDisturbance', soilCarbonArea: { value: 20 } },
      { country: 'ref:Wales', previousLanduse: 'ref:Pasture', groundPreparation: 'ref:HighDisturbance', soilCarbonArea: { value: 50 } },
    ],
    soilCarbonAccumulation: { accumulationArea: { value: 0 } },
    baselineAndLeakage: { isBaselineSignificant: false, isLeakageSignificant: false },
  },
  'Example 4 - Conifer Clearfell': {
    projectName: 'Conifer clearfell wood phase 1',
    netArea: { value: 100, unit: 'qty:hectare' },
    isWoodlandCarbonGuarantee: false,
    plantingSections: [
      { sectionNumber: 1, species: 'ref:SitkaSpruce', plannedSpacing: { value: 2 }, yieldClassValue: 24, managementRegime: 'ref:Thinned', sectionArea: { value: 30 }, clearfellAge: { value: 40 } },
      { sectionNumber: 2, species: 'ref:DouglasFir', plannedSpacing: { value: 2 }, yieldClassValue: 18, managementRegime: 'ref:Thinned', sectionArea: { value: 20 }, clearfellAge: { value: 50 } },
      { sectionNumber: 3, species: 'ref:OakRoburPetraea', plannedSpacing: { value: 3 }, yieldClassValue: 4, managementRegime: 'ref:NoThin', sectionArea: { value: 25 }, clearfellAge: { value: 0 }, _usesSpiralGuards: true, _usesVoleguards: true },
      { sectionNumber: 4, species: 'ref:BirchDownySilver', plannedSpacing: { value: 3 }, yieldClassValue: 4, managementRegime: 'ref:NoThin', sectionArea: { value: 25 }, clearfellAge: { value: 0 } },
    ],
    establishmentEmissions: [
      { emissionType: 'ref:MoundingEmission', inputQuantity: { value: 100 } },
      { emissionType: 'ref:HerbicideEmission', inputQuantity: { value: 200 } },
      { emissionType: 'ref:FencingEmission', inputQuantity: { value: 4400 } },
      { emissionType: 'ref:GateEmission', inputQuantity: { value: 4 } },
      { emissionType: 'ref:RoadBuildingEmission', inputQuantity: { value: 1 } },
    ],
    soilCarbonEntries: [
      { country: 'ref:Scotland', previousLanduse: 'ref:Pasture', groundPreparation: 'ref:LowDisturbance', soilCarbonArea: { value: 100 } },
    ],
    soilCarbonAccumulation: { accumulationArea: { value: 0 } },
    baselineAndLeakage: { isBaselineSignificant: false, isLeakageSignificant: false },
  },
};

for (const [name, project] of Object.entries(examples)) {
  const result = calculateCarbonCapture(project);
  console.log(`\n=== ${name} ===`);
  console.log('errors:', result.errors);
  console.log('keys:', result.sections.map(s => s.lookupKey));
  console.log('est:', result.summary.totalEstablishmentEmissions);
  console.log('soil:', result.summary.soilEmissionYear0);
  for (const p of result.periodResults) {
    console.log(`  p${p.periodIndex}: bio=${p.totalBiomass} adj=${p.adjustedBiomass} est=${p.establishmentEmissions} soil=${p.totalSoilCarbon} gross=${p.grossSequestration} net=${p.netCarbon} buf=${p.bufferDeduction} claim=${p.netAfterBuffer} /ha=${p.perHectare}`);
  }
}
