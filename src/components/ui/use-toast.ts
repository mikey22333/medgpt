import { toast as sonnerToast } from "sonner"

// Simple toast hook that wraps sonner
export function useToast() {
  return {
    toast: sonnerToast,
  }
}
