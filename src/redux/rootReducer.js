let initialCartItems = [];
try {
  const saved = localStorage.getItem("cartItems");
  if (saved) {
    initialCartItems = JSON.parse(saved);
  }
} catch (e) {
  initialCartItems = [];
}

const initialState = {
  loading: false,
  cartItems: Array.isArray(initialCartItems) ? initialCartItems : [],
};

export const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SHOW_LOADING":
      return { ...state, loading: true };

    case "HIDE_LOADING":
      return { ...state, loading: false };

    case "ADD_TO_CART": {
      const existing = state.cartItems.find((item) => item._id === action.payload._id);
      if (existing) {
        const nextQty = existing.quantity + 1;
        if (action.payload.stock && nextQty > action.payload.stock) {
          return state;
        }
        return {
          ...state,
          cartItems: state.cartItems.map((item) =>
            item._id === action.payload._id ? { ...item, quantity: nextQty } : item
          ),
        };
      }
      return {
        ...state,
        cartItems: [...state.cartItems, { ...action.payload, quantity: 1 }],
      };
    }

    case "UPDATE_CART": {
      const quantity = Math.max(1, Number(action.payload.quantity) || 1);
      return {
        ...state,
        cartItems: state.cartItems.map((item) =>
          item._id === action.payload._id ? { ...item, quantity } : item
        ),
      };
    }

    case "DELETE_FROM_CART":
      return {
        ...state,
        cartItems: state.cartItems.filter((item) => item._id !== action.payload._id),
      };

    case "CLEAR_CART":
      return {
        ...state,
        cartItems: [],
      };

    default:
      return state;
  }
};