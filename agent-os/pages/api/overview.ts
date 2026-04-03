/**
 * Overview API
 * /api/overview - 获取完整记忆系统概览
 */

const dataApi = require('../../lib/data-api');

export default function handler(req, res) {
  try {
    const overview = dataApi.getMemoryOverview();
    res.status(200).json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
