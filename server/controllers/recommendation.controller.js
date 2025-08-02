import recommendationService from "../services/RecommendationService.js";

export default {
  async getRecommendations(req, res) {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const recommendations = await recommendationService.getRecommendations(
        userId
      );
      res.json(recommendations);
    } catch (error) {
      console.error("Recommendation error:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  },
};
