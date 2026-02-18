import { configureStore } from "@reduxjs/toolkit";
import chatAgentReducer from "../features/chatAgentSlice/chatAgentSlice";
const store = configureStore({
    reducer: {
        chatAgent: chatAgentReducer,
    },
    preloadedState: {}
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;