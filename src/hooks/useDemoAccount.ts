import { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/axiosInstance';
import endPointApi from '@/utils/endPointApi';

export const useDemoAccount = () => {
  const [isDemoAccount, setIsDemoAccount] = useState<boolean>(false);
  const [demoNumbers, setDemoNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDemoNumbers = useCallback(async () => {
    try {
      const res = await api.get(endPointApi.getDemoNumbers);
      const numbers = res.data?.data?.value || [];
      setDemoNumbers(numbers);
      
      const userInfoStr = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
      const user = userInfoStr ? JSON.parse(userInfoStr) : null;
      
      if (user) {
        const isDemo = numbers.some((dn: string) => 
          String(user.number || '').endsWith(dn) || String(user.mobile || '').endsWith(dn)
        );
        setIsDemoAccount(isDemo);
      }
      return numbers;
    } catch (error) {
      console.error('Failed to fetch demo numbers', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemoNumbers();
  }, [fetchDemoNumbers]);

  // Sync function for immediate usage in click handlers
  const checkIsDemoAccount = async (): Promise<boolean> => {
    try {
      const numbers = await fetchDemoNumbers();
      const userInfoStr = typeof window !== 'undefined' ? localStorage.getItem('user_info') : null;
      const user = userInfoStr ? JSON.parse(userInfoStr) : null;
      
      if (!user) return false;
      return numbers.some((dn: string) => 
        String(user.number || '').endsWith(dn) || String(user.mobile || '').endsWith(dn)
      );
    } catch (e) {
      return false;
    }
  };

  return { isDemoAccount, demoNumbers, loading, checkIsDemoAccount };
};
