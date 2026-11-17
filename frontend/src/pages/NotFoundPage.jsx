import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

import EmptyState from '../components/EmptyState'

export default function NotFoundPage() {
  return (
    <div className="page page--narrow">
      <EmptyState
        icon={Compass}
        title="That page is not on the schedule"
        description="The link may be out of date. Return to the overview to pick up where you left off."
        action={
          <Link to="/" className="btn btn--primary">
            Back to overview
          </Link>
        }
      />
    </div>
  )
}
