import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  productService,
  billService,
  dealerService,
  chargeService,
  userService,
} from "../services";

export const queryKeys = {
  products: ["products"],
  bills: ["bills"],
  dealers: ["dealers"],
  charges: ["charges"],
  users: ["users"],
  stockAnalytics: ["stockAnalytics"],
};

// ==========================================
// Product / Item Queries & Mutations
// ==========================================
export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: () => productService.getProducts(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();

  const addProduct = useMutation({
    mutationFn: (payload) => productService.addProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAnalytics });
    },
  });

  const editProduct = useMutation({
    mutationFn: (payload) => productService.editProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAnalytics });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (itemId) => productService.deleteProduct(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAnalytics });
    },
  });

  return { addProduct, editProduct, deleteProduct };
}

// ==========================================
// Bill / Invoice Queries & Mutations
// ==========================================
export function useBills() {
  return useQuery({
    queryKey: queryKeys.bills,
    queryFn: () => billService.getBills(),
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

export function useBillMutations() {
  const queryClient = useQueryClient();

  const editBill = useMutation({
    mutationFn: (payload) => billService.editBill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bills });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAnalytics });
    },
  });

  const deleteBill = useMutation({
    mutationFn: (billId) => billService.deleteBill(billId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bills });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAnalytics });
    },
  });

  return { editBill, deleteBill };
}

export function useCheckoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => billService.createBill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.bills });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAnalytics });
    },
  });
}

// ==========================================
// Dealer / Supplier Queries & Mutations
// ==========================================
export function useDealers() {
  return useQuery({
    queryKey: queryKeys.dealers,
    queryFn: () => dealerService.getDealers(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDealerMutations() {
  const queryClient = useQueryClient();

  const addDealer = useMutation({
    mutationFn: (payload) => dealerService.addDealer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dealers });
    },
  });

  const editDealer = useMutation({
    mutationFn: (payload) => dealerService.editDealer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dealers });
    },
  });

  const deleteDealer = useMutation({
    mutationFn: (dealerId) => dealerService.deleteDealer(dealerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dealers });
    },
  });

  return { addDealer, editDealer, deleteDealer };
}

// ==========================================
// Charge / Expense Queries & Mutations
// ==========================================
export function useCharges() {
  return useQuery({
    queryKey: queryKeys.charges,
    queryFn: () => chargeService.getCharges(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useChargeMutations() {
  const queryClient = useQueryClient();

  const addCharge = useMutation({
    mutationFn: (payload) => chargeService.addCharge(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.charges });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAnalytics });
    },
  });

  const editCharge = useMutation({
    mutationFn: (payload) => chargeService.editCharge(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.charges });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAnalytics });
    },
  });

  const deleteCharge = useMutation({
    mutationFn: (chargeId) => chargeService.deleteCharge(chargeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.charges });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAnalytics });
    },
  });

  return { addCharge, editCharge, deleteCharge };
}

// ==========================================
// User Management Queries & Mutations (Admin)
// ==========================================
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => userService.getUsers(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: (payload) => userService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ userId, active }) => userService.toggleStatus(userId, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }) => userService.updateRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (userId) => userService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });

  return { createUser, toggleStatus, updateRole, deleteUser };
}
