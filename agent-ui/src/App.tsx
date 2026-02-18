import { useActionState, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { AppDispatch, RootState } from "./store/store"
import { submitForm } from "./features/chatAgentSlice/chatAgentSlice"

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const chat = useSelector((state: RootState) => state.chatAgent)
  const formRef = useRef<HTMLFormElement | null>(null)

  type FormState = { error: string | null }
  const [formState, formAction, isPending] = useActionState(
    async (_prevState: FormState, formData: FormData): Promise<FormState> => {
      const query = String(formData.get("query") ?? "").trim()
      if (!query) return { error: "Please enter a message." }

      try {
        await dispatch(submitForm(query)).unwrap()
        formRef.current?.reset()
        return { error: null }
      } catch (e) {
        const message = typeof e === "string" ? e : e instanceof Error ? e.message : "Request failed"
        return { error: message }
      }
    },
    { error: null }
  )

  return (
    <section className="min-h-screen gap-3 flex-col flex items-center justify-center w-full">
      <h1 className="text-4xl font-bold">
        Text the agent now
      </h1>
      <form ref={formRef} action={formAction} className="flex gap-3 items-center ">
        <input
          name="query"
          placeholder="Enter a message..."
          className="p-4 w-100 border border-gray-500/30"
          disabled={isPending}
        />

        <button
          type="submit"
          disabled={isPending}
          className="text-xl bg-black text-white rounded-md p-4 font-medium disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Send"}
        </button>
      </form>

      {(formState.error || chat.error) && (
        <p className="text-sm text-red-600">{formState.error ?? chat.error}</p>
      )}

      {chat.answer && (
        <div className="max-w-2xl w-full px-6">
          <p className="text-xs opacity-70">
            Agent reply{chat.status === "streaming" || chat.status === "loading" ? " (streaming)" : ""}:
          </p>
          <div className="border border-gray-500/30 p-4 mt-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {chat.answer}
            </ReactMarkdown>
          </div>
        </div>
      )}

    </section>
  )
}

export default App
