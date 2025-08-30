import { createContext, useState, useContext } from "react"

const DraftsContext = createContext(null)

export const DraftsProvider = ({ children }) => {
    const [drafts, setDrafts] = useState([])

    const addDraft = (draft) => {
        setDrafts((prev) => [...prev, draft])
    }

    const addDrafts = (newDrafts) => {
        setDrafts((prev) => [...prev, ...newDrafts])
    }

    const updateDraft = (id, updatedData) => {
        setDrafts((prev) => 
        prev.map((d) => (d.draftId === id ? { ...d, ...updatedData } : d)))
    }

    const removeDraft = (id) => {
        setDrafts((prev) => prev.filter((d) => d.id !== id))
      }

    const clearDrafts = () => {
        setDrafts([]);
      };

    return (
        <DraftsContext.Provider value={{ drafts, addDraft, addDrafts, updateDraft, removeDraft, clearDrafts }}>
            {children}
        </DraftsContext.Provider>
    )
}

export function useDrafts() {
    return useContext(DraftsContext)
}