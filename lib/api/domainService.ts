import apiClient from './apiClient';

export interface DomainsResponse {
  domains: string[];
}

export const domainService = {
  async getDomains(): Promise<string[]> {
    try {
      const res = await apiClient.get<DomainsResponse>('/api/domains');
      if (res.data?.domains?.length) return res.data.domains;
      return [];
    } catch (e) {
      console.warn('[domainService.getDomains] fallback to empty list', e);
      return [];
    }
  }
};

export default domainService;
