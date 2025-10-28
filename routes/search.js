const express = require("express");
const router = express.Router();
const axios = require("axios");
const Listing = require("../models/listing");
const SearchInteraction = require("../models/SearchInteraction");

const BANDIT_BASE_URL = process.env.BANDIT_SERVICE_URL || "http://localhost:8001";

router.post("/rank", async (req, res) => {
  try {
    const { userId, searchFilters = {}, listingIds = [], query = "" } = req.body || {};
    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return res.status(400).json({ error: "listingIds[] required" });
    }
    const context = { filters: searchFilters, timeOfDay: new Date().getHours(), query };
    let rankedIds = listingIds;
    let explanations = {};
    try {
      const resp = await axios.post(
        `${BANDIT_BASE_URL}/rank`,
        { userId, listingIds, context },
        { timeout: 5000 }
      );
      if (resp.data && Array.isArray(resp.data.rankedIds)) {
        rankedIds = resp.data.rankedIds;
        explanations = resp.data.explanations || {};
      }
    } catch (_) {
      rankedIds = listingIds; // fallback to input order
    }
    // fetch listing docs in ranked order
    const docs = await Listing.find({ _id: { $in: rankedIds } });
    const byId = new Map(docs.map(d => [String(d._id), d]));
    const ordered = rankedIds.map(id => byId.get(String(id))).filter(Boolean);
    return res.json({ ranked: ordered.map(d => d.toObject()), explanations });
  } catch (e) {
    return res.status(500).json({ error: e.message || "failed" });
  }
});

router.post("/feedback", async (req, res) => {
  try {
    const { userId, listingId, action, context = {} } = req.body || {};
    if (!userId || !listingId || !action) {
      return res.status(400).json({ error: "userId, listingId, action required" });
    }
    const rewardMap = { view: 0.1, click: 0.3, book: 1.0 };
    const reward = rewardMap[action] ?? 0;
    await SearchInteraction.create({ userId, listingId, action, context, reward });
    // forward to bandit service (best-effort)
    try {
      await axios.post(`${BANDIT_BASE_URL}/feedback`, { userId, listingId, action, reward, context }, { timeout: 3000 });
    } catch (_) {}
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || "failed" });
  }
});

router.get("/analytics", async (req, res) => {
  try {
    const agg = await SearchInteraction.aggregate([
      { $group: { _id: "$listingId", clicks: { $sum: { $cond: [{ $eq: ["$action", "click"] }, 1, 0] } }, views: { $sum: { $cond: [{ $eq: ["$action", "view"] }, 1, 0] } }, bookings: { $sum: { $cond: [{ $eq: ["$action", "book"] }, 1, 0] } }, totalReward: { $sum: "$reward" } } },
      { $sort: { totalReward: -1 } },
      { $limit: 50 }
    ]);
    return res.json({ data: agg });
  } catch (e) {
    return res.status(500).json({ error: e.message || "failed" });
  }
});

module.exports = router;


