/**
 * L2 Layer API
 * /api/l2 - 获取所有L2程序记忆
 */

const dataApi = require('../../../lib/data-api');

export default function handler(req, res) {
  try {
    const memories = dataApi.getL2Memories();
    res.status(200).json(memories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
