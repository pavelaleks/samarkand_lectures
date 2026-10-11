import { useDemoMode } from './LabReportContext'

/** Hides student-assignment chrome when the page is in lecture demo mode. */
export default function StudentGate({ children, fallback = null }) {
  const isDemo = useDemoMode()
  if (isDemo) return fallback
  return children
}
