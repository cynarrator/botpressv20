import React from 'react'

// Simple context menu replacement without Blueprint.js to avoid process.env dependency
// Disabled for now to avoid the "process is not defined" error from Blueprint.js
export const showContextMenu = (e: React.MouseEvent<HTMLDivElement>, props: any) => {
  // Context menu is disabled in lite view to avoid Blueprint.js dependency
  // Custom actions can be re-enabled once a non-Blueprint solution is implemented
  e.preventDefault()
}
