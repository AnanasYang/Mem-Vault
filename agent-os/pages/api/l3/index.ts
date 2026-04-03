/**
 * L3 Layer API
 * /api/l3 - 获取所有L3语义记忆
 */

const dataApi = require('../../../lib/data-api');

export default function handler(req, res) {
  try {
    const memories = dataApi.getL3Memories();
    res.status(200).json(memories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
