// src/lib/cancerTypes.ts
//
// Cancer types that get their own SEO landing page at /trials/[slug].
// `query` is what we send to ClinicalTrials.gov as query.cond; `name` must
// match an entry in CANCER_TYPES (src/types) so "Search these trials" can
// pre-fill the search form.

export interface CancerTypePage {
  slug: string;
  name: string;
  query: string;
  blurb: string;
}

export const CANCER_TYPE_PAGES: CancerTypePage[] = [
  { slug: 'breast-cancer', name: 'Breast Cancer', query: 'breast cancer',
    blurb: 'Trials for every subtype — HR-positive, HER2-positive and triple-negative — from early-stage to metastatic disease.' },
  { slug: 'lung-cancer', name: 'Lung Cancer', query: 'lung cancer',
    blurb: 'Non-small cell and small cell lung cancer trials, including targeted therapies for EGFR, ALK, KRAS G12C and other mutations.' },
  { slug: 'non-small-cell-lung-cancer', name: 'Non-Small Cell Lung Cancer', query: 'non-small cell lung cancer',
    blurb: 'NSCLC trials testing targeted therapy, immunotherapy and combinations, often matched to a specific biomarker.' },
  { slug: 'colorectal-cancer', name: 'Colorectal Cancer', query: 'colorectal cancer',
    blurb: 'Colon and rectal cancer trials, including options for MSI-high, KRAS, BRAF V600E and HER2-positive tumors.' },
  { slug: 'prostate-cancer', name: 'Prostate Cancer', query: 'prostate cancer',
    blurb: 'Trials for localized, hormone-sensitive and castration-resistant prostate cancer, including PSMA-targeted treatments.' },
  { slug: 'pancreatic-cancer', name: 'Pancreatic Cancer', query: 'pancreatic cancer',
    blurb: 'Trials for resectable, locally advanced and metastatic pancreatic cancer, where clinical trials are often a first-line option.' },
  { slug: 'ovarian-cancer', name: 'Ovarian Cancer', query: 'ovarian cancer',
    blurb: 'Trials including PARP inhibitors, antibody-drug conjugates and options for platinum-resistant disease.' },
  { slug: 'melanoma', name: 'Melanoma', query: 'melanoma',
    blurb: 'Immunotherapy, BRAF-targeted and cell-therapy trials for melanoma at every stage.' },
  { slug: 'leukemia', name: 'Leukemia', query: 'leukemia',
    blurb: 'Trials for acute and chronic leukemias, including AML, ALL and CLL, plus CAR-T and transplant studies.' },
  { slug: 'acute-myeloid-leukemia', name: 'Acute Myeloid Leukemia', query: 'acute myeloid leukemia',
    blurb: 'AML trials including FLT3- and IDH-targeted therapies and options for relapsed or refractory disease.' },
  { slug: 'lymphoma', name: 'Lymphoma', query: 'lymphoma',
    blurb: 'Hodgkin and non-Hodgkin lymphoma trials, including CAR-T, bispecific antibodies and targeted agents.' },
  { slug: 'multiple-myeloma', name: 'Multiple Myeloma', query: 'multiple myeloma',
    blurb: 'Myeloma trials testing CAR-T, bispecifics and new combinations for newly diagnosed and relapsed patients.' },
  { slug: 'bladder-cancer', name: 'Bladder Cancer', query: 'bladder cancer',
    blurb: 'Trials for non-muscle-invasive, muscle-invasive and metastatic urothelial cancer.' },
  { slug: 'kidney-cancer', name: 'Kidney Cancer', query: 'kidney cancer',
    blurb: 'Renal cell carcinoma trials, including immunotherapy combinations and targeted therapy.' },
  { slug: 'liver-cancer', name: 'Liver Cancer', query: 'liver cancer',
    blurb: 'Hepatocellular carcinoma and bile duct cancer trials, including local and systemic treatments.' },
  { slug: 'glioblastoma', name: 'Glioblastoma', query: 'glioblastoma',
    blurb: 'Trials for newly diagnosed and recurrent glioblastoma, including vaccines, devices and targeted drugs.' },
  { slug: 'head-and-neck-cancer', name: 'Head and Neck Cancer', query: 'head and neck cancer',
    blurb: 'Trials for oral, throat and larynx cancers, including HPV-related disease.' },
  { slug: 'gastric-cancer', name: 'Gastric Cancer', query: 'gastric cancer',
    blurb: 'Stomach and gastroesophageal junction cancer trials, including HER2- and Claudin 18.2-targeted therapies.' },
  { slug: 'esophageal-cancer', name: 'Esophageal Cancer', query: 'esophageal cancer',
    blurb: 'Trials for squamous cell and adenocarcinoma of the esophagus at every stage.' },
  { slug: 'endometrial-cancer', name: 'Endometrial Cancer', query: 'endometrial cancer',
    blurb: 'Uterine and endometrial cancer trials, including options for mismatch-repair-deficient tumors.' },
  { slug: 'cervical-cancer', name: 'Cervical Cancer', query: 'cervical cancer',
    blurb: 'Trials for locally advanced, recurrent and metastatic cervical cancer.' },
  { slug: 'thyroid-cancer', name: 'Thyroid Cancer', query: 'thyroid cancer',
    blurb: 'Differentiated, medullary and anaplastic thyroid cancer trials, including RET- and BRAF-targeted therapy.' },
  { slug: 'sarcoma', name: 'Sarcoma', query: 'sarcoma',
    blurb: 'Soft tissue and bone sarcoma trials, which are rare cancers where trials are especially important.' },
  { slug: 'mesothelioma', name: 'Mesothelioma', query: 'mesothelioma',
    blurb: 'Pleural and peritoneal mesothelioma trials, including immunotherapy and surgery studies.' },
];

export function getCancerTypePage(slug: string): CancerTypePage | undefined {
  return CANCER_TYPE_PAGES.find((c) => c.slug === slug);
}
