/**
 * L0 Layer API - Stats Endpoint
 * /api/l0/stats - 获取L0统计信息
 */

const dataApi = require('../../../lib/data-api');

export default function handler(req, res) {
  try {
    const stats = dataApi.getL0Stats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
