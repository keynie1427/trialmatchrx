// FDA-Approved Cancer Drugs and NCI-Designated Therapies
// Source: FDA Oncology Drug Approvals, NCI Drug Dictionary

export interface ApprovedTherapy {
  name: string;
  genericName?: string;
  brandNames: string[];
  type: 'targeted' | 'immunotherapy' | 'chemotherapy' | 'hormone' | 'other';
  approvedFor: string[];
  biomarkers?: string[];
  fdaApproved: boolean;
  nciDesignated: boolean;
}

// FDA-Approved Targeted Therapies
export const FDA_APPROVED_THERAPIES: ApprovedTherapy[] = [
  // EGFR Inhibitors
  { name: 'Osimertinib', brandNames: ['Tagrisso'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['EGFR', 'EGFR T790M'], fdaApproved: true, nciDesignated: true },
  { name: 'Erlotinib', brandNames: ['Tarceva'], type: 'targeted', approvedFor: ['NSCLC', 'Pancreatic Cancer'], biomarkers: ['EGFR'], fdaApproved: true, nciDesignated: true },
  { name: 'Gefitinib', brandNames: ['Iressa'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['EGFR'], fdaApproved: true, nciDesignated: true },
  { name: 'Afatinib', brandNames: ['Gilotrif'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['EGFR'], fdaApproved: true, nciDesignated: true },
  { name: 'Dacomitinib', brandNames: ['Vizimpro'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['EGFR'], fdaApproved: true, nciDesignated: true },
  
  // ALK Inhibitors
  { name: 'Crizotinib', brandNames: ['Xalkori'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['ALK', 'ROS1', 'MET'], fdaApproved: true, nciDesignated: true },
  { name: 'Ceritinib', brandNames: ['Zykadia'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['ALK'], fdaApproved: true, nciDesignated: true },
  { name: 'Alectinib', brandNames: ['Alecensa'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['ALK'], fdaApproved: true, nciDesignated: true },
  { name: 'Brigatinib', brandNames: ['Alunbrig'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['ALK'], fdaApproved: true, nciDesignated: true },
  { name: 'Lorlatinib', brandNames: ['Lorbrena'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['ALK', 'ROS1'], fdaApproved: true, nciDesignated: true },
  
  // KRAS Inhibitors
  { name: 'Sotorasib', brandNames: ['Lumakras'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['KRAS G12C'], fdaApproved: true, nciDesignated: true },
  { name: 'Adagrasib', brandNames: ['Krazati'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['KRAS G12C'], fdaApproved: true, nciDesignated: true },
  
  // HER2 Inhibitors
  { name: 'Trastuzumab', brandNames: ['Herceptin'], type: 'targeted', approvedFor: ['Breast Cancer', 'Gastric Cancer'], biomarkers: ['HER2'], fdaApproved: true, nciDesignated: true },
  { name: 'Pertuzumab', brandNames: ['Perjeta'], type: 'targeted', approvedFor: ['Breast Cancer'], biomarkers: ['HER2'], fdaApproved: true, nciDesignated: true },
  { name: 'Trastuzumab Deruxtecan', brandNames: ['Enhertu', 'T-DXd'], type: 'targeted', approvedFor: ['Breast Cancer', 'NSCLC', 'Gastric Cancer'], biomarkers: ['HER2'], fdaApproved: true, nciDesignated: true },
  { name: 'Lapatinib', brandNames: ['Tykerb'], type: 'targeted', approvedFor: ['Breast Cancer'], biomarkers: ['HER2'], fdaApproved: true, nciDesignated: true },
  { name: 'Neratinib', brandNames: ['Nerlynx'], type: 'targeted', approvedFor: ['Breast Cancer'], biomarkers: ['HER2'], fdaApproved: true, nciDesignated: true },
  { name: 'Tucatinib', brandNames: ['Tukysa'], type: 'targeted', approvedFor: ['Breast Cancer'], biomarkers: ['HER2'], fdaApproved: true, nciDesignated: true },
  
  // BRAF Inhibitors
  { name: 'Vemurafenib', brandNames: ['Zelboraf'], type: 'targeted', approvedFor: ['Melanoma'], biomarkers: ['BRAF V600E'], fdaApproved: true, nciDesignated: true },
  { name: 'Dabrafenib', brandNames: ['Tafinlar'], type: 'targeted', approvedFor: ['Melanoma', 'NSCLC'], biomarkers: ['BRAF V600E', 'BRAF'], fdaApproved: true, nciDesignated: true },
  { name: 'Encorafenib', brandNames: ['Braftovi'], type: 'targeted', approvedFor: ['Melanoma', 'Colorectal Cancer'], biomarkers: ['BRAF V600E'], fdaApproved: true, nciDesignated: true },
  
  // MEK Inhibitors
  { name: 'Trametinib', brandNames: ['Mekinist'], type: 'targeted', approvedFor: ['Melanoma', 'NSCLC'], biomarkers: ['BRAF'], fdaApproved: true, nciDesignated: true },
  { name: 'Cobimetinib', brandNames: ['Cotellic'], type: 'targeted', approvedFor: ['Melanoma'], biomarkers: ['BRAF'], fdaApproved: true, nciDesignated: true },
  { name: 'Binimetinib', brandNames: ['Mektovi'], type: 'targeted', approvedFor: ['Melanoma'], biomarkers: ['BRAF'], fdaApproved: true, nciDesignated: true },
  
  // NTRK Inhibitors
  { name: 'Larotrectinib', brandNames: ['Vitrakvi'], type: 'targeted', approvedFor: ['Solid Tumors'], biomarkers: ['NTRK'], fdaApproved: true, nciDesignated: true },
  { name: 'Entrectinib', brandNames: ['Rozlytrek'], type: 'targeted', approvedFor: ['Solid Tumors', 'NSCLC'], biomarkers: ['NTRK', 'ROS1'], fdaApproved: true, nciDesignated: true },
  
  // RET Inhibitors
  { name: 'Selpercatinib', brandNames: ['Retevmo'], type: 'targeted', approvedFor: ['NSCLC', 'Thyroid Cancer'], biomarkers: ['RET'], fdaApproved: true, nciDesignated: true },
  { name: 'Pralsetinib', brandNames: ['Gavreto'], type: 'targeted', approvedFor: ['NSCLC', 'Thyroid Cancer'], biomarkers: ['RET'], fdaApproved: true, nciDesignated: true },
  
  // MET Inhibitors
  { name: 'Capmatinib', brandNames: ['Tabrecta'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['MET', 'MET Exon 14'], fdaApproved: true, nciDesignated: true },
  { name: 'Tepotinib', brandNames: ['Tepmetko'], type: 'targeted', approvedFor: ['NSCLC'], biomarkers: ['MET', 'MET Exon 14'], fdaApproved: true, nciDesignated: true },
  
  // CDK4/6 Inhibitors
  { name: 'Palbociclib', brandNames: ['Ibrance'], type: 'targeted', approvedFor: ['Breast Cancer'], biomarkers: ['ER+', 'HER2-'], fdaApproved: true, nciDesignated: true },
  { name: 'Ribociclib', brandNames: ['Kisqali'], type: 'targeted', approvedFor: ['Breast Cancer'], biomarkers: ['ER+', 'HER2-'], fdaApproved: true, nciDesignated: true },
  { name: 'Abemaciclib', brandNames: ['Verzenio'], type: 'targeted', approvedFor: ['Breast Cancer'], biomarkers: ['ER+', 'HER2-'], fdaApproved: true, nciDesignated: true },
  
  // PARP Inhibitors
  { name: 'Olaparib', brandNames: ['Lynparza'], type: 'targeted', approvedFor: ['Ovarian Cancer', 'Breast Cancer', 'Prostate Cancer', 'Pancreatic Cancer'], biomarkers: ['BRCA1', 'BRCA2'], fdaApproved: true, nciDesignated: true },
  { name: 'Rucaparib', brandNames: ['Rubraca'], type: 'targeted', approvedFor: ['Ovarian Cancer', 'Prostate Cancer'], biomarkers: ['BRCA1', 'BRCA2'], fdaApproved: true, nciDesignated: true },
  { name: 'Niraparib', brandNames: ['Zejula'], type: 'targeted', approvedFor: ['Ovarian Cancer'], biomarkers: ['BRCA1', 'BRCA2'], fdaApproved: true, nciDesignated: true },
  { name: 'Talazoparib', brandNames: ['Talzenna'], type: 'targeted', approvedFor: ['Breast Cancer'], biomarkers: ['BRCA1', 'BRCA2'], fdaApproved: true, nciDesignated: true },
  
  // PIK3CA Inhibitors
  { name: 'Alpelisib', brandNames: ['Piqray'], type: 'targeted', approvedFor: ['Breast Cancer'], biomarkers: ['PIK3CA'], fdaApproved: true, nciDesignated: true },
  
  // BCR-ABL Inhibitors
  { name: 'Imatinib', brandNames: ['Gleevec'], type: 'targeted', approvedFor: ['CML', 'GIST'], biomarkers: ['BCR-ABL'], fdaApproved: true, nciDesignated: true },
  { name: 'Dasatinib', brandNames: ['Sprycel'], type: 'targeted', approvedFor: ['CML', 'ALL'], biomarkers: ['BCR-ABL'], fdaApproved: true, nciDesignated: true },
  { name: 'Nilotinib', brandNames: ['Tasigna'], type: 'targeted', approvedFor: ['CML'], biomarkers: ['BCR-ABL'], fdaApproved: true, nciDesignated: true },
  { name: 'Bosutinib', brandNames: ['Bosulif'], type: 'targeted', approvedFor: ['CML'], biomarkers: ['BCR-ABL'], fdaApproved: true, nciDesignated: true },
  { name: 'Ponatinib', brandNames: ['Iclusig'], type: 'targeted', approvedFor: ['CML', 'ALL'], biomarkers: ['BCR-ABL'], fdaApproved: true, nciDesignated: true },
  
  // FLT3 Inhibitors
  { name: 'Midostaurin', brandNames: ['Rydapt'], type: 'targeted', approvedFor: ['AML'], biomarkers: ['FLT3'], fdaApproved: true, nciDesignated: true },
  { name: 'Gilteritinib', brandNames: ['Xospata'], type: 'targeted', approvedFor: ['AML'], biomarkers: ['FLT3'], fdaApproved: true, nciDesignated: true },
  
  // IDH Inhibitors
  { name: 'Ivosidenib', brandNames: ['Tibsovo'], type: 'targeted', approvedFor: ['AML', 'Cholangiocarcinoma'], biomarkers: ['IDH1'], fdaApproved: true, nciDesignated: true },
  { name: 'Enasidenib', brandNames: ['Idhifa'], type: 'targeted', approvedFor: ['AML'], biomarkers: ['IDH2'], fdaApproved: true, nciDesignated: true },
  
  // FGFR Inhibitors
  { name: 'Erdafitinib', brandNames: ['Balversa'], type: 'targeted', approvedFor: ['Bladder Cancer'], biomarkers: ['FGFR'], fdaApproved: true, nciDesignated: true },
  { name: 'Pemigatinib', brandNames: ['Pemazyre'], type: 'targeted', approvedFor: ['Cholangiocarcinoma'], biomarkers: ['FGFR'], fdaApproved: true, nciDesignated: true },
  
  // Immunotherapy - PD-1/PD-L1 Inhibitors
  { name: 'Pembrolizumab', brandNames: ['Keytruda'], type: 'immunotherapy', approvedFor: ['NSCLC', 'Melanoma', 'Head and Neck Cancer', 'Hodgkin Lymphoma', 'Bladder Cancer', 'MSI-H Tumors'], biomarkers: ['PD-L1', 'MSI-H', 'TMB-H'], fdaApproved: true, nciDesignated: true },
  { name: 'Nivolumab', brandNames: ['Opdivo'], type: 'immunotherapy', approvedFor: ['NSCLC', 'Melanoma', 'Kidney Cancer', 'Hodgkin Lymphoma', 'Head and Neck Cancer'], biomarkers: ['PD-L1'], fdaApproved: true, nciDesignated: true },
  { name: 'Atezolizumab', brandNames: ['Tecentriq'], type: 'immunotherapy', approvedFor: ['NSCLC', 'Bladder Cancer', 'Breast Cancer', 'Liver Cancer'], biomarkers: ['PD-L1'], fdaApproved: true, nciDesignated: true },
  { name: 'Durvalumab', brandNames: ['Imfinzi'], type: 'immunotherapy', approvedFor: ['NSCLC', 'Bladder Cancer'], biomarkers: ['PD-L1'], fdaApproved: true, nciDesignated: true },
  { name: 'Avelumab', brandNames: ['Bavencio'], type: 'immunotherapy', approvedFor: ['Merkel Cell Carcinoma', 'Bladder Cancer', 'Kidney Cancer'], biomarkers: ['PD-L1'], fdaApproved: true, nciDesignated: true },
  { name: 'Cemiplimab', brandNames: ['Libtayo'], type: 'immunotherapy', approvedFor: ['Cutaneous Squamous Cell Carcinoma', 'NSCLC'], biomarkers: ['PD-L1'], fdaApproved: true, nciDesignated: true },
  
  // CTLA-4 Inhibitors
  { name: 'Ipilimumab', brandNames: ['Yervoy'], type: 'immunotherapy', approvedFor: ['Melanoma', 'Kidney Cancer', 'Colorectal Cancer'], biomarkers: ['MSI-H'], fdaApproved: true, nciDesignated: true },
  { name: 'Tremelimumab', brandNames: ['Imjudo'], type: 'immunotherapy', approvedFor: ['Liver Cancer', 'NSCLC'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  
  // CAR-T Therapies
  { name: 'Tisagenlecleucel', brandNames: ['Kymriah'], type: 'immunotherapy', approvedFor: ['ALL', 'DLBCL'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Axicabtagene Ciloleucel', brandNames: ['Yescarta'], type: 'immunotherapy', approvedFor: ['DLBCL', 'Follicular Lymphoma'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Brexucabtagene Autoleucel', brandNames: ['Tecartus'], type: 'immunotherapy', approvedFor: ['Mantle Cell Lymphoma', 'ALL'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Lisocabtagene Maraleucel', brandNames: ['Breyanzi'], type: 'immunotherapy', approvedFor: ['DLBCL'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Idecabtagene Vicleucel', brandNames: ['Abecma'], type: 'immunotherapy', approvedFor: ['Multiple Myeloma'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Ciltacabtagene Autoleucel', brandNames: ['Carvykti'], type: 'immunotherapy', approvedFor: ['Multiple Myeloma'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  
  // VEGF/Angiogenesis Inhibitors
  { name: 'Bevacizumab', brandNames: ['Avastin'], type: 'targeted', approvedFor: ['Colorectal Cancer', 'NSCLC', 'Kidney Cancer', 'Ovarian Cancer', 'Cervical Cancer', 'Glioblastoma'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Ramucirumab', brandNames: ['Cyramza'], type: 'targeted', approvedFor: ['Gastric Cancer', 'NSCLC', 'Colorectal Cancer', 'Liver Cancer'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Sorafenib', brandNames: ['Nexavar'], type: 'targeted', approvedFor: ['Liver Cancer', 'Kidney Cancer', 'Thyroid Cancer'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Sunitinib', brandNames: ['Sutent'], type: 'targeted', approvedFor: ['Kidney Cancer', 'GIST', 'Pancreatic NET'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Pazopanib', brandNames: ['Votrient'], type: 'targeted', approvedFor: ['Kidney Cancer', 'Soft Tissue Sarcoma'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Axitinib', brandNames: ['Inlyta'], type: 'targeted', approvedFor: ['Kidney Cancer'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Cabozantinib', brandNames: ['Cabometyx', 'Cometriq'], type: 'targeted', approvedFor: ['Kidney Cancer', 'Liver Cancer', 'Thyroid Cancer'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Lenvatinib', brandNames: ['Lenvima'], type: 'targeted', approvedFor: ['Thyroid Cancer', 'Liver Cancer', 'Kidney Cancer', 'Endometrial Cancer'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Regorafenib', brandNames: ['Stivarga'], type: 'targeted', approvedFor: ['Colorectal Cancer', 'GIST', 'Liver Cancer'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  
  // mTOR Inhibitors
  { name: 'Everolimus', brandNames: ['Afinitor'], type: 'targeted', approvedFor: ['Breast Cancer', 'Kidney Cancer', 'Pancreatic NET'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Temsirolimus', brandNames: ['Torisel'], type: 'targeted', approvedFor: ['Kidney Cancer'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  
  // Hormone Therapies
  { name: 'Tamoxifen', brandNames: ['Nolvadex'], type: 'hormone', approvedFor: ['Breast Cancer'], biomarkers: ['ER+'], fdaApproved: true, nciDesignated: true },
  { name: 'Letrozole', brandNames: ['Femara'], type: 'hormone', approvedFor: ['Breast Cancer'], biomarkers: ['ER+'], fdaApproved: true, nciDesignated: true },
  { name: 'Anastrozole', brandNames: ['Arimidex'], type: 'hormone', approvedFor: ['Breast Cancer'], biomarkers: ['ER+'], fdaApproved: true, nciDesignated: true },
  { name: 'Exemestane', brandNames: ['Aromasin'], type: 'hormone', approvedFor: ['Breast Cancer'], biomarkers: ['ER+'], fdaApproved: true, nciDesignated: true },
  { name: 'Fulvestrant', brandNames: ['Faslodex'], type: 'hormone', approvedFor: ['Breast Cancer'], biomarkers: ['ER+'], fdaApproved: true, nciDesignated: true },
  { name: 'Enzalutamide', brandNames: ['Xtandi'], type: 'hormone', approvedFor: ['Prostate Cancer'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Abiraterone', brandNames: ['Zytiga'], type: 'hormone', approvedFor: ['Prostate Cancer'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Apalutamide', brandNames: ['Erleada'], type: 'hormone', approvedFor: ['Prostate Cancer'], biomarkers: [], fdaApproved: true, nciDesignated: true },
  { name: 'Darolutamide', brandNames: ['Nubeqa'], type: 'hormone', approvedFor: ['Prostate Cancer'], biomarkers: [], fdaApproved: true, nciDesignated: true },
];

// Create lookup maps for fast matching
export const DRUG_NAME_MAP = new Map<string, ApprovedTherapy>();
export const BRAND_NAME_MAP = new Map<string, ApprovedTherapy>();

// Initialize maps
FDA_APPROVED_THERAPIES.forEach(therapy => {
  DRUG_NAME_MAP.set(therapy.name.toLowerCase(), therapy);
  therapy.brandNames.forEach(brand => {
    BRAND_NAME_MAP.set(brand.toLowerCase(), therapy);
  });
});

// Function to find matching therapies from trial interventions
export function findMatchingTherapies(interventions: Array<{ name: string; type?: string }>): {
  fdaApproved: ApprovedTherapy[];
  nciDesignated: ApprovedTherapy[];
} {
  const fdaApproved: ApprovedTherapy[] = [];
  const nciDesignated: ApprovedTherapy[] = [];
  const seen = new Set<string>();

  for (const intervention of interventions) {
    const name = intervention.name.toLowerCase();
    
    // Check generic name
    for (const [drugName, therapy] of DRUG_NAME_MAP) {
      if (name.includes(drugName) && !seen.has(therapy.name)) {
        seen.add(therapy.name);
        if (therapy.fdaApproved) fdaApproved.push(therapy);
        if (therapy.nciDesignated) nciDesignated.push(therapy);
      }
    }
    
    // Check brand names
    for (const [brandName, therapy] of BRAND_NAME_MAP) {
      if (name.includes(brandName) && !seen.has(therapy.name)) {
        seen.add(therapy.name);
        if (therapy.fdaApproved) fdaApproved.push(therapy);
        if (therapy.nciDesignated) nciDesignated.push(therapy);
      }
    }
  }

  return { fdaApproved, nciDesignated };
}

// Function to check if therapy matches trial's biomarkers
export function getTherapyBiomarkerMatch(therapy: ApprovedTherapy, trialBiomarkers: string[]): boolean {
  if (!therapy.biomarkers || therapy.biomarkers.length === 0) return false;
  return therapy.biomarkers.some(b => 
    trialBiomarkers.some(tb => tb.toUpperCase().includes(b.toUpperCase()))
  );
}

// Generate NCI Drug Dictionary URL for a therapy
export function getNciDrugUrl(drugName: string): string {
  const slug = drugName.toLowerCase().replace(/\s+/g, '-');
  return `https://www.cancer.gov/publications/dictionaries/cancer-drug/def/${slug}`;
}

// Generate FDA drug label URL (DailyMed)
export function getFdaDrugUrl(brandName: string): string {
  const encoded = encodeURIComponent(brandName);
  return `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encoded}`;
}

// Generate Drugs.com URL for more consumer-friendly info
export function getDrugsComUrl(drugName: string): string {
  const slug = drugName.toLowerCase().replace(/\s+/g, '-');
  return `https://www.drugs.com/${slug}.html`;
}
