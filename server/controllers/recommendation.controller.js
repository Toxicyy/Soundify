import recommendationService from "../services/RecommendationService.js";

export default {
  /**
   * Get personalized recommendations for user
   * Optionally excludes tracks already in queue/playing
   */
  async getRecommendations(req, res) {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      // Method 1: Pass queue state in request body
      const queueState = req.body?.queueState || null;

      const recommendations = await recommendationService.getRecommendations(
        userId,
        20, // limit
        queueState
      );

      res.json(recommendations);
    } catch (error) {
      console.error("Recommendation error:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  },

  /**
   * Alternative endpoint: Get recommendations excluding specific track IDs
   * Usage: POST /api/recommendations/excluding
   * Body: { userId: "...", excludeTrackIds: ["id1", "id2", ...] }
   */
  async getRecommendationsExcluding(req, res) {
    try {
      const { userId, excludeTrackIds = [] } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const recommendations =
        await recommendationService.getRecommendationsExcluding(
          userId,
          20,
          excludeTrackIds
        );

      res.json(recommendations);
    } catch (error) {
      console.error("Recommendation error:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  },
};
