const Subscription = require("../models/Subscription");

// Extend (or start) a user's subscription by a plan's interval. If the current
// subscription is still active, the new period is added on top of the existing
// due date (so paying early doesn't lose remaining days); otherwise it starts now.
async function activateOrExtend({ userId, plan, provider, paystackSubscriptionCode }) {
    let sub = await Subscription.findOne({ user: userId });
    if (!sub) sub = new Subscription({ user: userId });

    const now = Date.now();
    const base =
        sub.dueDate && sub.dueDate.getTime() > now ? sub.dueDate.getTime() : now;
    const intervalMs = (plan.intervalDays || 30) * 24 * 60 * 60 * 1000;

    sub.plan = plan._id;
    sub.planName = plan.name;
    sub.status = "active";
    if (!sub.startedAt || !(sub.dueDate && sub.dueDate.getTime() > now)) {
        sub.startedAt = new Date(now);
    }
    sub.dueDate = new Date(base + intervalMs);
    sub.provider = provider;
    if (paystackSubscriptionCode) sub.paystackSubscriptionCode = paystackSubscriptionCode;
    sub.cancelledAt = undefined;

    await sub.save();
    return sub;
}

// Pure helper (also unit-tested): compute the next due date.
function computeDueDate(currentDueDate, intervalDays, now = Date.now()) {
    const base = currentDueDate && currentDueDate.getTime() > now ? currentDueDate.getTime() : now;
    return new Date(base + intervalDays * 24 * 60 * 60 * 1000);
}

module.exports = { activateOrExtend, computeDueDate };
