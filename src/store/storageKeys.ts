// Centralized so Home and SymptomChecker (and any future screen that
// touches usage tracking or notifications) can never drift onto different
// key names or a different free-tier number. Previously Home read
// '@kallemind/monthly_uses' while Checker wrote to a completely different
// key ('kallemind_profile'), which is why the counter on Home never moved.

export const MONTHLY_USES_KEY = '@kallemind/monthly_uses';
export const HAS_UNREAD_NOTIFS_KEY = '@kallemind/has_unread_notifications';

// Keep this in sync with whatever your Subscription screen advertises as
// the free tier. If you ever change the free-check allowance, this is the
// only place it should need updating.
export const FREE_MONTHLY_LIMIT = 6;