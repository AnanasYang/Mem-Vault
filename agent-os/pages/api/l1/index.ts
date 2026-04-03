/**
 * L1 Layer API
 * /api/l1 - 获取所有L1情景记忆
 */

const dataApi = require('../../../lib/data-api');

export default function handler(req, res) {
  try {
    const memories = dataApi.getL1Memories();
    res.status(200).json(memories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
