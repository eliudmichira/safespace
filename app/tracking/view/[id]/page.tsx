import TrackingViewClient from "./view-client"

export function generateStaticParams() {
  return [{ id: "_" }]
}

export default function Page() {
  return <TrackingViewClient />
}
