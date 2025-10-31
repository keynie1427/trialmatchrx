export type Trial = {
  nctId: string;
  title: string;
  condition?: string;
  phase?: string;
  status?: string;
  briefSummary?: string;
  eligibility?: string;
  locations?: { name?: string; city?: string; state?: string; phone?: string }[];
};
