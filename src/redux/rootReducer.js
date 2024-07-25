const intialState = {
    loading:false,
    cartItems:[] ,
};
export const rootReducer = (state=intialState, action) => {
    switch (action.type) {
        case "ADD_TO_CART":
            const existingCartItem = state.cartItems.find(item => item._id === action.payload._id);
            if (existingCartItem) {
                const updatedCartItems = state.cartItems.map(item => {
                    if (item._id === action.payload._id) {
                        return { ...item, quantity: item.quantity + 1 };
                    }
                    return item;
                });
                return {
                    ...state,
                    cartItems: updatedCartItems,
                };
            } else {
                return {
                    ...state,
                    cartItems: [...state.cartItems, { ...action.payload, quantity: 1 }],
                };
            }
        case "UPDATE_CART":
            return {
                ...state,
                cartItems: state.cartItems.map(item => item._id === action.payload._id ? {
                    ...item,quantity:action.payload.quantity
                } : item),  

            };
        case "DELETE_FROM_CART":
            return{
                ...state,
                cartItems: state.cartItems.filter(item => item._id !== action.payload._id )
            }
        default:
             return  state;
            
          
    }

};