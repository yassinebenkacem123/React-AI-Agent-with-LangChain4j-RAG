import { createAction, createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ChatAgentState = {
    lastQuery: string;
    answer: string;
    status: "idle" | "loading" | "streaming" | "succeeded" | "failed";
    error: string | null;
};

const initialState: ChatAgentState = {
    lastQuery: "",
    answer: "",
    status: "idle",
    error: null,
};

export const streamChunk = createAction<string>("chatAgent/streamChunk");

let activeController: AbortController | null = null;

export const submitForm = createAsyncThunk<
    { query: string; answer: string },
    string,
    { rejectValue: string }
>("chatAgent/submitForm", async (query, thunkApi) => {
    const { rejectWithValue, dispatch } = thunkApi;

    if (activeController) {
        activeController.abort();
    }
    const controller = new AbortController();
    activeController = controller;

    try {
        const url = `/chat?query=${encodeURIComponent(query)}`;
        const res = await fetch(url, { method: "GET", signal: controller.signal });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            return rejectWithValue(text || `Request failed (${res.status})`);
        }

        const contentType = res.headers.get("content-type") ?? "";
        const isJson = contentType.includes("application/json");
        const isSse = contentType.includes("text/event-stream");

        if (isJson) {
            const data = await res.json();
            const answer = Array.isArray(data)
                ? data.map(String).join("")
                : typeof data === "string"
                    ? data
                    : JSON.stringify(data);
            return { query, answer };
        }

        const body = res.body;
        if (!body) {
            const answer = await res.text();
            return { query, answer };
        }

        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullAnswer = "";
        let stop = false;

        while (!stop) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunkText = decoder.decode(value, { stream: true });

            if (isSse) {
                buffer += chunkText.replace(/\r\n/g, "\n");

                let boundaryIndex = buffer.indexOf("\n\n");
                while (boundaryIndex !== -1) {
                    const rawEvent = buffer.slice(0, boundaryIndex);
                    buffer = buffer.slice(boundaryIndex + 2);

                    const dataLines = rawEvent
                        .split("\n")
                        .filter((line) => line.startsWith("data:"))
                        .map((line) => line.replace(/^data:\s?/, ""));

                    const data = dataLines.join("\n");
                    if (data === "[DONE]") {
                        stop = true;
                        break;
                    }
                    if (data) {
                        fullAnswer += data;
                        dispatch(streamChunk(data));
                    }

                    boundaryIndex = buffer.indexOf("\n\n");
                }
            } else {
                fullAnswer += chunkText;
                dispatch(streamChunk(chunkText));
            }
        }

        return { query, answer: fullAnswer };
    } catch (e) {
        if (controller.signal.aborted) {
            return rejectWithValue("Cancelled");
        }
        const message = e instanceof Error ? e.message : "Unknown error";
        return rejectWithValue(message);
    } finally {
        if (activeController === controller) {
            activeController = null;
        }
    }
});

const chatAgentSlice = createSlice({
    name: "chatAgent",
    initialState,
    reducers: {
        clearChat(state) {
            if (activeController) {
                activeController.abort();
                activeController = null;
            }
            state.lastQuery = "";
            state.answer = "";
            state.status = "idle";
            state.error = null;
        },
        setAnswer(state, action: PayloadAction<string>) {
            state.answer = action.payload;
        },
        appendAnswer(state, action: PayloadAction<string>) {
            state.answer += action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(submitForm.pending, (state, action) => {
                state.status = "loading";
                state.error = null;
                state.lastQuery = action.meta.arg;
                state.answer = "";
            })
            .addCase(streamChunk, (state, action) => {
                state.status = "streaming";
                state.answer += action.payload;
            })
            .addCase(submitForm.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.lastQuery = action.payload.query;
                state.answer = action.payload.answer;
            })
            .addCase(submitForm.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? action.error.message ?? "Request failed";
            });
    },
});

export const { clearChat, setAnswer, appendAnswer } = chatAgentSlice.actions;
export default chatAgentSlice.reducer;