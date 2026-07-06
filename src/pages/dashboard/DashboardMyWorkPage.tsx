import { useState } from 'react'
import { Tabs, type DashTab } from '../../components/dashboard/Tabs'
import { DashboardStoriesPage } from './DashboardStoriesPage'
import { DashboardIdeasPage } from './DashboardIdeasPage'
import { DashboardLibraryPage } from './DashboardLibraryPage'
import { DashboardMediaPage } from './DashboardMediaPage'
import { DashboardImportContentPage } from './DashboardImportContentPage'
import { DashboardImportSourcesPage } from './DashboardImportSourcesPage'

// My Work — one destination for everything a founder has made, instead of
// five separate nav items (Stories/Ideas/Library/Media/Import Content) that
// forced a founder to already know Village's internal data model to guess
// which page held what they wanted. Each tab renders the existing page
// component completely unmodified — no logic, no entities, no routes
// removed, just one shared entry point instead of five.

type WorkTab = 'stories' | 'ideas' | 'library' | 'files' | 'import'

const TABS: DashTab[] = [
  { key: 'stories', label: 'Stories' },
  { key: 'ideas',   label: 'Ideas'   },
  { key: 'library', label: 'Library' },
  { key: 'files',   label: 'Files'   },
  { key: 'import',  label: 'Import'  },
]

export function DashboardMyWorkPage() {
  const [tab, setTab] = useState<WorkTab>('stories')

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Tabs tabs={TABS} active={tab} onChange={key => setTab(key as WorkTab)} className="px-6 bg-white shrink-0" />
      <div className="flex-1 min-h-0">
        {tab === 'stories' && <DashboardStoriesPage />}
        {tab === 'ideas'   && <DashboardIdeasPage />}
        {tab === 'library' && <DashboardLibraryPage />}
        {tab === 'files'   && <DashboardMediaPage />}
        {tab === 'import'  && (
          <div className="h-full overflow-y-auto">
            <DashboardImportContentPage />
            <div className="border-t border-[#E8E4DD]">
              <DashboardImportSourcesPage />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
