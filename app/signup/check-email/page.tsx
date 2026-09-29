import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink p-6">
      <div className="w-full max-w-sm bg-panel rounded-xl p-10 pb-8 shadow-2xl text-center">
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="12" stroke="#A9814F" strokeWidth="1.4" />
            <path d="M13 4 L13 8 M13 18 L13 22 M4 13 L8 13 M18 13 L22 13" stroke="#A9814F" strokeWidth="1.4" />
            <circle cx="13" cy="13" r="3" fill="#A9814F" />
          </svg>
          <span className="font-serif text-lg font-semibold text-ink">EstateFirm OS</span>
        </div>
        <h1 className="font-serif text-lg font-semibold text-ink mb-2">Check your email</h1>
        <p className="text-sm text-ink-soft">
          We&rsquo;ve sent a confirmation link to the email address you signed up with. Click it, then come back
          and sign in &mdash; your firm&rsquo;s workspace will be set up automatically on your first visit.
        </p>
        <Link href="/login" className="inline-block mt-6 text-sm text-brass-deep font-medium">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
