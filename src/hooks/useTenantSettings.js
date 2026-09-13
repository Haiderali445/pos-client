import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api/client";
import { getEffectiveUser } from "../utils/permissions";

export const TENANT_DEFAULTS = {
  name: "Hardware Point",
  currency: "PKR",
  taxStrategy: "zero",
  taxRate: 0,
  receiptTemplate: "thermal80mm",
  contactPhone: "+92 (300) 000-0000",
  address: "Main Retail Terminal, Branch 01",
};

async function fetchTenantSettings() {
  try {
    const res = await apiClient.get("/tenant/settings");
    return { ...TENANT_DEFAULTS, ...res.data };
  } catch {
    return TENANT_DEFAULTS;
  }
}

async function saveTenantSettings(payload) {
  const res = await apiClient.put("/tenant/settings", payload);
  return res.data;
}

export function useTenantSettings() {
  const queryClient = useQueryClient();
  const user = getEffectiveUser();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  const { data: tenantSettings = TENANT_DEFAULTS, isLoading } = useQuery({
    queryKey: ["tenantSettings"],
    queryFn: fetchTenantSettings,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const updateSettings = useMutation({
    mutationFn: saveTenantSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(["tenantSettings"], (old) => ({ ...old, ...data }));
    },
  });

  return { tenantSettings, isLoading, isAdmin, updateSettings };
}

export default useTenantSettings;
